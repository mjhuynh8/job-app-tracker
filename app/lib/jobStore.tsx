import { createContext, useContext, useEffect, useState } from "react";

export type Job = {
  id: string;
  title: string;
  company: string;
  skills: string[];
  status: "waiting" | "interview" | "offer" | "rejected";
  dateApplied: string;
  notes: string;
};

type JobContext = {
  jobs: Job[];
  addJob: (j: Omit<Job, "id">) => void;
  updateJob: (id: string, patch: Partial<Job>) => void;
};

const ctx = createContext<JobContext | null>(null);

export function JobProvider({ children }: { children: any }) {
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("jobs") || "[]");
      return (stored as any[]).map(j => ({
        ...j,
        notes: j.notes ?? "",
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("jobs", JSON.stringify(jobs));
  }, [jobs]);

  function addJob(j: Omit<Job, "id">) {
    setJobs((s) => [...s, { ...j, id: Math.random().toString(36).slice(2) }]);
  }

  function updateJob(id: string, patch: Partial<Job>) {
    setJobs((s) => s.map((jj) => (jj.id === id ? { ...jj, ...patch } : jj)));
  }

  return <ctx.Provider value={{ jobs, addJob, updateJob }}>{children}</ctx.Provider>;
}

export function useJobs() {
  const v = useContext(ctx);
  if (!v) throw new Error("Missing JobProvider");
  return v;
}
