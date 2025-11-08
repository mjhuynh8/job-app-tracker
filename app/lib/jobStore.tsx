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
};

const ctx = createContext<JobContext | null>(null);

export function JobProvider({ children }: { children: any }) {
  console.log("JobProvider mounted");
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("jobs") || "[]") as any[];
      // assume stored items already match the new schema; normalize job_date to ISO strings
      return stored.map((j) => ({
        id: j.id ?? Math.random().toString(36).slice(2),
        userid: j.userid,
        job_title: String(j.job_title ?? ""),
        employer: String(j.employer ?? ""),
        job_date: typeof j.job_date === "string" ? j.job_date : j.job_date ? new Date(j.job_date).toISOString() : undefined,
        status: (["Pre-interview", "Interview", "Offer"].includes(j.status) ? j.status : "Pre-interview") as Job["status"],
        skills: typeof j.skills === "string" ? j.skills : "",
        description: typeof j.description === "string" ? j.description : undefined,
        rejected: !!j.rejected,
        ghosted: !!j.ghosted,
      }));
    } catch {
      return [];
    }
  });

useEffect(() => {
  if (typeof window !== "undefined") {
    const toStore = jobs.map(j => ({
      ...j,
      job_date: j.job_date
        ? typeof j.job_date === "string"
          ? j.job_date
          : new Date(j.job_date).toISOString()
        : undefined,
    }));
    localStorage.setItem("jobs", JSON.stringify(toStore));
  }
}, [jobs]);

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
      status: ["Pre-interview", "Interview", "Offer"].includes(j.status) ? j.status : "Pre-interview",
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
          status: patch.status && ["Pre-interview", "Interview", "Offer"].includes(String(patch.status))
            ? (patch.status as Job["status"])
            : jj.status,
          rejected: patch.rejected ?? jj.rejected,
          ghosted: patch.ghosted ?? jj.ghosted,
        };
        return merged;
      })
    );
  }

  return <ctx.Provider value={{ jobs, addJob, updateJob }}>{children}</ctx.Provider>;
}

export function useJobs() {
  const v = useContext(ctx);
  if (!v) throw new Error("Missing JobProvider");
  return v;
}
