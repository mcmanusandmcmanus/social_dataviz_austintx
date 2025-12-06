"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type IssueChartProps = {
  data: { label: string; count: number }[];
};

export function IssueChart({ data }: IssueChartProps) {
  const parsed = data.map((item) => ({
    ...item,
    shortLabel: item.label.length > 14 ? `${item.label.slice(0, 13)}…` : item.label,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={parsed} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="shortLabel"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "#0c1018",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              color: "#f6f7fb",
            }}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />
          <Bar dataKey="count" radius={[6, 6, 6, 6]} fill="#7df3ff" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
