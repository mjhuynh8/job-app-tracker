"use client";

import React, { useState } from "react";
import { useJobs } from "../lib/jobStore";
import "./job-form.css";
import { useAuth } from "@clerk/clerk-react";
import Lottie from "lottie-react";
import confettiAnimation from "../../public/assets/Confetti.json";

// Set to false to use localStorage-only mode for development.
const USE_SERVER = true;

export default function JobForm() {
  const { getToken } = useAuth();
  const { jobs, addJob } = useJobs();
  type JobStatus = "Pre-interview" | "Interview" | "Offer";
  const [title, setTitle] = useState("");
  const [employer, setEmployer] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<JobStatus | "">("");
  const [dateApplied, setDateApplied] = useState("");
  const [workMode, setWorkMode] = useState<"In-person" | "Hybrid" | "Remote" | "">("");
  const [notes, setNotes] = useState("");
  const [submittedMsg, setSubmittedMsg] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  function isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    try {
      // validation
      if (!title.trim()) {
        alert("Job title is required.");
        return;
      }
      if (!employer.trim()) {
        alert("Employer is required.");
        return;
      }
      if (
        !workMode ||
        !["In-person", "Hybrid", "Remote"].includes(workMode)
      ) {
        alert("Work mode must be one of: In-person, Hybrid, Remote.");
        return;
      }
      if (!dateApplied || !isValidDate(dateApplied)) {
        alert("Date Applied must be a valid date.");
        return;
      }

      const jobData = {
        job_title: title.trim(),
        employer: employer.trim(),
        job_date: new Date(dateApplied).toISOString(),
        status,
        work_mode: workMode,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (USE_SERVER) {
        try {
          const token = await getToken();
          if (token) {
            const res = await fetch("/.netlify/functions/jobs-create", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ...jobData, token }),
            });
            const text = await res.text();
            if (!res.ok) {
              console.warn("jobs-create failed, falling back to addJob:", res.status, text);
              throw new Error("Server create failed");
            }
            const savedJob = JSON.parse(text);
            const normalized = {
              id:
                savedJob.id ??
                (savedJob._id ? String(savedJob._id) : Math.random().toString(36).slice(2)),
              userid: savedJob.userId ?? savedJob.userId ?? undefined,
              job_title: savedJob.job_title,
              employer: savedJob.employer,
              job_date: savedJob.job_date
                ? typeof savedJob.job_date === "string"
                  ? savedJob.job_date
                  : new Date(savedJob.job_date).toISOString()
                : undefined,
              status: savedJob.status,
              work_mode: savedJob.work_mode ?? "In-person",
              location: savedJob.location ?? undefined,
              rejected: !!savedJob.rejected,
              ghosted: !!savedJob.ghosted,
            };
            addJob(normalized as any); // client state update (server insert already done)
          } else {
            // Try a second token fetch and let addJob attempt server persistence
            const retryToken = await getToken().catch(() => null);
            addJob(jobData as any, retryToken ?? undefined);
          }
        } catch (err) {
          console.warn("JobForm server create failed, using local store with token attempt:", err);
          const retryToken = await getToken().catch(() => null);
          addJob(jobData as any, retryToken ?? undefined);
        }
      } else {
        // local-only mode
        addJob(jobData as any);
      }

      // reset form
      setTitle("");
      setEmployer("");
      setLocation("");
      setDateApplied("");
      setWorkMode("");
      setStatus("");
      setNotes("");
      setSubmittedMsg("Job added! Go check it out on your Dashboard!");
      // show confetti briefly
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
      setTimeout(() => setSubmittedMsg(""), 4000);
    } catch (err) {
      console.error("submit error", err);
      alert("Failed to save job. See console for details.");
    }
  }

  return (
    <div className="job-form-background">
      <div className="max-w-xl mx-auto job-form-page">
        {/* confetti overlay (non-interactive) */}
        {showConfetti && (
          <div className="confetti-overlay" aria-hidden="true">
            <Lottie
              animationData={confettiAnimation}
              loop={false}
              autoplay
              className="confetti-lottie"
            />
          </div>
        )}
         <div className="job-form-header">
           <h1 className="job-form-title">Add a Job</h1>
           <p className="job-form-subtitle">
             Quickly save a job application — track dates, status, and notes.
           </p>
         </div>
         <form onSubmit={submit} className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title*"
            className="w-full p-2 border rounded"
            required
          />
          <input
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
            placeholder="Employer*"
            className="w-full p-2 border rounded"
            required
          />

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional) — City, State, Country"
            className="location-input w-full p-2 border rounded"
          />

          <div className="bottom-row">
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as any)}
              className="workmode-select"
              required
            >
              <option value="" disabled>
                Work mode*
              </option>
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
              <option value="" disabled>
                Status*
              </option>
              <option value="Pre-interview">Pre-interview</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
            </select>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional) — Any additional info, links, contacts, etc."
            className="notes-textarea w-full p-2 border rounded"
          />

          <button
            className="add-job-btn"
            type="submit"
          >
            Submit
          </button>
          {submittedMsg && (
            <div className="mt-2 p-2 text-sm rounded text-green-800 bg-green-100 border border-green-300">
              {submittedMsg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
