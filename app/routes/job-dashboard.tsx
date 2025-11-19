// "use client";  <-- commented so local-only mode can be restored easily

import { useState, useRef, useEffect } from "react";
import { useJobs } from "../lib/jobStore";
import "./job-dashboard.css";
import { useAuth } from "@clerk/clerk-react";
import { mdiTrashCanOutline } from "@mdi/js";

// feature flag mirrors jobStore setting; set to false for local-only dev
const USE_SERVER = false;

const statuses = ["Pre-interview", "Interview", "Offer", "Rejected"] as const;

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
  const [descOpen, setDescOpen] = useState<Record<string, boolean>>({});
  const [skillsOpen, setSkillsOpen] = useState<Record<string, boolean>>({});
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortBy, setSortBy] = useState<"date" | "employer" | "title">("date");
  const [dateFilter, setDateFilter] = useState<"all" | "week" | "month" | "3months" | "6months">("all");

  // Helper to get cutoff date for range filters
  const getCutoffDate = (range: "week" | "month" | "3months" | "6months") => {
    const now = new Date();
    switch (range) {
      case "week":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "month":
        return new Date(now.setMonth(now.getMonth() - 1));
      case "3months":
        return new Date(now.setMonth(now.getMonth() - 3));
      case "6months":
        return new Date(now.setMonth(now.getMonth() - 6));
      default:
        return null;
    }
  };

  // Filter helpers
  const passesDateFilter = (j: any) => {
    if (dateFilter === "all") return true;
    const cutoff = getCutoffDate(dateFilter);
    if (!cutoff || !j.job_date) return false;
    return new Date(j.job_date) >= cutoff;
  };

  const compareJobs = (a: any, b: any) => {
    switch (sortBy) {
      case "date": {
        const ta = a?.job_date ? new Date(a.job_date).getTime() : null;
        const tb = b?.job_date ? new Date(b.job_date).getTime() : null;
        if (ta === null && tb === null) return 0;
        if (ta === null) return 1;
        if (tb === null) return -1;
        return sortOrder === "desc" ? tb - ta : ta - tb;
      }
      case "employer": {
        const ea = (a.employer || "").toLowerCase();
        const eb = (b.employer || "").toLowerCase();
        return sortOrder === "desc" ? eb.localeCompare(ea) : ea.localeCompare(eb);
      }
      case "title": {
        const ta = (a.job_title || "").toLowerCase();
        const tb = (b.job_title || "").toLowerCase();
        return sortOrder === "desc" ? tb.localeCompare(ta) : ta.localeCompare(tb);
      }
      default:
        return 0;
    }
  };

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
          await loadFromServer(token);
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
      updateJob(id, patch, token);
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
      deleteJob(id, token);
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

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-4 mb-2">
        <div className="flex items-center gap-2">
          <label htmlFor="date-range-filter" className="text-sm text-gray-700">
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
          <label htmlFor="sort-by" className="text-sm text-gray-700">
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
          <label htmlFor="sort-order" className="text-sm text-gray-700">
            Order:
          </label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            className="p-1 border rounded"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 job-dashboard">
      {statuses.map((s) => (
        <section key={s} className="border rounded p-2 flex flex-col">
          <header className="flex items-center justify-between">
            <h2 className={`font-semibold ${getStatusColor(s)}`}>{s}</h2>
            <button
              onClick={() => setOpen((o) => ({ ...o, [s]: !o[s] }))}
              aria-label={
                open[s] ? `Collapse ${s} column` : `Expand ${s} column`
              }
              aria-expanded={!!open[s]}
              title={open[s] ? "Collapse" : "Expand"}
            >
              {open[s] ? "▾" : "▸"}
            </button>
          </header>
          <div
            className="mt-2 tiles-container"
            ref={(el) => (containerRefs.current[s] = el)}
            aria-hidden={!open[s]}
          >
            <div
              className="tiles-scroll"
              role="region"
              aria-labelledby={`col-${s}`}
            >
              {jobs
                .filter((j) =>
                  s === "Rejected"
                    ? !!j.rejected
                    : !j.rejected && j.status === s
                )
                .filter(passesDateFilter)
                .slice()
                .sort(compareJobs)
                .map((j) => {
                  const skills = j.skills || "";
                  const fullDesc = j.description ?? "";
                  const descNeedsToggle = fullDesc.length > 120;
                  const descIsOpen = !!descOpen[j.id];
                  const skillsIsOpen = !!skillsOpen[j.id];
                  const hasDesc = fullDesc.length > 0;
                  const descPreview =
                    descNeedsToggle && !descIsOpen
                      ? fullDesc.slice(0, 120) + "…"
                      : fullDesc;
                  return (
                    <div key={j.id} className="p-2 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{j.job_title}</div>
                          <div className="text-sm text-gray-600">
                            {j.employer}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={j.rejected ? "Rejected" : j.status}
                            onChange={async (e) => {
                              const v = e.target.value;
                              if (v === "Rejected") {
                                await updateJobWithAuth(j.id, {
                                  rejected: true,
                                });
                              } else {
                                await updateJobWithAuth(j.id, {
                                  status: v as any,
                                  rejected: false,
                                });
                              }
                            }}
                            className="p-1 border rounded"
                          >
                            <option value="Pre-interview">Pre-interview</option>
                            <option value="Interview">Interview</option>
                            <option value="Offer">Offer</option>
                            <option value="Rejected">Rejected</option>
                          </select>
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
                      <div className="text-sm mt-2">
                        <label className="block text-xs text-gray-500 mb-1">
                          Skills
                        </label>
                        <div className="job-description-container">
                          {skillsIsOpen ? (
                            <input
                              className="w-full border rounded px-1 py-1 text-sm"
                              defaultValue={skills}
                              placeholder="Add skills, comma separated"
                              onBlur={async (e) => {
                                await updateJobWithAuth(j.id, {
                                  skills: e.target.value,
                                });
                              }}
                            />
                          ) : (
                            <div className="job-description-text">
                              {skills || "N/A"}
                            </div>
                          )}
                          <button
                            className="job-description-toggle"
                            aria-expanded={skillsIsOpen}
                            onClick={() =>
                              setSkillsOpen((m) => ({
                                ...m,
                                [j.id]: !m[j.id],
                              }))
                            }
                          >
                            {skillsIsOpen ? "Done" : skills ? "Edit" : "Add"}
                          </button>
                        </div>
                      </div>
                      <div className="text-sm mt-2">
                        <label className="block text-xs text-gray-500 mb-1">
                          Description
                        </label>
                        <div className="job-description-container">
                          {descIsOpen ? (
                            <textarea
                              id={`desc-${j.id}`}
                              className="w-full border rounded px-1 py-1 text-sm"
                              defaultValue={fullDesc}
                              rows={3}
                              onBlur={async (e) => {
                                await updateJobWithAuth(j.id, {
                                  description: e.target.value,
                                });
                              }}
                            />
                          ) : (
                            <div className="job-description-text">
                              {descPreview || "N/A"}
                            </div>
                          )}
                          <button
                            className="job-description-toggle"
                            aria-expanded={descIsOpen}
                            aria-controls={`desc-${j.id}`}
                            onClick={() =>
                              setDescOpen((m) => ({
                                ...m,
                                [j.id]: !m[j.id],
                              }))
                            }
                          >
                            {descIsOpen
                              ? "Done"
                              : hasDesc
                              ? descNeedsToggle
                                ? "More"
                                : "Edit"
                              : "Add"}
                          </button>
                        </div>
                      </div>
                      <div className="text-sm mt-2">
                        Date:{" "}
                        {j.job_date
                          ? new Date(j.job_date).toLocaleDateString()
                          : "N/A"}
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
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      ))}
      </div>
    </>
  );
}
