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
  addJob: (j: Omit<Job, "id">, token?: string) => Promise<void> | void;
  updateJob: (id: string, patch: Partial<Job>, token?: string) => Promise<void> | void;
  deleteJob: (id: string, token?: string) => Promise<void> | void;
  loadFromServer: (token: string) => Promise<void>;
};

const ctx = createContext<JobContext | null>(null);

export function JobProvider({ children }: { children: any }) {
  console.log("JobProvider mounted");
  const [jobs, setJobs] = useState<Job[]>([]);

  /* Persisting to localStorage is available but disabled for server-backed mode.
     To re-enable localStorage, uncomment the block below.
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
  */

  // Load stored jobs on client after mount and normalize shape.
  // For server-backed mode we do NOT auto-load localStorage on mount.
  // Use loadFromServer(token) to populate jobs for authenticated users.

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

  // New: load jobs from server for a given Clerk token (expects serverless endpoint)
  async function loadFromServer(token: string) {
    if (!token) return;
    try {
      const res = await fetch("/.netlify/functions/jobs-list", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        console.warn("loadFromServer failed:", res.status);
        return;
      }
      const data = await res.json();
      // normalize incoming documents to Job[]
      const normalized = (data || []).map((j: any) => ({
        id: j._id?.toString?.() ?? j.id ?? Math.random().toString(36).slice(2),
        userid: j.userid ?? j.userId ?? undefined,
        job_title: String(j.job_title ?? ""),
        employer: String(j.employer ?? ""),
        job_date: typeof j.job_date === "string" ? j.job_date : j.job_date ? new Date(j.job_date).toISOString() : undefined,
        status: (["Pre-interview", "Interview", "Offer"].includes(j.status) ? j.status : "Pre-interview") as Job["status"],
        skills: typeof j.skills === "string" ? j.skills : "",
        description: typeof j.description === "string" ? j.description : undefined,
        rejected: !!j.rejected,
        ghosted: !!j.ghosted,
      }));
      setJobs(normalized);
    } catch (e) {
      console.error("loadFromServer error:", e);
    }
  }

  function addJob(j: Omit<Job, "id">, token?: string) {
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
    // optimistic UI
    setJobs((s) => [...s, normalized]);

    // If token supplied, persist to server (non-blocking)
    if (token) {
      fetch("/.netlify/functions/jobs-create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_title: normalized.job_title,
          employer: normalized.employer,
          job_date: normalized.job_date,
          status: normalized.status,
          skills: normalized.skills,
          description: normalized.description,
        }),
      })
        .then((r) => r.json())
        .then((saved) => {
          // reconcile id if server returned _id
          setJobs((s) => s.map((x) => (x.id === normalized.id ? { ...x, id: saved.id ?? normalized.id } : x)));
        })
        .catch((err) => console.warn("addJob server error", err));
    }
  }

  function updateJob(id: string, patch: Partial<Job>, token?: string) {
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
            ["Pre-interview", "Interview", "Offer"].includes(String(patch.status))
              ? (patch.status as Job["status"])
              : jj.status,
          rejected: patch.rejected ?? jj.rejected,
          ghosted: patch.ghosted ?? jj.ghosted,
        };
        if (patch.ghosted === true) merged.rejected = true;
        return merged;
      })
    );

    // Persist change to server if token provided
    if (token) {
      fetch("/.netlify/functions/jobs-update", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, patch }),
      }).catch((err) => console.warn("updateJob server error", err));
    }
  }

  function deleteJob(id: string, token?: string) {
    setJobs((s) => s.filter((j) => j.id !== id));

    if (token) {
      fetch("/.netlify/functions/jobs-delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      }).catch((err) => console.warn("deleteJob server error", err));
    }
  }

  return (
    <ctx.Provider value={{ jobs, addJob, updateJob, deleteJob, loadFromServer }}>
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
