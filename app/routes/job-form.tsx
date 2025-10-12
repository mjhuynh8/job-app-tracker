import { useState } from "react";
import { useJobs } from "../lib/jobStore";
import "./job-form.css";

export default function JobForm() {
  const { addJob } = useJobs();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [skills, setSkills] = useState("");
  const [status, setStatus] = useState<JobStatus>("waiting");

  type JobStatus = "waiting" | "interview" | "offer" | "rejected";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    addJob({ title, company, skills: skills.split(",").map((s) => s.trim()).filter(Boolean), status });
    setTitle("");
    setCompany("");
    setSkills("");
  }

  return (
    <div className="max-w-xl mx-auto job-form-page">
      <h1 className="text-2xl mb-4">Add Job</h1>
      <form onSubmit={submit} className="space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full p-2 border rounded" />
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className="w-full p-2 border rounded" />
        <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills (comma separated)" className="w-full p-2 border rounded" />
        <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)} className="w-full p-2 border rounded">
          <option value="waiting">Waiting</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Add Job</button>
      </form>
    </div>
  );
}
