"use client";

import React, { useState } from "react";
import { Link } from "react-router";
import { mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';
import type { Job } from "../../lib/jobStore";
import "./JobTile.css";

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 26 26" fill="currentColor" aria-hidden>
      <path d={mdiPencilOutline} />
    </svg>
  );
}

function toTitleCase(s: string) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function formatLocationForDisplay(raw?: string | null) {
  if (!raw) return null;
  const parts = raw.split(",").map(p => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  const isDC = /^washington\s*,?\s*dc$/i.test(raw);
  if (isDC) return "Washington, DC";
  const isUS = parts.length < 3 || /^(united\s*states|us|usa)$/i.test(parts.at(-1)!);
  const [city, state] = parts;
  if (isUS) {
    if (state) return `${toTitleCase(city)}, ${state.toUpperCase()}`;
    return toTitleCase(city);
  }
  return parts.join(", ");
}

function isValidLocationInput(input?: string | null) {
  if (!input) return true;
  const s = input.trim();
  if (!s) return false;
  if (/^washington\s*,?\s*dc$/i.test(s)) return true;
  const parts = s.split(",").map(p => p.trim()).filter(Boolean);
  return parts.length >= 2;
}

interface JobTileProps {
  job: Job;
  onUpdate: (id: string, patch: Partial<Job>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  showDelete?: boolean;
}

export default function JobTile({ job, onUpdate, onDelete, showDelete = false }: JobTileProps) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const loc = job.location || "";
  const displayLoc = formatLocationForDisplay(job.location || "");
  const hasLocation = !!displayLoc;

  const handleLocationBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = (e.target.value || "").trim();
    if (!raw) {
      await onUpdate(job.id, { location: undefined });
      setIsLocationOpen(false);
      return;
    }
    if (!isValidLocationInput(raw)) {
      alert("Invalid location. Use 'City, State' or 'Washington, DC'.");
      return;
    }
    await onUpdate(job.id, { location: raw });
    setIsLocationOpen(false);
  };

  return (
    <div className="job-tile">
      <div className={showDelete ? "flex items-center justify-between" : ""}>
        <div>
          <div className="font-semibold">
            <Link to={`/job-view/${job.id}`} className="underline hover:no-underline">
              {job.job_title}
            </Link>
          </div>
          <div className="text-sm text-gray-600">
            {job.employer}
          </div>
        </div>
        
        {showDelete && onDelete && (
          <div className="flex items-center gap-2">
            <button
              title="Delete job"
              onClick={async () => {
                if (!confirm(`Delete "${job.job_title}" at ${job.employer}?`)) return;
                await onDelete(job.id);
              }}
              className="text-red-600 hover:text-red-800 px-2 py-1 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d={mdiTrashCanOutline} />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Location area */}
      <div className="text-sm mt-2">
        <div className="job-location-container">
          {isLocationOpen ? (
            <input
              className="w-full border rounded px-1 py-1 text-sm"
              defaultValue={loc}
              placeholder="City, State, Country"
              autoFocus
              onBlur={handleLocationBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
            />
          ) : (
            <div className="job-location-text">
              {job.work_mode === "Remote"
                ? "Remote"
                : `${displayLoc ?? "N/A"} (${String(job.work_mode).toLowerCase()})`}
            </div>
          )}
          <button
            className="job-location-toggle"
            aria-expanded={isLocationOpen}
            onClick={() => setIsLocationOpen(!isLocationOpen)}
          >
            {isLocationOpen ? "Done" : hasLocation ? <EditIcon /> : "Add"}
          </button>
        </div>
      </div>

      <div className="text-sm mt-2">
        Date: {job.job_date ? new Date(job.job_date).toLocaleDateString("en-US") : "N/A"}
      </div>

      <div className="flex items-center gap-4 mt-2 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!job.rejected}
            onChange={async (e) => onUpdate(job.id, { rejected: e.target.checked })}
          />
          <span>Rejected</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!job.ghosted}
            onChange={async (e) => onUpdate(job.id, { ghosted: e.target.checked })}
          />
          <span>Ghosted</span>
        </label>

        <select
          value={job.status}
          onChange={async (e) => {
            const v = e.target.value;
            await onUpdate(job.id, { status: v as any });
          }}
          className="status-select-inline"
          aria-label="Status"
        >
          <option value="Pre-interview">Pre-interview</option>
          <option value="Interview">Interview</option>
          <option value="Offer">Offer</option>
        </select>
      </div>
    </div>
  );
}
