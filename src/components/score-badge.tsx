"use client";

import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getScoreConfig(score: number) {
  if (score >= 80) {
    return {
      label: "Excellent !",
      color: "var(--sane-accent)",
      textColor: "var(--sane-accent)",
      bgColor: "var(--sane-accent-soft)",
    };
  }
  if (score >= 60) {
    return {
      label: "Très bien",
      color: "#D8C36A",
      textColor: "#A0882A",
      bgColor: "#F6EFCB",
    };
  }
  if (score >= 40) {
    return {
      label: "Bon",
      color: "#E7A45A",
      textColor: "#B66E24",
      bgColor: "#F9E2C8",
    };
  }
  if (score >= 20) {
    return {
      label: "Moyen",
      color: "#E57D63",
      textColor: "#C45134",
      bgColor: "#F7D8D0",
    };
  }
  return {
    label: "À améliorer",
    color: "var(--sane-burn)",
    textColor: "var(--sane-burn)",
    bgColor: "var(--sane-burn-soft)",
  };
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
          "rounded-full flex items-center justify-center font-bold shadow-sm",
          s.outer
        )}
        style={{
          backgroundColor: config.bgColor,
          color: config.textColor,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        <span className={s.text}>{score}</span>
      </div>
      <span className={cn("font-medium", s.label)} style={{ color: config.textColor }}>
        {config.label}
      </span>
    </div>
  );
}
