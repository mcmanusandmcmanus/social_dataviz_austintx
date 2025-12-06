"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TimelineChartProps = {
  data: { hour: number; count: number }[];
};

const formatHour = (hour: number) =>
  `${((hour + 11) % 12) + 1}${hour < 12 ? "a" : "p"}`;

export function TimelineChart({ data }: TimelineChartProps) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7df3ff" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#7df3ff" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
            padding={{ left: 6, right: 6 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            labelFormatter={(value) => `Hour ${formatHour(Number(value))}`}
            formatter={(value: number) => [`${value} incidents`, "Volume"]}
            contentStyle={{
              background: "#0c1018",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              color: "#f6f7fb",
            }}
            cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
          />
          <Area
            dataKey="count"
            stroke="#7df3ff"
            fill="url(#spark)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
