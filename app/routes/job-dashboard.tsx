"use client"; // <-- uncommented to enable client component features like hooks

import { useState, useRef, useEffect } from "react";
import { useJobs } from "../lib/jobStore";
import "./job-dashboard.css";

import { useAuth } from "@clerk/clerk-react";
import { mdiChevronDown, mdiChevronUp } from '@mdi/js';
import JobColumn from "../components/dashboard/JobColumn";
import RejectedRow from "../components/dashboard/RejectedRow";
import ChartCarousel from "../components/dashboard/ChartCarousel";

// feature flag mirrors jobStore setting; set to false for local-only dev
const USE_SERVER = false;

// Compact range lookup (approx months -> days)
const RANGE_DAYS: Record<string, number> = { week: 7, month: 30, "3months": 90, "6months": 180 };

const statuses = ["Pre-interview", "Interview", "Offer", "Rejected"] as const;
const topStatuses = ["Pre-interview", "Interview", "Offer"] as const;

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

export default function JobDashboard() {
  const { jobs, updateJob, deleteJob, loadFromServer } = useJobs();
  const { getToken } = useAuth();
  const [isCarouselOpen, setIsCarouselOpen] = useState(false); // Collapsed by default
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

  // Simplified column filter logic
  function inColumn(col: string, j: any) {
    const rejectedBucket = j.rejected || j.ghosted;
    return col === "Rejected" ? rejectedBucket : !rejectedBucket && j.status === col;
  }

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

  return (
    <div className="job-dashboard-background flex flex-col">
      {/* Added flex-1 to ensure container takes available space */}
      <div className="job-dashboard-container job-dashboard mx-auto w-full max-w-7xl p-4 flex-1">
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
            <JobColumn
              key={s}
              status={s}
              jobs={jobs
                .filter(j => inColumn(s, j))
                .filter(passesDateFilter)
                .sort(compareJobs)
              }
              onUpdate={updateJobWithAuth}
              className={columnClassForStatus(s)}
            />
          ))}
        </div>

        {/* Rejected horizontal row (full width, inside container) */}
        <RejectedRow
          jobs={jobs
            .filter(j => inColumn("Rejected", j))
            .filter(passesDateFilter)
            .sort(compareJobs)
          }
          onUpdate={updateJobWithAuth}
          onDelete={deleteJobWithAuth}
          className={columnClassForStatus("Rejected")}
        />
      </div>

      {/* Charts section: Carousel (Collapsible) */}
      <div 
        className={`w-full transition-all duration-500 ease-in-out overflow-hidden ${
          isCarouselOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ChartCarousel />
      </div>

      {/* Toggle Band */}
      <button
        onClick={() => setIsCarouselOpen(!isCarouselOpen)}
        className="carousel-toggle-band"
        aria-label={isCarouselOpen ? "Collapse charts" : "Show charts"}
      >
        {isCarouselOpen ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-sm">
            <path d={mdiChevronUp} />
          </svg>
        ) : (
          <>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-sm">
              <path d={mdiChevronDown} />
            </svg>
            <span>Application Analytics</span>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-sm">
              <path d={mdiChevronDown} />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
