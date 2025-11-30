"use client";
import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { useJobs } from "../../lib/jobStore";

type XMetric = "state" | "city" | "country" | "work_mode";
const STATUS_KEYS = ["Pre-interview", "Interview", "Offer", "Rejected"] as const;

// Distinct column colors (looped)
const BUCKET_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#84cc16", // lime
  "#e11d48", // rose
  "#22c55e", // emerald
  "#f97316", // orange
];

function parseLocation(raw?: string | null) {
  const parts = (raw || "").split(",").map((p) => p.trim()).filter(Boolean);
  const city = parts[0] || "";
  const state = parts[1] || "";
  const country = parts.length ? parts[parts.length - 1] : "";
  return { city, state, country };
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: 8, boxShadow: "0 6px 14px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{String(label)}</div>
      <div>Total: {p.total}</div>
      <div style={{ marginTop: 6, fontSize: 12, color: "#334155" }}>Breakdown:</div>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
        <li>Pre-interview: {p["Pre-interview"] ?? 0}</li>
        <li>Interview: {p["Interview"] ?? 0}</li>
        <li>Offer: {p["Offer"] ?? 0}</li>
        <li>Rejected: {p["Rejected"] ?? 0}</li>
      </ul>
    </div>
  );
}

export default function BarChartPanel({ xMetric }: { xMetric: XMetric }) {
  const { jobs } = useJobs();

  const { data } = useMemo(() => {
    const byX: Record<
      string,
      { label: string; total: number } & Record<(typeof STATUS_KEYS)[number], number>
    > = {};
    for (const j of jobs) {
      let key = "";
      if (xMetric === "work_mode") {
        key = (j.work_mode || "Unknown").trim();
      } else {
        const loc = parseLocation(j.location);
        key = (xMetric === "city" ? loc.city : xMetric === "state" ? loc.state : loc.country) || "Unknown";
      }
      const status: (typeof STATUS_KEYS)[number] =
        (j.rejected || j.ghosted) ? "Rejected" :
        (STATUS_KEYS.includes(j.status as any) ? (j.status as any) : "Pre-interview");

      if (!byX[key]) {
        byX[key] = { label: key, total: 0, "Pre-interview": 0, Interview: 0, Offer: 0, Rejected: 0 };
      }
      byX[key].total += 1;
      byX[key][status] += 1;
    }

    const rows = Object.values(byX)
      .sort((a, b) => b.total - a.total)
      .slice(0, 24);

    // merge color into data rows for Bar+Cell
    const dataWithColor = rows.map((r, i) => ({
      ...r,
      __color: BUCKET_COLORS[i % BUCKET_COLORS.length],
    }));

    return { data: dataWithColor };
  }, [jobs, xMetric]);

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 12, bottom: 36 }}>
          <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-25} dy={18} />
          <YAxis allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total">
            {data.map((entry: any, idx: number) => (
              <Cell key={`cell-${entry.label}-${idx}`} fill={entry.__color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
