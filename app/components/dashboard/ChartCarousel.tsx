"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';
import ChartCard, { type ChartType } from "./ChartCard";
import "./ChartCarousel.css";

export default function ChartCarousel() {
  const [charts, setCharts] = useState<ChartType[]>(["pie", "sankey", "bar", "velocity", "heatmap", "keywords"]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const actionRef = useRef<"left" | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (isAnimating || !containerRef.current) return;
    
    const container = containerRef.current;
    const firstCard = container.firstElementChild as HTMLElement;
    if (!firstCard) return;
    
    const cardWidth = firstCard.offsetWidth;
    const gap = 16; // gap-4 is 1rem
    const moveAmount = cardWidth + gap;

    setIsAnimating(true);

    if (direction === "right") {
      // Slide left then swap
      container.style.transition = "transform 0.3s ease-in-out";
      container.style.transform = `translateX(-${moveAmount}px)`;

      setTimeout(() => {
        container.style.transition = "none";
        container.style.transform = "translateX(0)";
        setCharts((prev) => [...prev.slice(1), prev[0]]);
        setIsAnimating(false);
      }, 300);
    } else {
      // Swap then slide right (handled in useLayoutEffect)
      actionRef.current = "left";
      setCharts((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
    }
  };

  useLayoutEffect(() => {
    if (actionRef.current === "left" && containerRef.current) {
      const container = containerRef.current;
      const firstCard = container.firstElementChild as HTMLElement;
      if (!firstCard) return;

      const cardWidth = firstCard.offsetWidth;
      const gap = 16;
      const moveAmount = cardWidth + gap;

      // Instantly shift to hide the new first element
      container.style.transition = "none";
      container.style.transform = `translateX(-${moveAmount}px)`;
      
      // Force reflow
      container.getBoundingClientRect();

      // Animate to 0
      container.style.transition = "transform 0.3s ease-in-out";
      container.style.transform = "translateX(0)";
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        container.style.transition = "none";
        actionRef.current = null;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [charts]);

  return (
    <div className="conveyor-belt-container group">
      <div className="conveyor-belt-inner">
        {/* Left Arrow - Taller, semi-transparent */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-slate-900/20 hover:bg-slate-900/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-l-lg backdrop-blur-sm"
          aria-label="Scroll left"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-md">
            <path d={mdiChevronLeft} />
          </svg>
        </button>

        {/* Scroll Container */}
        <div className="overflow-hidden">
          <div
            ref={containerRef}
            className="flex gap-4 pb-2 px-1"
          >
            {charts.map((type) => (
              <div key={type} className="min-w-[100%] md:min-w-[calc(50%-0.5rem)] xl:min-w-[calc(33.333%-0.67rem)] flex-shrink-0">
                <ChartCard initialType={type} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-slate-900/20 hover:bg-slate-900/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-r-lg backdrop-blur-sm"
          aria-label="Scroll right"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-md">
            <path d={mdiChevronRight} />
          </svg>
        </button>
      </div>
    </div>
  );
}
