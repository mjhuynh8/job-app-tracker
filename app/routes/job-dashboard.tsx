// "use client";  <-- commented so local-only mode can be restored easily

import { useState, useRef, useEffect } from "react";
import { useJobs } from "../lib/jobStore";
import "./job-dashboard.css";
import { useAuth } from "@clerk/clerk-react";

// feature flag mirrors jobStore setting; set to false for local-only dev
const USE_SERVER = false;

const statuses = ["Pre-interview", "Interview", "Offer", "Rejected"] as const;

export default function JobDashboard() {
  const { jobs, updateJob, deleteJob, loadFromServer } = useJobs();
  const { getToken } = useAuth();
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [open, setOpen] = useState<Record<string, boolean>>(
    () => statuses.reduce((acc, s) => ({ ...acc, [s]: true }), {} as Record<string, boolean>)
  );
  const [descOpen, setDescOpen] = useState<Record<string, boolean>>({});

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
      console.warn("updateJobWithAuth: failed to get token, applying local update only", err);
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
      console.warn("deleteJobWithAuth: failed to get token, deleting locally", err);
      deleteJob(id);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 job-dashboard">
      {statuses.map((s) => (
        <section key={s} className="border rounded p-2 flex flex-col">
          <header className="flex items-center justify-between">
            <h2 className="font-semibold">{s}</h2>
            <button
              onClick={() => setOpen((o) => ({ ...o, [s]: !o[s] }))}
              aria-label={open[s] ? `Collapse ${s} column` : `Expand ${s} column`}
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
            <div className="tiles-scroll" role="region" aria-labelledby={`col-${s}`}>
              {jobs
                .filter((j) =>
                  s === "Rejected" ? !!j.rejected : !j.rejected && j.status === s
                )
                .map((j) => {
                  const skills = j.skills || "";
                  const fullDesc = j.description ?? "";
                  const needsToggle = fullDesc.length > 120;
                  const isOpen = !!descOpen[j.id];
                  const preview =
                    needsToggle && !isOpen ? fullDesc.slice(0, 120) + "…" : fullDesc;
                  return (
                    <div key={j.id} className="p-2 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{j.job_title}</div>
                          <div className="text-sm text-gray-600">{j.employer}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={j.rejected ? "Rejected" : j.status}
                            onChange={async (e) => {
                              const v = e.target.value;
                              if (v === "Rejected") {
                                await updateJobWithAuth(j.id, { rejected: true });
                              } else {
                                await updateJobWithAuth(j.id, { status: v as any, rejected: false });
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
                              if (!confirm(`Delete "${j.job_title}" at ${j.employer}?`)) return;
                              await deleteJobWithAuth(j.id);
                            }}
                            className="text-red-600 hover:text-red-800 px-2 py-1 rounded"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                      <div className="text-sm mt-2">Skills: {skills || "N/A"}</div>
                      <div className="text-sm mt-2">
                        Description:
                        <div className="job-description-container">
                          <div className="job-description-text">{preview}</div>
                          {needsToggle && (
                            <button
                              className="job-description-toggle"
                              aria-expanded={isOpen}
                              aria-controls={`desc-${j.id}`}
                              onClick={() =>
                                setDescOpen((m) => ({ ...m, [j.id]: !m[j.id] }))
                              }
                            >
                              {isOpen ? "▾" : "▸"}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-sm mt-2">
                        Date:{" "}
                        {j.job_date ? new Date(j.job_date).toLocaleDateString() : "N/A"}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!j.rejected}
                            onChange={async (e) => updateJobWithAuth(j.id, { rejected: e.target.checked })}
                          />
                          <span>Rejected</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!j.ghosted}
                            onChange={async (e) => updateJobWithAuth(j.id, { ghosted: e.target.checked })}
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
  );
}
