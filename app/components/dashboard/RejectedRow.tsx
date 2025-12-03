"use client";

import React, { useState, useRef, useEffect } from "react";
import { mdiTrashCanOutline, mdiChevronRight, mdiChevronLeft } from '@mdi/js';
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
  const [isDeleteExpanded, setIsDeleteExpanded] = useState(false);
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

  const handleBulkDelete = async () => {
    if (!jobs.length) return;
    if (!window.confirm("Are you sure you want to delete all rejected jobs?")) return;
    for (const j of jobs) await onDelete(j.id);
    setIsDeleteExpanded(false);
  };

  return (
    <section className={`mt-4 border rounded p-2 flex flex-col ${className} rejected-horizontal`}>
      <header className="flex items-center justify-between job-column-header relative min-h-[32px]">
        {/* Left: Collapse Row Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Collapse Rejected column" : "Expand Rejected column"}
          aria-expanded={isOpen}
          title={isOpen ? "Collapse" : "Expand"}
          className="z-10"
        >
          {isOpen ? "▾" : "▸"}
        </button>
        
        {/* Center: Title + Controls */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          <h2 className="font-semibold text-red-500 whitespace-nowrap">Rejected</h2>
          
          {jobs.length > 0 && (
            <div className="flex items-center">
              <button
                onClick={() => setIsDeleteExpanded(!isDeleteExpanded)}
                className="text-gray-500 hover:text-gray-800 transition-colors flex items-center"
                aria-label={isDeleteExpanded ? "Hide delete button" : "Show delete button"}
                title={isDeleteExpanded ? "Hide" : "Show Delete Option"}
              >
                <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24" fill="currentColor">
                  <path d={mdiTrashCanOutline} />
                </svg>
                <svg style={{ width: "20px", height: "20px" }} viewBox="0 0 24 24" fill="currentColor">
                  <path d={isDeleteExpanded ? mdiChevronLeft : mdiChevronRight} />
                </svg>
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out flex items-center ${
                  isDeleteExpanded ? "max-w-[150px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0"
                }`}
              >
                <button
                  onClick={handleBulkDelete}
                  className="px-2 py-1 text-xs font-semibold rounded border border-red-500 text-red-600 bg-white hover:bg-red-50 flex items-center gap-1 whitespace-nowrap"
                  title="Delete all rejected jobs"
                >
                  <svg style={{ width: "14px", height: "14px" }} viewBox="0 0 24 24" fill="currentColor">
                    <path d={mdiTrashCanOutline} />
                  </svg>
                  Delete all
                </button>
              </div>
            </div>
          )}
        </div>
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
