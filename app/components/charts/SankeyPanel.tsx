"use client";
import { useMemo } from "react";
import { ResponsiveSankey } from "@nivo/sankey";
import type { Job } from "../../lib/jobStore";

// Define specific colors for nodes
const NODE_COLORS: Record<string, string> = {
  Applied: "#9ca3af",   // gray-400
  Rejected: "#f87171",  // red-400
  Interview: "#fbbf24", // amber-400
  Offer: "#34d399",     // emerald-400
};

export default function SankeyPanel({
  jobs,
  startDateISO,
  endDateISO,
}: {
  jobs: Job[];
  startDateISO: string | null;
  endDateISO: string | null;
}) {
  const data = useMemo(() => {
    const appliedTotal = jobs.length;
    const rejectedCount = jobs.filter((j) => !!j.rejected).length;
    const interviewOnly = jobs.filter((j) => j.status === "Interview").length;
    const offerCount = jobs.filter((j) => j.status === "Offer").length;
    
    // Logic: Applied splits into Rejected and Interview. 
    // Interview splits into Offer (and implicitly non-offers, but we just show flow to Offer here).
    // To make the flow continuous:
    // Applied -> Rejected
    // Applied -> Interview
    // Interview -> Offer
    
    // Note: For Nivo, nodes are just objects with an id.
    const nodes = [
      { id: "Applied", nodeColor: NODE_COLORS.Applied },
      { id: "Rejected", nodeColor: NODE_COLORS.Rejected },
      { id: "Interview", nodeColor: NODE_COLORS.Interview },
      { id: "Offer", nodeColor: NODE_COLORS.Offer },
    ];

    const links = [
      { source: "Applied", target: "Rejected", value: rejectedCount },
      { source: "Applied", target: "Interview", value: interviewOnly + offerCount }, // Flow into interview includes offers
      { source: "Interview", target: "Offer", value: offerCount },
    ].filter(l => l.value > 0);

    return { nodes, links };
  }, [jobs]);

  if (data.links.length === 0) {
    return <div className="text-sm text-slate-600 p-4">No data to render for this period.</div>;
  }

  return (
    <div className="w-full">
      <div className="w-full h-[320px]">
        <ResponsiveSankey
          data={data}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          align="justify"
          colors={(node: any) => node.nodeColor}
          nodeOpacity={1}
          nodeHoverOthersOpacity={0.35}
          nodeThickness={18}
          nodeSpacing={24}
          nodeBorderWidth={0}
          nodeBorderRadius={3}
          
          // Links
          linkOpacity={0.6}
          linkHoverOthersOpacity={0.1}
          linkContract={0}
          enableLinkGradient={true}
          
          // Labels
          enableLabels={true}
          label={(node) => `${node.id} (${node.value})`} // Custom label with count
          labelPosition="inside"
          labelOrientation="horizontal"
          labelPadding={16}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
          
          // Tooltip
          linkTooltip={({ link }) => (
            <div className="bg-white p-2 border border-slate-200 shadow-sm rounded text-xs text-slate-800">
              <strong>{link.source.id}</strong> → <strong>{link.target.id}</strong>
              <br />
              {link.value} jobs
            </div>
          )}
        />
      </div>
    </div>
  );
}
