"use client";

import { memo, useRef } from "react";
import { DownloadIcon } from "@radix-ui/react-icons";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartType = "bar" | "line" | "area" | "pie";

export interface ChartSpec {
  type: ChartType;
  title?: string;
  xKey: string;
  series: string[];
  data: Record<string, string | number>[];
}

const CHART_TYPES = new Set<ChartType>(["bar", "line", "area", "pie"]);

// Tailwind drops unused vars
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4"];

// Null if invalid/partial
export function parseChartSpec(raw: string): ChartSpec | null {
  try {
    const spec = JSON.parse(raw);
    const valid =
      CHART_TYPES.has(spec?.type) &&
      typeof spec.xKey === "string" &&
      Array.isArray(spec.series) &&
      spec.series.length > 0 &&
      spec.series.every((key: unknown) => typeof key === "string") &&
      Array.isArray(spec.data) &&
      spec.data.length > 0 &&
      spec.data.every((row: unknown) => row !== null && typeof row === "object");
    return valid ? spec : null;
  } catch {
    return null;
  }
}

const AXIS_PROPS = {
  axisLine: false,
  tickLine: false,
  tick: { fontSize: 11 },
  className: "fill-stone-400 dark:fill-stone-500",
} as const;

const TOOLTIP_PROPS = {
  contentStyle: { borderRadius: 8, fontSize: 12 },
  cursor: { fill: "currentColor", opacity: 0.035 },
} as const;

function renderChart({ type, xKey, series, data }: ChartSpec) {
  if (type === "pie") {
    return (
      <PieChart>
        <Pie data={data} dataKey={series[0]} nameKey={xKey} outerRadius="80%" isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP_PROPS} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    );
  }

  const Chart = { bar: BarChart, line: LineChart, area: AreaChart }[type];
  const grid = (
    <CartesianGrid
      vertical={false}
      stroke="currentColor"
      strokeDasharray="3 4"
      className="text-stone-200 dark:text-stone-800"
    />
  );

  return (
    <Chart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
      {grid}
      <XAxis dataKey={xKey} tickMargin={10} {...AXIS_PROPS} />
      <YAxis width={48} {...AXIS_PROPS} />
      <Tooltip {...TOOLTIP_PROPS} />
      {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
      {/* Zoom for long series */}
      {data.length > 12 && (
        <Brush
          dataKey={xKey}
          height={12}
          stroke="#a8a29e"
          fill="transparent"
          travellerWidth={6}
          tickFormatter={() => ""}
        />
      )}
      {/* Virtuoso remounts on scroll */}
      {series.map((key, i) => {
        const color = COLORS[i % COLORS.length];
        if (type === "bar") return <Bar key={key} dataKey={key} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />;
        if (type === "line") return <Line key={key} dataKey={key} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />;
        return <Area key={key} dataKey={key} stroke={color} fill={color} fillOpacity={0.15} isAnimationActive={false} />;
      })}
    </Chart>
  );
}

// SVG to 2x PNG
async function downloadPng(svg: SVGSVGElement, name: string) {
  const { width, height } = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }),
  );

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const link = document.createElement("a");
    link.download = `${name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

const ChartBlock = memo(function ChartBlock({ spec }: { spec: ChartSpec }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const label = spec.title ?? `${spec.type} chart`;

  const handleDownload = async () => {
    // Skip legend icon svgs
    const svg = chartRef.current?.querySelector<SVGSVGElement>(".recharts-wrapper > svg");
    if (!svg) return;
    try {
      await downloadPng(svg, label.replace(/[^\w-]+/g, "_"));
    } catch (error) {
      console.error("Chart download failed:", error);
    }
  };

  return (
    <figure className="my-4 rounded-lg border border-stone-200 p-4 dark:border-stone-800">
      <div className="mb-3 flex items-center justify-between gap-2">
        <figcaption className="text-xs font-medium text-stone-900 dark:text-stone-100">
          {spec.title}
        </figcaption>
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Download chart as PNG"
          title="Download PNG"
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          <span>PNG</span>
        </button>
      </div>
      <div ref={chartRef} className="h-72" role="img" aria-label={label}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(spec)}
        </ResponsiveContainer>
      </div>
    </figure>
  );
});

export default ChartBlock;
