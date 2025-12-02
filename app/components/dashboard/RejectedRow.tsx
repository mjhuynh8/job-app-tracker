"use client";

import React, { useState, useRef, useEffect } from "react";
import JobTile from "./JobTile";
import type { Job } from "../../lib/jobStore";
import "./RejectedRow.css";

interface RejectedRowProps {
  jobs: Job[];
  onUpdate: (id: string, patch: Partial<Job>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  className?: string;
}

export default function RejectedRow({ jobs, onUpdate, onDelete, className }: RejectedRowProps) {
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

  return (
    <section className={`mt-4 border rounded p-2 flex flex-col ${className} rejected-horizontal`}>
      <header className="flex items-center justify-between job-column-header">
        <h2 className="font-semibold text-red-500 job-column-title">Rejected</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Collapse Rejected column" : "Expand Rejected column"}
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
        <div className="tiles-scroll" role="region" aria-labelledby="col-Rejected">
          {jobs.map((j) => (
            <JobTile 
              key={j.id} 
              job={j} 
              onUpdate={onUpdate} 
              onDelete={onDelete} 
              showDelete={true} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}
