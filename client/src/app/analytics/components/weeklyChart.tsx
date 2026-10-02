"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

interface WeeklyActivity {
  day: string;
  messages: number;
}

interface WeeklyActivityChartProps {
  data: WeeklyActivity[];
}

export default function WeeklyActivityChart({
  data,
}: WeeklyActivityChartProps) {
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 8,
            right: 4,
            left: 4,
            bottom: 0,
          }}
          barCategoryGap="28%"
        >
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
            }}
            className="fill-stone-500 dark:fill-stone-400"
          />

          <Tooltip
            cursor={{
              fill: "currentColor",
              opacity: 0.04,
            }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) {
                return null;
              }

              const item = payload[0]?.payload as
                | WeeklyActivity
                | undefined;

              if (!item) {
                return null;
              }

              return (
                <div className="rounded-md border border-stone-200 bg-white px-3 py-2 shadow-sm dark:border-stone-700 dark:bg-stone-900">
                  <p className="text-xs font-medium text-stone-900 dark:text-stone-100">
                    {item.day}
                  </p>

                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    {item.messages}{" "}
                    {item.messages === 1 ? "message" : "messages"}
                  </p>
                </div>
              );
            }}
          />

          <Bar
            dataKey="messages"
            radius={[4, 4, 0, 0]}
            fill="currentColor"
            className="fill-stone-300 dark:fill-stone-600"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
