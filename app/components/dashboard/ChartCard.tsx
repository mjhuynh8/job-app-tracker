"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useJobs } from "../../lib/jobStore";
import PieChartPanel from "../charts/PieChartPanel";
import SankeyPanel from "../charts/SankeyPanel";
import BarChartPanel from "../charts/BarChartPanel";
import ApplicationVelocityChart from "../charts/ApplicationVelocityChart";
import CalendarHeatmap from "../charts/CalendarHeatmap";
import KeywordAnalysisChart from "../charts/KeywordAnalysisChart";
import "./ChartCard.css";

export type ChartType = "pie" | "sankey" | "bar" | "velocity" | "heatmap" | "keywords";

const CHART_DESCRIPTIONS: Record<ChartType, string> = {
  pie: "Distribution by category. Best for: Seeing the balance of your applications across work modes or locations.",
  sankey: "Flow from application to offer. Best for: Identifying bottlenecks in your funnel (e.g. many apps but few interviews).",
  bar: "Counts by location/mode. Best for: Understanding your geographic focus.",
  velocity: "Applications over time. Best for: Tracking your consistency and momentum.",
  heatmap: "Daily activity calendar. Best for: Visualizing your application habits.",
  keywords: "Common job title terms. Best for: Tailoring resume keywords to your target roles."
};

// Compact range lookup (approx months -> days)
const RANGE_DAYS: Record<string, number> = { week: 7, month: 30, "3months": 90, "6months": 180 };

export default function ChartCard({ initialType = "pie" }: { initialType?: ChartType }) {
  const { jobs } = useJobs();
  const [chartType, setChartType] = useState<ChartType>(initialType);
  const [pieMetric, setPieMetric] = useState<"work_mode" | "state" | "country" | "status">("work_mode");
  const [sankeyDateFilter, setSankeyDateFilter] = useState<"all" | "week" | "month" | "3months" | "6months">("all");
  const [barXMetric, setBarXMetric] = useState<"state" | "city" | "country" | "work_mode">("city");
  const nowRef = useRef<number>(Date.now()); // freeze per card
  
  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Helper to filter jobs for Sankey based on its specific filter
  const sankeyFilteredJobs = jobs.filter(j => {
    if (sankeyDateFilter === "all") return true;
    if (!j.job_date) return false;
    const days = RANGE_DAYS[sankeyDateFilter];
    if (!days) return true;
    return new Date(j.job_date) >= new Date(Date.now() - days * 864e5);
  });

  const sankeyEndDate = new Date(nowRef.current);
  const sankeyStartDate =
    sankeyDateFilter === "all"
      ? null
      : new Date(nowRef.current - (RANGE_DAYS[sankeyDateFilter] || 0) * 864e5);

  return (
    <section className="chart-card border p-3 flex flex-col h-full">
      <header className="flex flex-col gap-3 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-800">Chart</h3>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            className="p-1 border rounded text-sm cursor-help"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseMove={(e) => setTooltipPos({ x: e.clientX + 20, y: e.clientY + 20 })}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <option value="pie">Pie</option>
            <option value="sankey">Sankey</option>
            <option value="bar">Bar</option>
            <option value="velocity">Velocity</option>
            <option value="heatmap">Heatmap</option>
            <option value="keywords">Keywords</option>
          </select>

          {showTooltip && typeof document !== 'undefined' && createPortal(
            <div 
              className="fixed z-[9999] bg-slate-800 text-white text-xs p-2 rounded shadow-lg max-w-[220px] pointer-events-none border border-slate-600"
              style={{ left: tooltipPos.x, top: tooltipPos.y }}
            >
              {CHART_DESCRIPTIONS[chartType]}
            </div>,
            document.body
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-700">
          {chartType === "pie" && (
            <label className="flex items-center gap-2 w-auto">
              Metric:
              <select
                value={pieMetric}
                onChange={(e) => setPieMetric(e.target.value as any)}
                className="p-1 border rounded"
              >
                <option value="work_mode">Work Mode</option>
                <option value="state">State</option>
                <option value="country">Country</option>
                <option value="status">Status</option>
              </select>
            </label>
          )}

          {chartType === "sankey" && (
            <label className="flex items-center gap-2 w-auto">
              Date Range:
              <select
                value={sankeyDateFilter}
                onChange={(e) => setSankeyDateFilter(e.target.value as any)}
                className="p-1 border rounded"
              >
                <option value="all">All time</option>
                <option value="week">Past week</option>
                <option value="month">Past month</option>
                <option value="3months">3 months</option>
                <option value="6months">6 months</option>
              </select>
            </label>
          )}

          {chartType === "bar" && (
            <label className="flex items-center gap-2 w-auto">
              X-Axis:
              <select
                value={barXMetric}
                onChange={(e) => setBarXMetric(e.target.value as any)}
                className="p-1 border rounded"
              >
                <option value="city">City</option>
                <option value="state">State</option>
                <option value="country">Country</option>
                <option value="work_mode">Work Mode</option>
              </select>
            </label>
          )}
        </div>
      </header>

      <div className="mt-2 flex-1 chart-panel-wrapper">
        {chartType === "pie" ? (
          <PieChartPanel metric={pieMetric} />
        ) : chartType === "sankey" ? (
          <SankeyPanel
            jobs={sankeyFilteredJobs}
            startDateISO={sankeyStartDate ? sankeyStartDate.toISOString() : null}
            endDateISO={sankeyEndDate.toISOString()}
          />
        ) : chartType === "bar" ? (
          <BarChartPanel xMetric={barXMetric} />
        ) : chartType === "velocity" ? (
          <ApplicationVelocityChart />
        ) : chartType === "heatmap" ? (
          <CalendarHeatmap />
        ) : chartType === "keywords" ? (
          <KeywordAnalysisChart />
        ) : null}
      </div>
    </section>
  );
}
