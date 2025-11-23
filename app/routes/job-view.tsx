"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { useJobs } from "../lib/jobStore";
import { useAuth } from "@clerk/clerk-react";
import "./job-view.css";

const USE_SERVER = (import.meta.env.VITE_USE_SERVER ?? "true") === "true";

export default function JobView() {
  const { id } = useParams() as { id: string };
  const { jobs, updateJob } = useJobs();
  const { getToken } = useAuth();
  const job = useMemo(() => jobs.find((j) => j.id === id), [jobs, id]);

  const [notes, setNotes] = useState("");
  const originalNotes = job?.notes ?? "";
  const hasChanges = notes !== originalNotes;
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    if (!job) return;
    setNotes(job.notes ?? "");
  }, [job]);

  async function handleResubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!job || !hasChanges) return;
    setResubmitting(true);
    try {
      const patch = { notes: notes.trim() || undefined };
      if (USE_SERVER) {
        const token = await getToken();
        if (!token) {
          alert("No auth token; cannot save notes in server mode.");
        } else {
          updateJob(job.id, patch, token);
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

  const appliedDate = job.job_date ? new Date(job.job_date).toLocaleDateString() : "N/A";

  return (
    <div className="job-view-background">
      <div className="job-view-wrapper">
        <div className="job-view-card">
          <div className="job-view-header">
            <h1 className="job-view-title">Review Job Notes</h1>
            <p className="job-view-subtitle">
              Notes are private to you. Update and resubmit to save any changes.
            </p>
          </div>

          {/* Summary line */}
          <div className="job-summary">
            {job.job_title} at {job.employer}, applied on {appliedDate}.
          </div>

          <form onSubmit={handleResubmit} className="space-y-3 job-view-form">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes about this job (contacts, links, skills, interview questions, etc.)"
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
