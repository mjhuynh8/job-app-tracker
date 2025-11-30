"use client"; // <-- uncommented to enable client component features like hooks

import { useState, useRef, useEffect } from "react";
import { useJobs } from "../lib/jobStore";
import "./job-dashboard.css";

import { useAuth } from "@clerk/clerk-react";
import { mdiPencilOutline, mdiTrashCanOutline, mdiChevronLeft, mdiChevronRight } from '@mdi/js';
import { Link } from "react-router";
import PieChartPanel from "../components/charts/PieChartPanel";
import SankeyPanel from "../components/charts/SankeyPanel";
import BarChartPanel from "../components/charts/BarChartPanel";
import ApplicationVelocityChart from "../components/charts/ApplicationVelocityChart";
import CalendarHeatmap from "../components/charts/CalendarHeatmap";
import KeywordAnalysisChart from "../components/charts/KeywordAnalysisChart";

// feature flag mirrors jobStore setting; set to false for local-only dev
const USE_SERVER = false;

// Compact range lookup (approx months -> days)
const RANGE_DAYS: Record<string, number> = { week: 7, month: 30, "3months": 90, "6months": 180 };

const statuses = ["Pre-interview", "Interview", "Offer", "Rejected"] as const;
const topStatuses = ["Pre-interview", "Interview", "Offer"] as const;

type ChartType = "pie" | "sankey" | "bar" | "velocity" | "heatmap" | "keywords";

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 26 26" fill="currentColor" aria-hidden>
      <path d={mdiPencilOutline} />
    </svg>
  );
}
function columnClassForStatus(s: string) {
	// map to safe css class names
	switch (s) {
		case "Pre-interview":
			return "col-pre-interview";
		case "Interview":
			return "col-interview";
		case "Offer":
			return "col-offer";
		case "Rejected":
			return "col-rejected";
		default:
			return "";
	}
}

function ChartCard({ initialType = "pie" }: { initialType?: ChartType }) {
  const { jobs } = useJobs();
  const [chartType, setChartType] = useState<ChartType>(initialType);
  const [pieMetric, setPieMetric] = useState<"work_mode" | "state" | "country" | "status">("work_mode");
  const [sankeyDateFilter, setSankeyDateFilter] = useState<"all" | "week" | "month" | "3months" | "6months">("all");
  const [barXMetric, setBarXMetric] = useState<"state" | "city" | "country" | "work_mode">("city");
  const nowRef = useRef<number>(Date.now()); // freeze per card

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
    <section className="border rounded p-3 bg-white/95 shadow flex flex-col h-full">
      <header className="flex flex-col gap-3 mb-2">
        {/* Changed justify-between to gap-2 to keep selector next to title */}
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-800">Chart</h3>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            className="p-1 border rounded text-sm"
          >
            <option value="pie">Pie</option>
            <option value="sankey">Sankey</option>
            <option value="bar">Bar</option>
            <option value="velocity">Velocity</option>
            <option value="heatmap">Heatmap</option>
            <option value="keywords">Keywords</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-700">
          {chartType === "pie" && (
            // Changed w-full to w-auto to prevent spanning full width
            <label className="flex items-center gap-2 w-auto">
              Metric:
              <select
                value={pieMetric}
                onChange={(e) => setPieMetric(e.target.value as any)}
                // Removed flex-1 so it doesn't grow unnecessarily
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
            // Changed w-full to w-auto
            <label className="flex items-center gap-2 w-auto">
              Range:
              <select
                value={sankeyDateFilter}
                onChange={(e) => setSankeyDateFilter(e.target.value as any)}
                // Removed flex-1
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
            // Changed w-full to w-auto
            <label className="flex items-center gap-2 w-auto">
              X-Axis:
              <select
                value={barXMetric}
                onChange={(e) => setBarXMetric(e.target.value as any)}
                // Removed flex-1
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

function ChartCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const CHART_TYPES: ChartType[] = ["pie", "sankey", "bar", "velocity", "heatmap", "keywords"];

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      // Scroll by roughly one card width + gap
      const cardWidth = container.firstElementChild?.clientWidth || 300;
      const gap = 16; 
      const scrollAmount = cardWidth + gap;
      const maxScroll = container.scrollWidth - container.clientWidth;
      
      if (direction === "left") {
        // Loop to end if at start
        if (container.scrollLeft <= 10) {
            container.scrollTo({ left: maxScroll, behavior: "smooth" });
        } else {
            container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        }
      } else {
        // Loop to start if at end
        if (container.scrollLeft >= maxScroll - 10) {
            container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
            container.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }
  };

  return (
    <div className="conveyor-belt-container group">
      <div className="conveyor-belt-inner">
        {/* Left Arrow - Taller, semi-transparent */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-slate-900/20 hover:bg-slate-900/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-l-lg backdrop-blur-sm"
          aria-label="Scroll left"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-md">
            <path d={mdiChevronLeft} />
          </svg>
        </button>

        {/* Scroll Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar scroll-smooth px-1"
        >
          {CHART_TYPES.map((type) => (
            <div key={type} className="min-w-[100%] md:min-w-[calc(50%-0.5rem)] xl:min-w-[calc(33.333%-0.67rem)] flex-shrink-0">
              <ChartCard initialType={type} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-slate-900/20 hover:bg-slate-900/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-r-lg backdrop-blur-sm"
          aria-label="Scroll right"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-md">
            <path d={mdiChevronRight} />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function JobDashboard() {
  const { jobs, updateJob, deleteJob, loadFromServer } = useJobs();
  const { getToken } = useAuth();
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    statuses.reduce(
      (acc, s) => ({ ...acc, [s]: true }),
      {} as Record<string, boolean>
    )
  );
  const [locationOpen, setLocationOpen] = useState<Record<string, boolean>>({});
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortBy, setSortBy] = useState<"date" | "employer" | "title">("date");
  const [dateFilter, setDateFilter] = useState<"all" | "week" | "month" | "3months" | "6months">("all");
  const nowRef = useRef<number>(Date.now()); // stable timestamp per mount

  // Condensed date filter
  function passesDateFilter(j: any) {
    if (dateFilter === "all") return true;
    if (!j.job_date) return false;
    const days = RANGE_DAYS[dateFilter];
    if (!days) return true;
    return new Date(j.job_date) >= new Date(Date.now() - days * 864e5);
  }

  // Unified compare function
  function compareJobs(a: any, b: any) {
    if (sortBy === "date") {
      const ta = a.job_date ? Date.parse(a.job_date) : -Infinity;
      const tb = b.job_date ? Date.parse(b.job_date) : -Infinity;
      return sortOrder === "desc" ? tb - ta : ta - tb;
    }
    const fa = (a[sortBy === "employer" ? "employer" : "job_title"] || "").toLowerCase();
    const fb = (b[sortBy === "employer" ? "employer" : "job_title"] || "").toLowerCase();
    return sortOrder === "desc" ? fb.localeCompare(fa) : fa.localeCompare(fb);
  }

  // Condensed location formatter
  function formatLocationForDisplay(raw?: string | null) {
    if (!raw) return null;
    const parts = raw.split(",").map(p => p.trim()).filter(Boolean);
    if (!parts.length) return null;
    const isDC = /^washington\s*,?\s*dc$/i.test(raw);
    if (isDC) return "Washington, DC";
    const isUS = parts.length < 3 || /^(united\s*states|us|usa)$/i.test(parts.at(-1)!);
    const [city, state, country] = parts;
    if (isUS) {
      if (state) return `${toTitleCase(city)}, ${state.toUpperCase()}`;
      return toTitleCase(city);
    }
    return parts.join(", ");
  }
  function toTitleCase(s: string) {
    return s
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map(w => w[0].toUpperCase() + w.slice(1))
      .join(" ");
  }

  // Simplified column filter logic
  function inColumn(col: string, j: any) {
    const rejectedBucket = j.rejected || j.ghosted;
    return col === "Rejected" ? rejectedBucket : !rejectedBucket && j.status === col;
  }

  // Location input validator (unchanged logic, shorter)
  function isValidLocationInput(input?: string | null) {
    if (!input) return true;
    const s = input.trim();
    if (!s) return false;
    if (/^washington\s*,?\s*dc$/i.test(s)) return true;
    const parts = s.split(",").map(p => p.trim()).filter(Boolean);
    return parts.length >= 2;
  }

  // Update only the toggled column's maxHeight
  useEffect(() => {
    statuses.forEach((status) => {
      const el = containerRefs.current[status];
      if (!el) return;

      if (open[status]) {
        // Expand the column
        el.style.maxHeight = `${el.scrollHeight}px`;
      } else {
        // Collapse the column
        el.style.maxHeight = "0px";
      }
    });
  }, [open, jobs]);

  // On mount, load server-side jobs for the authenticated user
  useEffect(() => {
    if (!USE_SERVER) {
      // local-only dev: do not attempt to load from server
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const token = await getToken();
        if (token && mounted && loadFromServer) {
          await loadFromServer(token ?? undefined);
        }
      } catch (err) {
        console.warn("job-dashboard: loadFromServer failed", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getToken, loadFromServer]);

  // Helper: obtain a token and call updateJob with it (fallback to local update if token fail)
  async function updateJobWithAuth(id: string, patch: Partial<any>) {
    if (!USE_SERVER) {
      // local-only mode: just update local store
      updateJob(id, patch);
      return;
    }
    try {
      const token = await getToken();
      updateJob(id, patch, token ?? undefined);
    } catch (err) {
      console.warn(
        "updateJobWithAuth: failed to get token, applying local update only",
        err
      );
      updateJob(id, patch);
    }
  }

  async function deleteJobWithAuth(id: string) {
    if (!USE_SERVER) {
      deleteJob(id);
      return;
    }
    try {
      const token = await getToken();
      deleteJob(id, token ?? undefined);
    } catch (err) {
      console.warn(
        "deleteJobWithAuth: failed to get token, deleting locally",
        err
      );
      deleteJob(id);
    }
  }
  const getStatusColor = (s: string) => {
    if (s === "Rejected") return "text-red-500";
    if (s === "Interview") return "text-yellow-600";
    if (s === "Offer") return "text-green-700";
    return "text-gray-500"; // pre interviewv is default
  };

  // derive filtered jobs and timeline range
  const filteredJobs = jobs.filter(passesDateFilter);
  const endDate = new Date(nowRef.current);
  const startDate =
    dateFilter === "all"
      ? null
      : new Date(nowRef.current - (RANGE_DAYS[dateFilter] || 0) * 864e5);

  return (
    <div className="job-dashboard-background min-h-screen flex flex-col">
      <div className="job-dashboard-container job-dashboard mx-auto w-full max-w-7xl p-4">
        {/* selectors row */}
        <div className="flex flex-wrap items-center justify-end gap-4 mb-2">
          <div className="flex items-center gap-2">
            <label htmlFor="date-range-filter" className="text-sm text-white">
              Date range:
            </label>
            <select
              id="date-range-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="p-1 border rounded"
            >
              <option value="all">All time</option>
              <option value="week">Past week</option>
              <option value="month">Past month</option>
              <option value="3months">Past 3 months</option>
              <option value="6months">Past 6 months</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-by" className="text-sm text-white">
              Sort by:
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "employer" | "title")}
              className="p-1 border rounded"
            >
              <option value="date">Date</option>
              <option value="employer">Employer</option>
              <option value="title">Job title</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-order" className="text-sm text-white">
              Order:
            </label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="p-1 border rounded bg-white"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {/* top three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topStatuses.map((s) => (
            <section key={s} className={`border rounded p-2 flex flex-col ${columnClassForStatus(s)}`}>
              <header className="flex items-center justify-between job-column-header">
                <h2 className={`font-semibold ${getStatusColor(s)} job-column-title`}>{s}</h2>
                <button
                  onClick={() => setOpen(o => ({ ...o, [s]: !o[s] }))}
                  aria-label={open[s] ? `Collapse ${s} column` : `Expand ${s} column`}
                  aria-expanded={!!open[s]}
                  title={open[s] ? "Collapse" : "Expand"}
                >
                  {open[s] ? "▾" : "▸"}
                </button>
              </header>
              <div
                className="mt-2 tiles-container"
                ref={(el) => {
                  containerRefs.current[s] = el;
                }}
                aria-hidden={!open[s]}
              >
                <div
                  className="tiles-scroll"
                  role="region"
                  aria-labelledby={`col-${s}`}
                >
                  {jobs
                    .filter(j => inColumn(s, j))
                    .filter(passesDateFilter)
                    .sort(compareJobs)
                    .map((j) => {
                      const loc = j.location || "";
                      const displayLoc = formatLocationForDisplay(j.location || "");
                      const locationIsOpen = !!locationOpen[j.id];
                      const hasLocation = !!displayLoc;
                      return (
                        <div key={j.id} className="job-tile">
                          <div>
                            <div className="font-semibold">
                              <Link to={`/job-view/${j.id}`} className="underline hover:no-underline">
                                {j.job_title}
                              </Link>
                            </div>
                            <div className="text-sm text-gray-600">
                              {j.employer}
                            </div>
                          </div>

                          {/* Location area */}
                          <div className="text-sm mt-2">
                            <div className="job-location-container">
                              {locationIsOpen ? (
                                <input
                                  className="w-full border rounded px-1 py-1 text-sm"
                                  defaultValue={loc}
                                  placeholder="City, State, Country"
                                  onBlur={async (e) => {
                                    const raw = (e.target.value || "").trim();
                                    if (!raw) {
                                      await updateJobWithAuth(j.id, { location: undefined });
                                      setLocationOpen(m => ({ ...m, [j.id]: false }));
                                      return;
                                    }
                                    if (!isValidLocationInput(raw)) {
                                      alert("Invalid location. Use 'City, State' or 'Washington, DC'.");
                                      return;
                                    }
                                    await updateJobWithAuth(j.id, { location: raw });
                                    setLocationOpen(m => ({ ...m, [j.id]: false }));
                                  }}
                                />
                              ) : (
                                <div className="job-location-text">
                                  {j.work_mode === "Remote"
                                    ? "Remote"
                                    : `${displayLoc ?? "N/A"} (${String(j.work_mode).toLowerCase()})`}
                                </div>
                              )}
                              <button
                                className="job-location-toggle"
                                aria-expanded={locationIsOpen}
                                onClick={() =>
                                  setLocationOpen((m) => ({
                                    ...m,
                                    [j.id]: !m[j.id],
                                  }))
                                }
                              >
                                {locationIsOpen ? "Done" : hasLocation ? <EditIcon /> : "Add"}
                              </button>
                            </div>
                          </div>

                          <div className="text-sm mt-2">
                            Date: {j.job_date ? new Date(j.job_date).toLocaleDateString("en-US") : "N/A"}
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!j.rejected}
                                onChange={async (e) =>
                                  updateJobWithAuth(j.id, {
                                    rejected: e.target.checked,
                                  })
                                }
                              />
                              <span>Rejected</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!j.ghosted}
                                onChange={async (e) =>
                                  updateJobWithAuth(j.id, {
                                    ghosted: e.target.checked,
                                  })
                                }
                              />
                              <span>Ghosted</span>
                            </label>

                            {/* Inline status select placed adjacent to Ghosted checkbox */}
                            <select
                              value={j.status}
                              onChange={async (e) => {
                                const v = e.target.value;
                                await updateJobWithAuth(j.id, { status: v as any });
                              }}
                              className="status-select-inline"
                              aria-label="Status"
                            >
                              <option value="Pre-interview">Pre-interview</option>
                              <option value="Interview">Interview</option>
                              <option value="Offer">Offer</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Rejected horizontal row (full width, inside container) */}
        <section className={`mt-4 border rounded p-2 flex flex-col ${columnClassForStatus("Rejected")} rejected-horizontal`}>
          <header className="flex items-center justify-between job-column-header">
            <h2 className={`font-semibold ${getStatusColor("Rejected")} job-column-title`}>Rejected</h2>
            <button
              onClick={() => setOpen(o => ({ ...o, ["Rejected"]: !o["Rejected"] }))}
              aria-label={open["Rejected"] ? "Collapse Rejected column" : "Expand Rejected column"}
              aria-expanded={!!open["Rejected"]}
              title={open["Rejected"] ? "Collapse" : "Expand"}
            >
              {open["Rejected"] ? "▾" : "▸"}
            </button>
          </header>
          <div
            className="mt-2 tiles-container"
            ref={(el) => { containerRefs.current["Rejected"] = el; }}
            aria-hidden={!open["Rejected"]}
          >
            <div className="tiles-scroll" role="region" aria-labelledby="col-Rejected">
              {jobs
                .filter(j => inColumn("Rejected", j))
                .filter(passesDateFilter)
                .sort(compareJobs)
                .map((j) => {
                  const loc = j.location || "";
                  const displayLoc = formatLocationForDisplay(j.location || "");
                  const locationIsOpen = !!locationOpen[j.id];
                  const hasLocation = !!displayLoc;
                  return (
                    <div key={j.id} className="job-tile">
                      <div className="flex items-center justify-between">
                        <div>
                          {/* Title now links to job-view page */}
                          <div className="font-semibold">
                            <Link to={`/job-view/${j.id}`} className="underline hover:no-underline">
                              {j.job_title}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-600">
                            {j.employer}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            title="Delete job"
                            onClick={async () => {
                              if (
                                !confirm(
                                  `Delete "${j.job_title}" at ${j.employer}?`
                                )
                              )
                                return;
                              await deleteJobWithAuth(j.id);
                            }}
                            className="text-red-600 hover:text-red-800 px-2 py-1 rounded"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d={mdiTrashCanOutline} />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Location area */}
                      <div className="text-sm mt-2">
                        <div className="job-location-container">
                          {locationIsOpen ? (
                            <input
                              className="w-full border rounded px-1 py-1 text-sm"
                              defaultValue={loc}
                              placeholder="City, State, Country"
                              onBlur={async (e) => {
                                const raw = (e.target.value || "").trim();
                                if (!raw) {
                                  await updateJobWithAuth(j.id, { location: undefined });
                                  setLocationOpen(m => ({ ...m, [j.id]: false }));
                                  return;
                                }
                                if (!isValidLocationInput(raw)) {
                                  alert("Invalid location. Use 'City, State' or 'Washington, DC'.");
                                  return;
                                }
                                await updateJobWithAuth(j.id, { location: raw });
                                setLocationOpen(m => ({ ...m, [j.id]: false }));
                              }}
                            />
                          ) : (
                            <div className="job-location-text">
                              {j.work_mode === "Remote"
                                ? "Remote"
                                : `${displayLoc ?? "N/A"} (${String(j.work_mode).toLowerCase()})`}
                            </div>
                          )}
                          <button
                            className="job-location-toggle"
                            aria-expanded={locationIsOpen}
                            onClick={() =>
                              setLocationOpen((m) => ({
                                ...m,
                                [j.id]: !m[j.id],
                              }))
                            }
                          >
                            {locationIsOpen ? "Done" : hasLocation ? <EditIcon /> : "Add"}
                          </button>
                        </div>
                      </div>

                      <div className="text-sm mt-2">
                        Date: {j.job_date ? new Date(j.job_date).toLocaleDateString("en-US") : "N/A"}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!j.rejected}
                            onChange={async (e) =>
                              updateJobWithAuth(j.id, {
                                rejected: e.target.checked,
                              })
                            }
                          />
                          <span>Rejected</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!j.ghosted}
                            onChange={async (e) =>
                              updateJobWithAuth(j.id, {
                                ghosted: e.target.checked,
                              })
                            }
                          />
                          <span>Ghosted</span>
                        </label>

                        {/* Inline status select placed adjacent to Ghosted checkbox */}
                        <select
                          value={j.status}
                          onChange={async (e) => {
                            const v = e.target.value;
                            await updateJobWithAuth(j.id, { status: v as any });
                          }}
                          className="status-select-inline"
                          aria-label="Status"
                        >
                          <option value="Pre-interview">Pre-interview</option>
                          <option value="Interview">Interview</option>
                          <option value="Offer">Offer</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      </div>

      {/* Charts section: Carousel */}
      <ChartCarousel />
    </div>
  );
}
