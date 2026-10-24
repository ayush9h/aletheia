"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  CircleAlert,
  CircleCheck,
  Clock3,
  MessageSquare,
  MessagesSquare,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  getUserAnalytics,
  getUserUsage,
  type AnalyticsResponse,
  type UsageResponse,
} from "@/lib/api/user-data";
import { cn, getMonthlyResetDate } from "@/lib/utils";

import WeeklyTokensChart from "@/features/analytics/components/weekly-chart";

interface AnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyAnalytics: AnalyticsResponse = {
  total_conversations: 0,
  messages_sent: 0,
  average_session: "0s",
  tokens_consumed: 0,
  weekly_tokens: [
    { day: "Mon", tokens: 0 },
    { day: "Tue", tokens: 0 },
    { day: "Wed", tokens: 0 },
    { day: "Thu", tokens: 0 },
    { day: "Fri", tokens: 0 },
    { day: "Sat", tokens: 0 },
    { day: "Sun", tokens: 0 },
  ],
};

function normalizeAnalytics(
  data: Partial<AnalyticsResponse> | null | undefined,
): AnalyticsResponse {
  return {
    total_conversations: data?.total_conversations ?? 0,
    messages_sent: data?.messages_sent ?? 0,
    average_session: data?.average_session ?? "0s",
    tokens_consumed: data?.tokens_consumed ?? 0,
    weekly_tokens: data?.weekly_tokens?.length
      ? data.weekly_tokens
      : emptyAnalytics.weekly_tokens,
  };
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

const usageStatus = {
  ok: {
    icon: CircleCheck,
    label: "On track",
    bar: "bg-brand-500",
    pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  warning: {
    icon: TriangleAlert,
    label: "Approaching limit",
    bar: "bg-amber-500",
    pill: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
  },
  reached: {
    icon: CircleAlert,
    label: "Limit reached",
    bar: "bg-red-500",
    pill: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  },
};

function MonthlyUsageCard({ usage }: { usage: UsageResponse }) {
  const ratio = usage.tokens_used / usage.token_limit;
  const remaining = Math.max(usage.token_limit - usage.tokens_used, 0);
  const status =
    ratio >= 1 ? usageStatus.reached : ratio >= 0.8 ? usageStatus.warning : usageStatus.ok;
  const StatusIcon = status.icon;

  const resetDate = getMonthlyResetDate();
  const daysToReset = Math.ceil((resetDate.getTime() - Date.now()) / 86_400_000);
  const resetLabel = resetDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Monthly tokens
          </p>

          <p className="mt-1.5 text-3xl font-medium tracking-[-0.04em] text-stone-950 dark:text-white">
            {formatNumber(usage.tokens_used)}
            <span className="ml-1.5 text-sm font-normal tracking-normal text-stone-500 dark:text-stone-400">
              / {formatNumber(usage.token_limit)}
            </span>
          </p>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            status.pill,
          )}
        >
          <StatusIcon className="size-3.5" aria-hidden />
          {status.label}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Monthly token usage"
        aria-valuemin={0}
        aria-valuemax={usage.token_limit}
        aria-valuenow={Math.min(usage.tokens_used, usage.token_limit)}
        className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", status.bar)}
          style={{ width: `${Math.min(ratio, 1) * 100}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
        <span>
          {ratio >= 1
            ? "You can send new messages once your limit resets."
            : `${formatNumber(remaining)} tokens left · ${Math.floor(ratio * 100)}% used`}
        </span>

        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="size-3.5" aria-hidden />
          Resets {resetLabel} ({daysToReset} {daysToReset === 1 ? "day" : "days"})
        </span>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-950/50 dark:text-brand-400">
        <Icon className="size-4" aria-hidden />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs text-stone-500 dark:text-stone-400">
          {label}
        </p>

        <p className="text-xl font-medium tracking-[-0.03em] text-stone-950 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100">
        {title}
      </h3>

      {hint && (
        <p className="text-xs text-stone-500 dark:text-stone-400">{hint}</p>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading analytics">
      <div className="h-36 rounded-2xl bg-stone-100 dark:bg-stone-900" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[70px] rounded-2xl bg-stone-100 dark:bg-stone-900" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-stone-100 dark:bg-stone-900" />
    </div>
  );
}

export default function AnalyticsDialog({
  open,
  onOpenChange,
}: AnalyticsDialogProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [analytics, setAnalytics] =
    useState<AnalyticsResponse>(emptyAnalytics);

  const [usage, setUsage] = useState<UsageResponse | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    let cancelled = false;

    const loadAnalytics = async () => {
      setLoading(true);

      try {
        const [data, usageData] = await Promise.all([
          getUserAnalytics(userId),
          getUserUsage(userId).catch(() => null),
        ]);

        if (!cancelled) {
          setAnalytics(normalizeAnalytics(data));
          setUsage(usageData);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);

        if (!cancelled) {
          setAnalytics(emptyAnalytics);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const weekTotal = analytics.weekly_tokens.reduce((sum, d) => sum + d.tokens, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-paragraph max-h-[88dvh] w-[calc(100%-1rem)] max-w-2xl overflow-hidden rounded-2xl border-stone-200 bg-white p-0 text-stone-900 shadow-2xl dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 sm:w-[calc(100%-2rem)]">
        <div className="flex max-h-[88dvh] min-h-0 flex-col">
          <div className="shrink-0 border-b border-stone-200 px-5 py-5 dark:border-stone-800 sm:px-7">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-medium tracking-tight">
                Analytics
              </DialogTitle>

              <DialogDescription className="text-xs text-stone-500 dark:text-stone-400">
                Your plan usage and recent activity.
              </DialogDescription>
            </DialogHeader>
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <div className="space-y-7">
                {usage && (
                  <section>
                    <SectionHeading title="This month" />
                    <MonthlyUsageCard usage={usage} />
                  </section>
                )}

                <section>
                  <SectionHeading title="Activity" hint="All time" />

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MetricCard
                      icon={MessagesSquare}
                      label="Conversations"
                      value={formatNumber(analytics.total_conversations)}
                    />

                    <MetricCard
                      icon={MessageSquare}
                      label="Messages sent"
                      value={formatNumber(analytics.messages_sent)}
                    />

                    <MetricCard
                      icon={Clock3}
                      label="Avg. session"
                      value={analytics.average_session}
                    />
                  </div>
                </section>

                <section>
                  <SectionHeading
                    title="Tokens, last 7 days"
                    hint={`${formatNumber(weekTotal)} total`}
                  />

                  <div className="rounded-2xl border border-stone-200 p-4 dark:border-stone-800">
                    {weekTotal === 0 ? (
                      <div className="flex h-56 flex-col items-center justify-center gap-1 text-center">
                        <p className="text-sm text-stone-700 dark:text-stone-300">
                          No activity this week
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          Start a chat and your daily usage will show up here.
                        </p>
                      </div>
                    ) : (
                      <div className="h-56">
                        <WeeklyTokensChart data={analytics.weekly_tokens} />
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                    {formatNumber(analytics.tokens_consumed)} tokens used all time
                  </p>
                </section>
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
