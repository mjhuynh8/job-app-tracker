"use client";
import { useMemo, useState, useEffect } from "react";
import { ResponsiveCalendar } from "@nivo/calendar";
import { useJobs } from "../../lib/jobStore";
import { mdiChevronUp, mdiChevronDown } from '@mdi/js';

export default function CalendarHeatmap() {
  const { jobs } = useJobs();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const { years, counts } = useMemo(() => {
    const counts: Record<string, number> = {};
    const yearsSet = new Set<number>();

    if (jobs.length === 0) {
        return { years: [], counts: {} };
    }

    jobs.forEach((job) => {
      if (!job.job_date) return;
      const d = new Date(job.job_date);
      if (isNaN(d.getTime())) return;

      // Use local time to match user's perspective and avoid UTC shifts
      const y = d.getFullYear();
      yearsSet.add(y);
      
      // Construct YYYY-MM-DD key using local time components
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      
      counts[key] = (counts[key] || 0) + 1;
    });

    const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);
    return { years: sortedYears, counts };
  }, [jobs]);

  // Initialize or validate selectedYear
  useEffect(() => {
    if (years.length > 0) {
        // If selectedYear is not set, or not in the available years, default to the latest
        if (selectedYear === null || !years.includes(selectedYear)) {
            setSelectedYear(years[years.length - 1]);
        }
    } else {
        // Fallback if no data
        if (selectedYear === null) {
            setSelectedYear(new Date().getFullYear());
        }
    }
  }, [years, selectedYear]);

  const handleUp = () => {
      if (!selectedYear) return;
      const idx = years.indexOf(selectedYear);
      if (idx > 0) setSelectedYear(years[idx - 1]);
  };

  const handleDown = () => {
      if (!selectedYear) return;
      const idx = years.indexOf(selectedYear);
      if (idx < years.length - 1) setSelectedYear(years[idx + 1]);
  };

  const { data, from, to } = useMemo(() => {
      const year = selectedYear || new Date().getFullYear();
      const fromDate = `${year}-01-01`;
      const toDate = `${year}-12-31`;
      
      const mappedData = Object.entries(counts)
        .filter(([day]) => day.startsWith(String(year)))
        .map(([day, value]) => ({ day, value }));

      return { data: mappedData, from: fromDate, to: toDate };
  }, [counts, selectedYear]);

  const currentIdx = selectedYear ? years.indexOf(selectedYear) : -1;
  const canGoUp = currentIdx > 0;
  const canGoDown = currentIdx !== -1 && currentIdx < years.length - 1;
  const showControls = years.length > 1;

  return (
    <div className="w-full h-[280px] flex relative group/heatmap">
      <div className="flex-1 h-full">
        <ResponsiveCalendar
          data={data}
          from={from}
          to={to}
          emptyColor="#eeeeee"
          colors={['#d1fae5', '#6ee7b7', '#34d399', '#10b981', '#047857']}
          margin={{ top: 20, right: showControls ? 40 : 20, bottom: 20, left: 20 }}
          yearSpacing={40}
          monthBorderColor="#ffffff"
          dayBorderWidth={2}
          dayBorderColor="#ffffff"
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'row',
              translateY: 36,
              itemCount: 4,
              itemWidth: 42,
              itemHeight: 36,
              itemsSpacing: 14,
              itemDirection: 'right-to-left'
            }
          ]}
        />
      </div>
      
      {showControls && (
         <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-slate-200 shadow-sm z-10">
            <button 
                onClick={handleUp} 
                disabled={!canGoUp}
                className={`p-1 rounded hover:bg-slate-100 transition-colors ${!canGoUp ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600'}`}
                title="Previous Year"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d={mdiChevronUp}/></svg>
            </button>
            <span className="text-xs font-bold text-slate-600 py-1">{selectedYear}</span>
            <button 
                onClick={handleDown} 
                disabled={!canGoDown}
                className={`p-1 rounded hover:bg-slate-100 transition-colors ${!canGoDown ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600'}`}
                title="Next Year"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d={mdiChevronDown}/></svg>
            </button>
         </div>
      )}
    </div>
  );
}
