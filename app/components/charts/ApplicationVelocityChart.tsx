"use client";
import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useJobs } from "../../lib/jobStore";

export default function ApplicationVelocityChart() {
  const { jobs } = useJobs();

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Group by week (Monday start)
    jobs.forEach((job) => {
      if (!job.job_date) return;
      const d = new Date(job.job_date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const key = monday.toISOString().split("T")[0];
      
      counts[key] = (counts[key] || 0) + 1;
    });

    const sortedKeys = Object.keys(counts).sort();
    if (sortedKeys.length === 0) return [];

    // Fill gaps between first and last date
    const result = [];
    const start = new Date(sortedKeys[0]);
    const end = new Date(sortedKeys[sortedKeys.length - 1]);
    // Add a buffer week at the end for visual balance
    end.setDate(end.getDate() + 7);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
        const k = d.toISOString().split("T")[0];
        result.push({
            date: k,
            count: counts[k] || 0
        });
    }

    return result;
  }, [jobs]);

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-400 text-sm">No date data available</div>;
  }

  return (
    <div className="w-full h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            minTickGap={30}
            tick={{ fontSize: 12 }}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip 
            labelFormatter={(label) => `Week of ${new Date(label).toLocaleDateString()}`}
          />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorCount)" 
            name="Applications"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
