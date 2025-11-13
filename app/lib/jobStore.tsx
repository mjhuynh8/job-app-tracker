import { createContext, useContext, useEffect, useState } from "react";

export type Job = {
  id: string;
  userid?: string;
  job_title: string;
  employer: string;
  job_date?: string; // ISO date string
  status: "Pre-interview" | "Interview" | "Offer";
  skills: string; // comma-separated string per schema
  description?: string;
  rejected?: boolean;
  ghosted?: boolean;
};

type JobContext = {
  jobs: Job[];
  addJob: (j: Omit<Job, "id">) => void;
  updateJob: (id: string, patch: Partial<Job>) => void;
  deleteJob: (id: string) => void;
};

const ctx = createContext<JobContext | null>(null);

export function JobProvider({ children }: { children: any }) {
  console.log("JobProvider mounted");
  // Initialize empty on first render so server and client initial markup match.
  // Load/normalize stored jobs on client in an effect below.
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const toStore = jobs.map((j) => ({
        ...j,
        job_date:
          j.job_date && typeof j.job_date === "string"
            ? j.job_date
            : new Date(j.job_date as any).toISOString(),
      }));
      localStorage.setItem("jobs", JSON.stringify(toStore));
    }
  }, [jobs]);

  // Load stored jobs on client after mount and normalize shape.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = JSON.parse(localStorage.getItem("jobs") || "[]") as any[];
      const normalized = stored.map((j) => ({
        id: j.id ?? Math.random().toString(36).slice(2),
        userid: j.userid,
        job_title: String(j.job_title ?? ""),
        employer: String(j.employer ?? ""),
        job_date:
          typeof j.job_date === "string"
            ? j.job_date
            : j.job_date
              ? new Date(j.job_date).toISOString()
              : undefined,
        status: (["Pre-interview", "Interview", "Offer"].includes(j.status)
          ? j.status
          : "Pre-interview") as Job["status"],
        skills: typeof j.skills === "string" ? j.skills : "",
        description:
          typeof j.description === "string" ? j.description : undefined,
        rejected: !!j.rejected,
        ghosted: !!j.ghosted,
      }));
      setJobs(normalized);
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  function toISO(d: any): string | undefined {
    if (!d) return undefined;
    if (typeof d === "string") {
      const t = Date.parse(d);
      return isNaN(t) ? undefined : new Date(t).toISOString();
    }
    if (d instanceof Date) {
      return isNaN(d.getTime()) ? undefined : d.toISOString();
    }
    if (typeof d === "number") {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? undefined : dt.toISOString();
    }
    return undefined;
  }

  function addJob(j: Omit<Job, "id">) {
    const normalized: Job = {
      id: Math.random().toString(36).slice(2),
      userid: j.userid,
      job_title: j.job_title,
      employer: j.employer,
      job_date: toISO(j.job_date),
      status: ["Pre-interview", "Interview", "Offer"].includes(j.status)
        ? j.status
        : "Pre-interview",
      skills: typeof j.skills === "string" ? j.skills : "",
      description: j.description,
      rejected: !!j.rejected,
      ghosted: !!j.ghosted,
    };
    setJobs((s) => [...s, normalized]);
  }

  function updateJob(id: string, patch: Partial<Job>) {
    setJobs((s) =>
      s.map((jj) => {
        if (jj.id !== id) return jj;
        const merged: Job = {
          ...jj,
          ...patch,
          job_date: toISO(patch.job_date) ?? jj.job_date,
          skills: typeof patch.skills === "string" ? patch.skills : jj.skills,
          status:
            patch.status &&
            ["Pre-interview", "Interview", "Offer"].includes(
              String(patch.status)
            )
              ? (patch.status as Job["status"])
              : jj.status,
          rejected: patch.rejected ?? jj.rejected,
          ghosted: patch.ghosted ?? jj.ghosted,
        };
        return merged;
      })
    );
  }

  // Remove a job by id and persist via the existing jobs effect
  function deleteJob(id: string) {
    setJobs((s) => s.filter((j) => j.id !== id));
  }

  return (
    <ctx.Provider value={{ jobs, addJob, updateJob, deleteJob }}>
      {children}
    </ctx.Provider>
  );
}

export function useJobs() {
  const v = useContext(ctx);
  console.log("useJobs context value:", v);
  if (!v) throw new Error("Missing JobProvider");
  return v;
}
