"use client";

import React, { useState, useRef, useEffect } from "react";
import JobTile from "./JobTile";
import type { Job } from "../../lib/jobStore";
import "./JobColumn.css";

interface JobColumnProps {
  status: string;
  jobs: Job[];
  onUpdate: (id: string, patch: Partial<Job>) => Promise<void>;
  className?: string;
}

export default function JobColumn({ status, jobs, onUpdate, className }: JobColumnProps) {
  const [isOpen, setIsOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (isOpen) {
      el.style.maxHeight = `${el.scrollHeight}px`;
    } else {
      el.style.maxHeight = "0px";
    }
  }, [isOpen, jobs]);

  const getStatusColor = (s: string) => {
    if (s === "Rejected") return "text-red-500";
    if (s === "Interview") return "text-yellow-600";
    if (s === "Offer") return "text-green-700";
    return "text-gray-500";
  };

  return (
    <section className={`border rounded p-2 flex flex-col ${className} job-column-section`}>
      <header className="flex items-center justify-between job-column-header">
        <h2 className={`font-semibold ${getStatusColor(status)} job-column-title`}>{status}</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? `Collapse ${status} column` : `Expand ${status} column`}
          aria-expanded={isOpen}
          title={isOpen ? "Collapse" : "Expand"}
        >
          {isOpen ? "▾" : "▸"}
        </button>
      </header>
      <div
        className="mt-2 tiles-container"
        ref={containerRef}
        aria-hidden={!isOpen}
      >
        <div className="tiles-scroll" role="region" aria-labelledby={`col-${status}`}>
          {jobs.map((j) => (
            <JobTile key={j.id} job={j} onUpdate={onUpdate} />
          ))}
        </div>
      </div>
    </section>
  );
}
