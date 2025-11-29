"use client";
import { useMemo } from "react";
import { useJobs } from "../../lib/jobStore";
// Recharts primitives
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

type Metric = "work_mode" | "state" | "country" | "status";

export default function PieChartPanel({ metric }: { metric: Metric }) {
  const { jobs } = useJobs();

  const data = useMemo(() => {
    const counts = new Map<string, number>();

    function inc(key: string | undefined | null) {
      const k = (key || "Unknown").trim();
      counts.set(k, (counts.get(k) || 0) + 1);
    }

    for (const j of jobs) {
      if (metric === "work_mode") inc(j.work_mode);
      else if (metric === "status") inc(j.status);
      else if (metric === "state") {
        // derive state from location: City, State, Country
        const parts = (j.location || "").split(",").map(p => p.trim()).filter(Boolean);
        inc(parts[1]); // State slot
      } else if (metric === "country") {
        const parts = (j.location || "").split(",").map(p => p.trim()).filter(Boolean);
        inc(parts.at(-1)); // last part as country
      }
    }

    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value, pct: (value / total) * 100 }))
      .sort((a, b) => b.value - a.value);
  }, [jobs, metric]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6", "#84cc16", "#e11d48"];

  return (
    <div className="w-full h-[360px]">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${entry.name}-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val: any, name: any, ctx: any) => [`${val} (${ctx.payload.pct.toFixed(1)}%)`, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
