"use client";
import { useMemo } from "react";
import { ResponsiveCalendar } from "@nivo/calendar";
import { useJobs } from "../../lib/jobStore";

export default function CalendarHeatmap() {
  const { jobs } = useJobs();

  const { data, from, to } = useMemo(() => {
    const counts: Record<string, number> = {};
    let minDate = new Date();
    let maxDate = new Date(0); 

    if (jobs.length === 0) {
        const now = new Date();
        const lastYear = new Date();
        lastYear.setFullYear(now.getFullYear() - 1);
        return { data: [], from: lastYear.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }

    jobs.forEach((job) => {
      if (!job.job_date) return;
      const d = new Date(job.job_date);
      const key = d.toISOString().split("T")[0];
      counts[key] = (counts[key] || 0) + 1;
      
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    });

    const mappedData = Object.entries(counts).map(([day, value]) => ({
      day,
      value,
    }));

    // Default to last 12 months ending today for a consistent view
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // If data exists outside the last year, expand the range, otherwise stick to last year
    const fromDate = minDate < oneYearAgo ? minDate : oneYearAgo;
    const toDate = maxDate > now ? maxDate : now;

    return { 
        data: mappedData, 
        from: fromDate.toISOString().split("T")[0], 
        to: toDate.toISOString().split("T")[0] 
    };
  }, [jobs]);

  return (
    <div className="w-full h-[280px]">
      <ResponsiveCalendar
        data={data}
        from={from}
        to={to}
        emptyColor="#eeeeee"
        colors={['#d1fae5', '#6ee7b7', '#34d399', '#10b981', '#047857']}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
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
  );
}
