"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Clock3,
  MessageSquare,
  Hash,
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

import WeeklyActivityChart from "./weeklyChart";
interface AnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyAnalytics: AnalyticsResponse = {
  total_conversations: 0,
  messages_sent: 0,
  average_session: "0s",
  active_days: 0,
  tokens_consumed: 0,
  weekly_activity: [
    { day: "Mon", messages: 0 },
    { day: "Tue", messages: 0 },
    { day: "Wed", messages: 0 },
    { day: "Thu", messages: 0 },
    { day: "Fri", messages: 0 },
    { day: "Sat", messages: 0 },
    { day: "Sun", messages: 0 },
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
    weekly_activity:
      data?.weekly_activity?.length > 0
        ? data.weekly_activity
        : emptyAnalytics.weekly_activity,
    active_days: data?.active_days ?? 0,
  };
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

  const stats = [
    {
      label: "Total conversations",
      value: analytics.total_conversations,
      icon: MessageSquare,
    },
    {
      label: "Messages sent",
      value: analytics.messages_sent,
      icon: BarChart3,
    },
    {
      label: "Average session",
      value: analytics.average_session,
      icon: Clock3,
    },
    {
      label: "Active days",
      value: analytics.active_days,
      icon: CalendarDays,
    },
    {label:"Tokens Consumed", value: analytics.tokens_consumed, icon: Hash}
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="font-paragraph h-[85dvh] max-h-[85dvh] w-[calc(100%-1.5rem)] max-w-2xl overflow-hidden border-stone-200 p-0 text-stone-900 dark:border-stone-700/50 dark:bg-stone-800/50 dark:text-stone-100 sm:w-[calc(100%-2rem)]"
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* Header */}
          <div
            className="shrink-0 border-b border-stone-200 bg-stone-50 px-5 py-4 dark:border-stone-700/50 dark:bg-stone-950 sm:px-6"
          >
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base font-medium">
                Analytics
              </DialogTitle>

              <DialogDescription className="text-xs text-stone-500 dark:text-stone-400">
                Overview of your Aletheia usage and activity.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <main
            className="
              min-h-0
              flex-1
              overflow-y-auto
              bg-white
              p-4
              dark:bg-stone-900
              sm:p-6
            "
          >
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Loading analytics...
                </span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overview */}
                <section>
                  <h3 className="mb-3 text-xs font-medium text-stone-500 dark:text-stone-400">
                    Overview
                  </h3>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {stats.map(({ label, value, icon: Icon }) => (
                      <div
                        key={label}
                          className="rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700/60 dark:bg-stone-800/50"
                      >
                        <Icon
                          aria-hidden="true"
                          className="
                            mb-3
                            size-4
                            text-stone-500
                            dark:text-stone-400
                          "
                        />

                        <div
                          className="text-lg font-medium text-stone-900 dark:text-stone-100"
                        >
                          {value}
                        </div>

                        <div
                          className="mt-1 text-[11px] leading-4 text-stone-500 dark:text-stone-400"
                        >
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Weekly Activity */}
                <section
                  className="rounded-lg border border-stone-200 dark:border-stone-700/60"
                >
                  <div
                    className="border-b border-stone-200 px-4 py-3 dark:border-stone-700/60"
                  >
                    <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      Weekly activity
                    </h3>

                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      Your message activity over the last seven days.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5">
                    <WeeklyActivityChart
                      data={analytics.weekly_activity ?? []}
                    />
                  </div>
                </section>


              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
