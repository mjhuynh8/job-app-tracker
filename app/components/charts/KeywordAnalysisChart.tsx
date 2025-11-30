"use client";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { useJobs } from "../../lib/jobStore";

const GRAMMAR_STOP_WORDS = new Set(["a", "an", "the", "and", "or", "of", "to", "in", "for", "with", "at", "by", "from", "-", "&", "|", "/"]);

export default function KeywordAnalysisChart() {
  const { jobs } = useJobs();

  const data = useMemo(() => {
    const counts: Record<string, number> = {};

    jobs.forEach((job) => {
      if (!job.job_title) return;
      // Tokenize
      const tokens = job.job_title
        .toLowerCase()
        .replace(/[^\w\s]/g, " ") // remove punctuation
        .split(/\s+/)
        .filter(t => t.length > 2 && !GRAMMAR_STOP_WORDS.has(t));

      tokens.forEach(t => {
        // Capitalize for display
        const word = t.charAt(0).toUpperCase() + t.slice(1);
        counts[word] = (counts[word] || 0) + 1;
      });
    });

    // Top 10
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [jobs]);

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-400 text-sm">No job titles to analyze</div>;
  }

  return (
    <div className="w-full h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
          <Tooltip cursor={{fill: 'transparent'}} />
          <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Count">
             {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#3b82f6" : "#60a5fa"} />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
