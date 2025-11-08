import { useState } from "react";
import { useJobs } from "../lib/jobStore";
import "./job-dashboard.css";

const statuses = ["Pre-interview", "Interview", "Offer", "Rejected"] as const;

export default function JobDashboard() {
  const { jobs, updateJob } = useJobs();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 job-dashboard">
      {statuses.map((s) => (
        <section key={s} className="border rounded p-2 flex flex-col">
          <header className="flex items-center justify-between">
            <h2 className="font-semibold">{s}</h2>
            <button onClick={() => setOpen((o) => ({ ...o, [s]: !o[s] }))} aria-label="toggle">
              {open[s] ? "▾" : "▸"}
            </button>
          </header>
          <div className="mt-2 overflow-auto" style={{ maxHeight: 300 }}>
            {jobs
              .filter((j) => (s === "Rejected" ? !!j.rejected : j.status === s))
              .map((j) => {
                const skills = j.skills || "";
                return (
                  <div key={j.id} className="p-2 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{j.job_title}</div>
                        <div className="text-sm text-gray-600">{j.employer}</div>
                      </div>
                      <div>
                        <select
                          value={j.rejected ? "Rejected" : j.status}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "Rejected") {
                              updateJob(j.id, { rejected: true });
                            } else {
                              updateJob(j.id, { status: v as any, rejected: false });
                            }
                          }}
                          className="p-1 border rounded"
                        >
                          <option value="Pre-interview">Pre-interview</option>
                          <option value="Interview">Interview</option>
                          <option value="Offer">Offer</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                    <div className="text-sm mt-2">Skills: {skills || "N/A"}</div>
                    <div className="text-sm mt-2">Description: {j.description ?? "None"}</div>
                    <div className="text-sm mt-2">Date: {j.job_date ? new Date(j.job_date).toLocaleDateString() : "N/A"}</div>
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
