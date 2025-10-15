import React, { useState } from "react";
import { useJobs } from "../lib/jobStore";
import "./job-form.css";

export default function JobForm() {
  type JobStatus = "waiting" | "interview" | "offer" | "rejected";
  const { jobs, addJob } = useJobs();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [skills, setSkills] = useState("");
  const [status, setStatus] = useState<JobStatus>("waiting");
  const [dateApplied, setDateApplied] = useState("");
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | JobStatus>(""); // "" means all

  function submit(e: React.FormEvent) {
    e.preventDefault();
    addJob({
      title,
      company,
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      status,
      dateApplied,
      notes,
    });
    setTitle("");
    setCompany("");
    setSkills("");
    setDateApplied("");
    setNotes("");
  }

  return (
    <div className="max-w-xl mx-auto job-form-page">
      <h1 className="text-2xl mb-4">Add Job</h1>
      <form onSubmit={submit} className="space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full p-2 border rounded" />
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className="w-full p-2 border rounded" />
        <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills (comma separated)" className="w-full p-2 border rounded" />
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full p-2 border rounded" />
        <input
          type="date"
          value={dateApplied}
          onChange={(e) => setDateApplied(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)} className="w-full p-2 border rounded">
          <option value="waiting">Waiting</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Add Job</button>
      </form>
      <div className="mt-8">
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
            <option value="waiting">Waiting</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
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
                  <div className="font-semibold">{job.title} <span className="text-gray-500">at</span> {job.company}</div>
                  <div className="text-sm text-gray-700">Skills: {job.skills.join(", ")}</div>
                  <div className="text-xs text-blue-700 mt-1">Status: {job.status}</div>
                  <div className="text-xs text-gray-600 mt-1">Date Applied: {job.dateApplied || "N/A"}</div>
                  <div className="text-xs text-gray-600 mt-1">Notes: {job.notes || "None"}</div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
