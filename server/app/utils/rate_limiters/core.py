import hashlib
import math
import uuid
from collections.abc import Sequence
from dataclasses import dataclass

from redis import Redis
from redis.exceptions import RedisError


@dataclass(frozen=True)
class RateLimitPolicy:
    name: str
    limit: int
    window_seconds: int
    cost: int = 1

    def __post_init__(self) -> None:
        if not self.name:
            raise ValueError("Policy name cannot be empty")

        if self.limit <= 0:
            raise ValueError("Limit cannot be zero")

        if self.window_seconds <= 0:
            raise ValueError("window seconds cannot be zero")

        if self.cost <= 0:
            raise ValueError("Cost cannot be zero")

        if self.cost >= self.limit:
            raise ValueError(f"Policy cost {self.cost} exceeds limit {self.limit}")


@dataclass(frozen=True, slots=True)
class RateLimitDecision:
    allowed: bool
    retry_after_seconds: int
    limits: dict[str, int]
    used: dict[str, int]
    remaining: dict[str, int]


POLICY_SCRIPT = """
local request_id = ARGV[1]
local policy_count = tonumber(ARGV[2])

local redis_time = redis.call("TIME")
local now_ms =
    (tonumber(redis_time[1]) * 1000) +
    math.floor(tonumber(redis_time[2]) / 1000)

local all_allowed = 1
local maximum_retry_after_ms = 0

local current_usage = {}
local policy_limits = {}
local policy_windows = {}
local policy_costs = {}

for i = 1, policy_count do
    local key_offset = (i - 1) * 2
    local argument_offset = 3 + ((i - 1) * 3)

    local events_key = KEYS[key_offset + 1]
    local total_key = KEYS[key_offset + 2]

    local limit = tonumber(ARGV[argument_offset])
    local window_ms = tonumber(ARGV[argument_offset + 1])
    local cost = tonumber(ARGV[argument_offset + 2])
    local cutoff_ms = now_ms - window_ms
    local ttl_ms = window_ms + 1000

    policy_limits[i] = limit
    policy_windows[i] = window_ms
    policy_costs[i] = cost

    local expired_members = redis.call(
        "ZRANGEBYSCORE",
        events_key,
        "-inf",
        cutoff_ms
    )

    local expired_cost = 0

    for _, member in ipairs(expired_members) do
        local member_cost = tonumber(
            string.match(member, "^(%d+):")
        ) or 0

        expired_cost = expired_cost + member_cost
    end

    if #expired_members > 0 then
        redis.call(
            "ZREMRANGEBYSCORE",
            events_key,
            "-inf",
            cutoff_ms
        )
    end

    local event_count = redis.call("ZCARD", events_key)
    local stored_total = redis.call("GET", total_key)
    local total = 0

    if event_count > 0 then
        if stored_total then
            total = math.max(
                0,
                tonumber(stored_total) - expired_cost
            )
        else
            local active_members = redis.call(
                "ZRANGE",
                events_key,
                0,
                -1
            )

            for _, member in ipairs(active_members) do
                local member_cost = tonumber(
                    string.match(member, "^(%d+):")
                ) or 0

                total = total + member_cost
            end
        end
    end

    current_usage[i] = total

    redis.call(
        "SET",
        total_key,
        total,
        "PX",
        ttl_ms
    )

    if total + cost > limit then
        all_allowed = 0

        local capacity_needed = total + cost - limit
        local capacity_released = 0

        local entries = redis.call(
            "ZRANGE",
            events_key,
            0,
            -1,
            "WITHSCORES"
        )

        local retry_after_ms = window_ms

        for entry_index = 1, #entries, 2 do
            local member = entries[entry_index]
            local score = tonumber(entries[entry_index + 1])

            local member_cost = tonumber(
                string.match(member, "^(%d+):")
            ) or 0

            capacity_released =
                capacity_released + member_cost

            if capacity_released >= capacity_needed then
                retry_after_ms = math.max(
                    0,
                    score + window_ms - now_ms
                )

                break
            end
        end

        maximum_retry_after_ms = math.max(
            maximum_retry_after_ms,
            retry_after_ms
        )
    end
end


if all_allowed == 1 then
    for i = 1, policy_count do
        local key_offset = (i - 1) * 2

        local events_key = KEYS[key_offset + 1]
        local total_key = KEYS[key_offset + 2]

        local window_ms = policy_windows[i]
        local cost = policy_costs[i]
        local ttl_ms = window_ms + 1000

        local member =
            tostring(cost) ..
            ":" ..
            request_id ..
            ":" ..
            tostring(i)

        redis.call(
            "ZADD",
            events_key,
            now_ms,
            member
        )

        local new_total = redis.call(
            "INCRBY",
            total_key,
            cost
        )

        current_usage[i] = new_total

        redis.call("PEXPIRE", events_key, ttl_ms)
        redis.call("PEXPIRE", total_key, ttl_ms)
    end
end

local response = {
    all_allowed,
    maximum_retry_after_ms
}

for i = 1, policy_count do
    table.insert(response, current_usage[i])
end

return response
"""


class RedisSlidingWindowLimiter:
    def __init__(self, redis: Redis, key_prefix: str = "rate-limit"):
        self.redis = redis
        self.key_prefix = key_prefix
        self._script = redis.register_script(POLICY_SCRIPT)

    async def acquire(
        self, *, group: str, policies: Sequence[RateLimitPolicy]
    ) -> RateLimitDecision:
        if not policies:
            raise ValueError("atleast one policy is required")

        group_hash = hashlib.sha256(group.encode("utf-8")).hexdigest()[:32]
        redis_keys: list[str] = []
        script_arguments: list[str | int] = [
            uuid.uuid4().hex,
            len(policies),
        ]

        for policy in policies:
            base_key = f"{self.key_prefix}:" f"{{{group_hash}}}:" f"{policy.name}"

            redis_keys.extend(
                [
                    f"{base_key}:events",
                    f"{base_key}:total",
                ]
            )

            script_arguments.extend(
                [
                    policy.limit,
                    policy.window_seconds * 1000,
                    policy.cost,
                ]
            )

        try:
            raw_result = await self._script(
                keys=redis_keys,
                args=script_arguments,
            )
        except RedisError as exc:
            raise RuntimeError(f"Error occurred due to {exc}")

        allowed = bool(int(raw_result[0]))
        retry_after_ms = int(raw_result[1])

        limits: dict[str, int] = {}
        used: dict[str, int] = {}
        remaining: dict[str, int] = {}

        for index, policy in enumerate(policies):
            current_usage = int(raw_result[index + 2])

            limits[policy.name] = policy.limit
            used[policy.name] = current_usage
            remaining[policy.name] = max(
                0,
                policy.limit - current_usage,
            )

        return RateLimitDecision(
            allowed=allowed,
            retry_after_seconds=math.ceil(retry_after_ms / 1000),
            limits=limits,
            used=used,
            remaining=remaining,
        )
