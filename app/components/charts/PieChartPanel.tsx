"use client";
import { useMemo } from "react";
import { useJobs } from "../../lib/jobStore";
// Recharts primitives
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

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

  // Custom label with panhandle underline and matching color
  const renderSliceLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, name, value, percent, index } = props;
    const RAD = Math.PI / 180;
    const color = COLORS[index % COLORS.length];
    
    // Calculate coordinates
    const sin = Math.sin(-midAngle * RAD);
    const cos = Math.cos(-midAngle * RAD);
    
    // Start point on slice edge
    const sx = cx + outerRadius * cos;
    const sy = cy + outerRadius * sin;
    
    // Elbow point (move out)
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    
    // Text content and estimated width
    const textStr = `${name} (${value}, ${(percent * 100).toFixed(1)}%)`;
    // Estimate width: ~7.5px per char for 14px font (approximate)
    const textWidth = textStr.length * 7.5; 
    
    // End point (horizontal extension)
    // If on right side (cos >= 0), extend right. Else left.
    const ex = mx + (cos >= 0 ? 1 : -1) * (textWidth + 10); // +10 for padding
    
    // Text anchor
    const textAnchor = cos >= 0 ? "start" : "end";
    // Text position: slightly offset from elbow to align with underline
    const textX = mx + (cos >= 0 ? 1 : -1) * 5;

    return (
      <g>
        {/* Panhandle Line */}
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${my}`}
          stroke={color}
          fill="none"
          strokeWidth={1}
        />
        {/* Label Text */}
        <text
          x={textX}
          y={my}
          dy={-4} // Lift text above the line
          textAnchor={textAnchor}
          fill={color} // Match slice color
          fontSize={14}
          fontWeight={500}
        >
          {textStr}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer>
        <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            label={renderSliceLabel}
            labelLine={false} // Disable default line, we draw our own
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${entry.name}-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val: any, name: any, ctx: any) => [`${val} (${ctx.payload.pct.toFixed(1)}%)`, name]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
