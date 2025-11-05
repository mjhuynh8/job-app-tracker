import { useState } from "react";
import { useJobs } from "../lib/jobStore";
import "./job-dashboard.css";

const statuses = ["waiting", "interview", "offer", "rejected"] as const;

export default function JobDashboard() {
  const { jobs, updateJob } = useJobs();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 job-dashboard">
      {statuses.map((s) => (
        <section key={s} className="border rounded p-2 flex flex-col">
          <header className="flex items-center justify-between">
            <h2 className="font-semibold capitalize">{s}</h2>
            <button onClick={() => setOpen((o) => ({ ...o, [s]: !o[s] }))} aria-label="toggle">
              {open[s] ? "▾" : "▸"}
            </button>
          </header>
          <div className="mt-2 overflow-auto" style={{ maxHeight: 300 }}>
            {jobs.filter((j) => j.status === s).map((j) => (
              <div key={j.id} className="p-2 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{j.title}</div>
                    <div className="text-sm text-gray-600">{j.company}</div>
                  </div>
                  <div>
                    <select value={j.status} onChange={(e) => updateJob(j.id, { status: e.target.value as any })} className="p-1 border rounded">
                      <option value="waiting">Waiting</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <div className="text-sm mt-2">Skills: {j.skills.length > 0 ? j.skills.join(", ") : "N/A"}</div>
                <div className="text-sm mt-2">Notes: {j.notes || "None"}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
