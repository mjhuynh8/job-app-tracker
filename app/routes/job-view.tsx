"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { useJobs } from "../lib/jobStore";
import { useAuth } from "@clerk/clerk-react";
import "./job-view.css";

const USE_SERVER = false;

type JobStatus = "Pre-interview" | "Interview" | "Offer";
type WorkMode = "In-person" | "Hybrid" | "Remote";

function toISO(d: string) {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? undefined : dt.toISOString();
}
function isValidDate(d: string) {
  const dt = new Date(d);
  return !isNaN(dt.getTime());
}

export default function JobView() {
  const { id } = useParams() as { id: string };
  const { jobs, updateJob } = useJobs();
  const { getToken } = useAuth();
  const job = useMemo(() => jobs.find(j => j.id === id), [jobs, id]);

  // Local state mirrors fields
  const [title, setTitle] = useState("");
  const [employer, setEmployer] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<JobStatus | "">("");
  const [dateApplied, setDateApplied] = useState(""); // yyyy-mm-dd
  const [workMode, setWorkMode] = useState<WorkMode | "">("");
  const [notes, setNotes] = useState("");

  const [resubmitting, setResubmitting] = useState(false);

  // Initialize from job
  useEffect(() => {
    if (!job) return;
    setTitle(job.job_title);
    setEmployer(job.employer);
    setLocation(job.location ?? "");
    setStatus(job.status);
    setWorkMode(job.work_mode);
    setNotes(job.notes ?? "");
    setDateApplied(
      job.job_date
        ? new Date(job.job_date).toISOString().slice(0, 10)
        : ""
    );
  }, [job]);

  // Original snapshot for change detection
  const original = useMemo(
    () =>
      job
        ? {
            job_title: job.job_title,
            employer: job.employer,
            location: job.location ?? "",
            status: job.status,
            work_mode: job.work_mode,
            notes: job.notes ?? "",
            job_date: job.job_date
              ? new Date(job.job_date).toISOString().slice(0, 10)
              : "",
          }
        : null,
    [job]
  );

  const hasChanges = useMemo(() => {
    if (!original) return false;
    return (
      title !== original.job_title ||
      employer !== original.employer ||
      (location || "") !== original.location ||
      status !== original.status ||
      workMode !== original.work_mode ||
      (notes || "") !== original.notes ||
      dateApplied !== original.job_date
    );
  }, [original, title, employer, location, status, workMode, notes, dateApplied]);

  async function handleResubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!job || !hasChanges) return;
    // basic validation
    if (!title.trim()) return alert("Title required");
    if (!employer.trim()) return alert("Employer required");
    if (!workMode || !["In-person", "Hybrid", "Remote"].includes(workMode)) return alert("Invalid work mode");
    if (!dateApplied || !isValidDate(dateApplied)) return alert("Invalid date");
    setResubmitting(true);
    try {
      const patch: any = {
        job_title: title.trim(),
        employer: employer.trim(),
        work_mode: workMode,
        status,
        notes: notes.trim() || undefined,
        location: location.trim() || undefined,
        job_date: toISO(dateApplied),
      };
      if (USE_SERVER) {
        try {
          const token = await getToken();
          updateJob(job.id, patch, token ?? undefined);
        } catch {
          updateJob(job.id, patch);
        }
      } else {
        updateJob(job.id, patch);
      }
    } finally {
      setResubmitting(false);
    }
  }

  if (!job) {
    return (
            
      <div className="job-view-wrapper">
        <div className="job-view-card">
          <h1 className="job-view-title">Job Not Found</h1>
          <p className="job-view-subtitle">No job with id "{id}".</p>
          <Link to="/job-dashboard" className="inline-block mt-4 underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="job-view-background">
    <div className="job-view-wrapper">
      <div className="job-view-card">
        <div className="job-view-header">
          <h1 className="job-view-title">View / Edit Job</h1>
          <p className="job-view-subtitle">
            Modify fields below and resubmit changes. Notes are private.
          </p>
        </div>
        <form onSubmit={handleResubmit} className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title*"
            className="w-full p-2 border rounded border-gray-400 rounded"
            required
          />
          <input
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
            placeholder="Employer*"
            className="w-full p-2 border rounded border-gray-400 rounded"
            required
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional) — City, State, Country"
            className="w-full p-2 border rounded border-gray-400 rounded"
          />
          <div className="bottom-row">
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as WorkMode)}
              className="workmode-select"
              required
            >
              <option value="" disabled>Work mode*</option>
              <option value="In-person">In-person</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
            <input
              type="text"
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => !e.target.value && (e.target.type = "text")}
              value={dateApplied}
              onChange={(e) => setDateApplied(e.target.value)}
              className="date-input"
              placeholder="Date Applied*"
              required
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="status-select"
              required
            >
              <option value="" disabled>Status*</option>
              <option value="Pre-interview">Pre-interview</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
            </select>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="notes-textarea w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="add-job-btn"
            disabled={!hasChanges || resubmitting}
            aria-disabled={!hasChanges || resubmitting}
          >
            {resubmitting ? "Saving..." : "Resubmit"}
          </button>
          <div className="flex justify-between text-sm mt-2">
            <Link to="/job-dashboard" className="underline">Back to Dashboard</Link>
            {!hasChanges && <span className="text-gray-500">No changes</span>}
            {hasChanges && <span className="text-emerald-600">Unsaved changes</span>}
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
