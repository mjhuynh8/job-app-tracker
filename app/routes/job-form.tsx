"use client";

import React, { useState } from "react";
import { useJobs } from "../lib/jobStore";
import "./job-form.css";
import { useAuth } from "@clerk/clerk-react";

export default function JobForm() {
  const { getToken } = useAuth(); // ← top-level hook
  const { jobs, addJob } = useJobs();
  type JobStatus = "Pre-interview" | "Interview" | "Offer";
  const [title, setTitle] = useState("");
  const [employer, setEmployer] = useState("");
  const [skills, setSkills] = useState("");
  const [status, setStatus] = useState<JobStatus | "">("");
  const [dateApplied, setDateApplied] = useState("");
  const [description, setDescription] = useState("");

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
        !status ||
        !["Pre-interview", "Interview", "Offer"].includes(status)
      ) {
        alert("Status must be one of: Pre-interview, Interview, Offer.");
        return;
      }
      if (!dateApplied || !isValidDate(dateApplied)) {
        alert("Date Applied must be a valid date.");
        return;
      }

      // when running on localhost, bypass the
      // function and persist directly into the client store to
      // develop locally without deploying the Netlify functions
      const jobData = {
        job_title: title.trim(),
        employer: employer.trim(),
        job_date: new Date(dateApplied).toISOString(),
        status,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .join(", "),
        description: description.trim(),
      };
      // If running on localhost, add directly to local store
      if (
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1")
      ) {
        addJob(jobData as any);
        // reset form
        setTitle("");
        setEmployer("");
        setSkills("");
        setDateApplied("");
        setDescription("");
        setStatus("");
        return; // exit early
      }

      // get Clerk token (getToken is from top-level useAuth)
      const token = await getToken();
      console.log("Got Clerk token:", !!token);

      const res = await fetch("/.netlify/functions/jobs-create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // include token in the body as a fallback in case a proxy/edge strips Authorization
        body: JSON.stringify({ ...jobData, token }),
      });

      const text = await res.text();
      console.log("jobs-create response status:", res.status, "body:", text);

      if (!res.ok) {
        throw new Error(text || `Server returned ${res.status}`);
      }

      const savedJob = JSON.parse(text);

      // normalize server shape to your Job type
      const normalized = {
        id:
          savedJob.id ??
          (savedJob._id
            ? String(savedJob._id)
            : Math.random().toString(36).slice(2)),
        userid: savedJob.userId ?? savedJob.userId ?? undefined,
        job_title: savedJob.job_title,
        employer: savedJob.employer,
        job_date: savedJob.job_date
          ? typeof savedJob.job_date === "string"
            ? savedJob.job_date
            : new Date(savedJob.job_date).toISOString()
          : undefined,
        status: savedJob.status,
        skills: typeof savedJob.skills === "string" ? savedJob.skills : "",
        description: savedJob.description,
        rejected: !!savedJob.rejected,
        ghosted: !!savedJob.ghosted,
      };

      addJob(normalized);

      // reset form
      setTitle("");
      setEmployer("");
      setSkills("");
      setDateApplied("");
      setDescription("");
      setStatus("");
    } catch (err) {
      console.error("submit error", err);
      alert("Failed to save job. See console for details.");
    }
  }
  return (
    <div className="job-form-background">
      <div className="max-w-xl mx-auto job-form-page">
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
          {/* employer input (replaces company) */}
          <input
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
            placeholder="Employer*"
            className="w-full p-2 border rounded"
            required
          />
          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Skills (comma separated)"
            className="w-full p-2 border rounded"
          />
          {/* description (larger, resizable textarea) */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={5}
            className="w-full p-2 border rounded description-textarea"
            aria-label="Job description"
          />
          <input
            type="text"
            onFocus={(e) => (e.target.type = "date")}
            onBlur={(e) => !e.target.value && (e.target.type = "text")}
            value={dateApplied}
            onChange={(e) => setDateApplied(e.target.value)}
            className="w-full p-2 border rounded text-gray-700"
            placeholder="Date Applied*"
          />
          {/* status options now match DB enum */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus)}
            className="w-full p-2 border rounded text-gray-700"
            required
          >
            <option value="" disabled>
              Status*
            </option>
            <option value="Pre-interview">Pre-interview</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
          </select>
          <button
            className="add-job-btn"
            type="submit"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
/*	<div className="mt-8">
				<h2 className="text-xl mb-2">All Job Applications</h2>
				<div className="mb-4 flex gap-2 items-center">
					<label htmlFor="statusFilter" className="text-sm font-medium">Filter by status:</label>
					<select
						id="statusFilter"
						value={statusFilter}
						onChange={e => setStatusFilter(e.target.value as "" | JobStatus)}
						className="p-2 border rounded"
					>
						<option value="">All</option>
						<option value="Pre-interview">Pre-interview</option>
						<option value="Interview">Interview</option>
						<option value="Offer">Offer</option>
					</select>
				</div>
				{jobs.length === 0 ? (
					<p className="text-gray-500">No jobs added yet.</p>
				) : (
					<ul className="space-y-3">
						{jobs
							.filter(job => !statusFilter || job.status === statusFilter)
							.map((job) => (
								<li key={job.id} className="border rounded p-3 bg-white shadow">
									<div className="font-semibold">
										{job.job_title} <span className="text-gray-500">at</span> {job.employer}
									</div>
									<div className="text-sm text-gray-700">
										Skills: {job.skills || "N/A"}
									</div>
									<div className="text-xs text-gray-600 mt-1">Job Description: {job.description ?? "None"}</div>
									<div className="text-xs text-blue-700 mt-1">Status: {job.status}</div>
									<div className="text-xs text-gray-600 mt-1">Date Applied: {
										job.job_date ? new Date(job.job_date).toLocaleDateString() : "N/A"
									}</div>
									{job.rejected ? <div className="text-xs text-red-600 mt-1">Rejected</div> : null}
									{job.ghosted ? <div className="text-xs text-gray-500 mt-1">Ghosted</div> : null}
								</li>
							))}
					</ul>
				)}
			</div> */
