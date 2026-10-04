"use client";

import { useEffect, useState } from "react";
import {
  Clock3,
  Hash,
  MessageSquare,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

import {
  getUserAnalytics,
  type AnalyticsResponse,
} from "@/app/lib/api/userData";

import WeeklyTokensChart from "./weeklyChart";

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

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description: string;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}: MetricCardProps) {
  return (
    <div className="group relative flex min-h-0 h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 dark:border-stone-800 dark:from-stone-900 dark:via-stone-900 dark:to-blue-950/30">
      <div className="absolute -right-8 -top-8 size-24 rounded-full bg-blue-500/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-500 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-400">
          <Icon className="size-4" />
        </div>

        <span className="truncate pt-1 text-[11px] text-stone-400 dark:text-stone-500">
          {label}
        </span>
      </div>

      <div className="relative mt-auto pt-5">
        <p className="text-3xl font-medium tracking-[-0.045em] text-stone-950 dark:text-white">
          {value}
        </p>

        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {description}
        </p>
      </div>
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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    let cancelled = false;

    const loadAnalytics = async () => {
      setLoading(true);

      try {
        const data = await getUserAnalytics(userId);

        if (!cancelled) {
          setAnalytics(normalizeAnalytics(data));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-paragraph h-[88dvh] max-h-[88dvh] w-[calc(100%-1rem)] max-w-3xl overflow-hidden rounded-2xl border-stone-200 bg-white p-0 text-stone-900 shadow-2xl dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 sm:w-[calc(100%-2rem)]">
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-stone-200 bg-stone-50/70 px-5 py-5 backdrop-blur dark:border-stone-800 dark:bg-stone-950/70 sm:px-7">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-medium tracking-tight">
                Analytics
              </DialogTitle>

              <DialogDescription className="text-xs text-stone-500 dark:text-stone-400">
                Overview of your Aletheia usage and activity.
              </DialogDescription>
            </DialogHeader>
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-6 dark:bg-stone-950 sm:px-7 sm:py-7">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <span className="size-4 animate-spin rounded-full border-2 border-stone-200 border-t-stone-700 dark:border-stone-700 dark:border-t-stone-200" />
                  Loading analytics...
                </div>
              </div>
            ) : (
              <section>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    Overview
                  </h3>

                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    Your usage across conversations.
                  </p>
                </div>

                <div className="grid items-stretch gap-3 lg:grid-cols-[1.5fr_1fr]">
                  <div className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900">
                    <div className="flex shrink-0 items-start justify-between px-5 pt-5">
                      <div>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          Token usage
                        </p>

                        <p className="mt-2 text-4xl font-medium tracking-[-0.05em] text-stone-950 dark:text-white">
                          {formatNumber(analytics.tokens_consumed)}
                        </p>

                        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                          Total tokens consumed
                        </p>
                      </div>

                      <div className="flex size-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 shadow-sm dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
                        <Hash className="size-4" />
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 px-5 pb-5 pt-6">
                      <WeeklyTokensChart data={analytics.weekly_tokens} />
                    </div>
                  </div>

                  <div className="grid min-h-[620px] grid-rows-3 gap-3">
                    <MetricCard
                      icon={MessagesSquare}
                      label="Conversations"
                      value={analytics.total_conversations}
                      description="Total conversations"
                    />

                    <MetricCard
                      icon={MessageSquare}
                      label="Messages"
                      value={analytics.messages_sent}
                      description="Messages sent"
                    />

                    <MetricCard
                      icon={Clock3}
                      label="Average session"
                      value={analytics.average_session}
                      description="Average conversation duration"
                    />
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
