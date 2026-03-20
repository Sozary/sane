"use client";

import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getScoreConfig(score: number) {
  if (score >= 80) return { label: "Excellent !", color: "#22c55e" };
  if (score >= 60) return { label: "Très bien", color: "#4ade80" };
  if (score >= 40) return { label: "Bon", color: "#facc15" };
  if (score >= 20) return { label: "Moyen", color: "#f97316" };
  return { label: "À améliorer", color: "#ef4444" };
}

const sizes = {
  sm: { outer: "size-12", text: "text-sm", label: "text-[10px]" },
  md: { outer: "size-16", text: "text-lg", label: "text-xs" },
  lg: { outer: "size-20", text: "text-2xl", label: "text-sm" },
};

export function ScoreBadge({ score, size = "md", className }: ScoreBadgeProps) {
  const config = getScoreConfig(score);
  const s = sizes[size];

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold text-white",
          s.outer
        )}
        style={{ backgroundColor: config.color }}
      >
        <span className={s.text}>{score}</span>
      </div>
      <span className={cn("font-medium", s.label)} style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}
