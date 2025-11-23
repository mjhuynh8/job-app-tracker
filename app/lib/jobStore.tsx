import { createContext, useContext, useEffect, useState } from "react";

// Development feature flag: set to true to use Netlify functions / DB, false to use localStorage-only.
const USE_SERVER = (import.meta.env.VITE_USE_SERVER ?? "true") === "true";

export type Job = {
  id: string;
  userid?: string;
  job_title: string;
  employer: string;
  job_date?: string; // ISO date string
  status: "Pre-interview" | "Interview" | "Offer";
  work_mode: "In-person" | "Hybrid" | "Remote"; // required
  location?: string; // optional free-text "City, State, Country"
  notes?: string; // optional notes field
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

  // Normalize/cleanup location string:
  function normalizeLocation(input?: string) {
    if (!input) return undefined;
    const s = input.trim();
    if (!s) return undefined;
    if (/^washington\s*,?\s*dc$/i.test(s)) return "Washington, DC, United States";
    const parts = s.split(",").map(p => p.trim()).filter(Boolean);
    const [city = "", stateRaw = "", countryRaw = ""] = parts;
    const state = stateRaw && stateRaw.length <= 3 ? stateRaw.toUpperCase() : stateRaw;
    const country = countryRaw || "United States";
    return [city, state, country].filter(Boolean).join(", ");
  }

  // Load stored jobs on client after mount and normalize shape.
  // For server-backed mode we do NOT auto-load localStorage on mount.
  // Use loadFromServer(token) to populate jobs for authenticated users.
  // For local dev (USE_SERVER === false) we can optionally hydrate from localStorage here:
  useEffect(() => {
    // Local hydration disabled in server mode; re-enable by removing this guard.
    if (USE_SERVER) return;
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
        work_mode: (["In-person", "Hybrid", "Remote"].includes(j.work_mode) ? j.work_mode : "In-person") as Job["work_mode"],
        location: normalizeLocation(typeof j.location === "string" ? j.location : undefined),
        notes: typeof j.notes === "string" ? j.notes : undefined,
        rejected: !!j.rejected,
        ghosted: !!j.ghosted,
      }));
      setJobs(normalized);
    } catch {}
  }, []);

  function toISO(d: any): string | undefined {
    if (!d) return undefined;
    const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d instanceof Date ? d : null;
    return date && !isNaN(date.getTime()) ? date.toISOString() : undefined;
  }

  // New: load jobs from server for a given Clerk token (expects serverless endpoint)
  async function loadFromServer(token: string) {
    if (!USE_SERVER) {
      // no-op in local development mode
      return;
    }
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
        work_mode: (["In-person", "Hybrid", "Remote"].includes(j.work_mode) ? j.work_mode : "In-person") as Job["work_mode"],
        location: normalizeLocation(typeof j.location === "string" ? j.location : undefined),
        notes: typeof j.notes === "string" ? j.notes : undefined,
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
      work_mode: (["In-person", "Hybrid", "Remote"].includes(j.work_mode) ? j.work_mode : "In-person") as Job["work_mode"],
      location: normalizeLocation(j.location),
      notes: j.notes,
      rejected: !!j.rejected,
      ghosted: !!j.ghosted,
    };
    // optimistic UI
    setJobs((s) => [...s, normalized]);

    if (!USE_SERVER) {
      try {
        const current = JSON.parse(localStorage.getItem("jobs") || "[]");
        current.push({ ...normalized });
        localStorage.setItem("jobs", JSON.stringify(current));
      } catch {}
    }
    if (USE_SERVER) {
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
            work_mode: normalized.work_mode,
            location: normalized.location,
            notes: normalized.notes,
          }),
        })
          .then((r) => r.json())
          .then((saved) => {
            // reconcile id if server returned _id
            setJobs((s) => s.map((x) => (x.id === normalized.id ? { ...x, id: saved.id ?? normalized.id } : x)));
          })
          .catch((err) => console.warn("addJob server error", err));
      } else {
        console.warn("addJob: missing token in server mode; not persisted");
      }
    }
  }

  function updateJob(id: string, patch: Partial<Job>, token?: string) {
    setJobs(s =>
      s.map(j =>
        j.id === id
          ? {
              ...j,
              ...patch,
              job_date: toISO(patch.job_date) ?? j.job_date,
              work_mode: patch.work_mode && ["In-person", "Hybrid", "Remote"].includes(patch.work_mode)
                ? patch.work_mode
                : j.work_mode,
              location: patch.location ? normalizeLocation(patch.location) : j.location,
              rejected: patch.rejected !== undefined ? !!patch.rejected : j.rejected,
              ghosted: patch.ghosted !== undefined ? !!patch.ghosted : j.ghosted,
            }
          : j
      )
    );
    if (!USE_SERVER) {
      try {
        const stored = JSON.parse(localStorage.getItem("jobs") || "[]");
        localStorage.setItem(
          "jobs",
          JSON.stringify(
            stored.map((x: any) =>
              x.id === id
                ? {
                    ...x,
                    ...patch,
                    rejected: patch.rejected !== undefined ? !!patch.rejected : x.rejected,
                    ghosted: patch.ghosted !== undefined ? !!patch.ghosted : x.ghosted,
                  }
                : x
            )
          )
        );
      } catch {}
    }
    if (USE_SERVER && token)
      fetch("/.netlify/functions/jobs-update", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id, patch, token }),
      }).catch(err => console.warn("updateJob server error", err));
    if (USE_SERVER && !token) {
      console.warn("updateJob: missing token; change not persisted to server");
    }
  }

  function deleteJob(id: string, token?: string) {
    setJobs((s) => s.filter((jj) => jj.id !== id));
    if (!USE_SERVER) {
      try {
        const stored = JSON.parse(localStorage.getItem("jobs") || "[]") as any[];
        localStorage.setItem("jobs", JSON.stringify(stored.filter((x) => x.id !== id)));
      } catch {}
    }
    if (USE_SERVER && token) {
      fetch("/.netlify/functions/jobs-delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, token }),
      }).catch((err) => console.warn("deleteJob server error", err));
    } else if (USE_SERVER && !token) {
      console.warn("deleteJob: missing token; not persisted to server");
     }
  }

  const value = { jobs, addJob, updateJob, deleteJob, loadFromServer };
  return <ctx.Provider value={value}>{children}</ctx.Provider>;
}

export function useJobs() {
  const c = useContext(ctx);
  if (!c) throw new Error("useJobs must be used within a JobProvider");
  return c;
}
