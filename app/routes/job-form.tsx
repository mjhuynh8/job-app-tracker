import React, { useState } from "react";
import { useJobs } from "../lib/jobStore";
import "./job-form.css";

export default function JobForm() {
	// Update status values to match DB enum
	type JobStatus = "Pre-interview" | "Interview" | "Offer";
	const { jobs, addJob } = useJobs();

	const [title, setTitle] = useState("");
	const [employer, setEmployer] = useState("");
	const [skills, setSkills] = useState("");
	const [status, setStatus] = useState<JobStatus | "">("");
	const [dateApplied, setDateApplied] = useState("");
	// description — make this a textarea now
	const [description, setDescription] = useState("");
	const [statusFilter, setStatusFilter] = useState<"" | JobStatus>(""); // "" means all

	function submit(e: React.FormEvent) {
		e.preventDefault();
		// Build job object matching DB schema
		addJob({
			// Replace "" with actual userid when available
			userid: "",
			job_title: title,
			employer,
			// convert to ISO string if provided; otherwise omit/undefined
			job_date: dateApplied ? new Date(dateApplied).toISOString() : undefined,
			status: status as JobStatus,
			// schema expects skills as a string — store as comma separated string
			skills: skills
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean)
				.join(", "),
			description,
		});
		// reset fields
		setTitle("");
		setEmployer("");
		setSkills("");
		setDateApplied("");
		setDescription("");
		setStatus("");
	}

	return (
		<div className="max-w-xl mx-auto job-form-page">
			<h1 className="text-2xl mb-4">Add Job</h1>
			<form onSubmit={submit} className="space-y-3">
				<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title*" className="w-full p-2 border rounded" required/>
				{/* employer input (replaces company) */}
				<input value={employer} onChange={(e) => setEmployer(e.target.value)} placeholder="Employer*" className="w-full p-2 border rounded" required/>
				<input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills (comma separated)" className="w-full p-2 border rounded" />
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
					placeholder="Date Applied"
				/>
				{/* status options now match DB enum */}
				<select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)} className="w-full p-2 border rounded" required>
					<option value="" disabled>Status*</option>
					<option value="Pre-interview">Pre-interview</option>
					<option value="Interview">Interview</option>
					<option value="Offer">Offer</option>
				</select>
				<button className="px-4 py-2 bg-blue-600 text-white rounded">Add Job</button>
			</form>
		
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