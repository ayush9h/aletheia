"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeeklyTokens {
  day: string;
  tokens: number;
}

interface WeeklyTokensChartProps {
  data: WeeklyTokens[];
}

const formatTokens = (value: number) =>
  value.toLocaleString("en-US");

const formatAxisValue = (value: number) => {
  if (value === 0) return "0";
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
};

export default function WeeklyTokensChart({
  data,
}: WeeklyTokensChartProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 shrink-0">
        <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
          Last 7 days
        </p>
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 8,
              right: 8,
              left: 0,
              bottom: 0,
            }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              vertical={false}
              stroke="currentColor"
              strokeDasharray="3 4"
              className="text-stone-200 dark:text-stone-800"
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              width={40}
              tickMargin={6}
              domain={[0, "auto"]}
              allowDecimals={false}
              tick={{ fontSize: 10 }}
              tickFormatter={formatAxisValue}
              className="fill-stone-400 dark:fill-stone-500"
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tick={{ fontSize: 11 }}
              className="fill-stone-400 dark:fill-stone-500"
            />

            <Tooltip
              cursor={{
                fill: "currentColor",
                opacity: 0.035,
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) {
                  return null;
                }

                const item = payload[0]?.payload as
                  | WeeklyTokens
                  | undefined;

                if (!item) {
                  return null;
                }

                return (
                  <div className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-lg dark:border-stone-700 dark:bg-stone-900">
                    <p className="text-[11px] font-medium text-stone-900 dark:text-stone-100">
                      {item.day}
                    </p>

                    <p className="mt-1 text-sm font-medium text-blue-500">
                      {formatTokens(item.tokens)}{" "}
                      <span className="text-xs font-normal text-stone-400 dark:text-stone-500">
                        tokens
                      </span>
                    </p>
                  </div>
                );
              }}
            />

            <Bar
              dataKey="tokens"
              maxBarSize={42}
              radius={[6, 6, 2, 2]}
              minPointSize={0}
            >
              {data.map((item) => (
                <Cell
                  key={item.day}
                  fill="#3b82f6"
                  opacity={item.tokens > 0 ? 0.85 : 0.08}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
