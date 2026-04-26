"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CalorieRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  className?: string;
  showTipDot?: boolean;
  children?: React.ReactNode;
}

export function CalorieRing({
  value,
  max,
  size = 200,
  strokeWidth = 6,
  color = "#A4B465",
  trackColor = "rgba(0,0,0,0.05)",
  className,
  showTipDot = true,
  children,
}: CalorieRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animate progress from 0 on mount so the ring fills in nicely.
  const [animatedValue, setAnimatedValue] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setAnimatedValue(value), 60);
    return () => window.clearTimeout(id);
  }, [value]);

  const progress = max > 0 ? Math.min(animatedValue / max, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;

  // Tip-dot at the END of the progress arc.
  // The SVG is rotated -90° via CSS, so a point at SVG (cx + r·cosθ, cy + r·sinθ)
  // visually appears at the position the arc reaches after sweeping θ clockwise from 12 o'clock.
  const dotR = strokeWidth * 0.7;
  const dotAngle = progress * 2 * Math.PI;
  const dotCx = center + radius * Math.cos(dotAngle);
  const dotCy = center + radius * Math.sin(dotAngle);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 overflow-visible"
      >
        <defs>
          <filter id={`blur-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <clipPath id={`inner-clip-${size}`}>
            <circle cx={center} cy={center} r={radius - strokeWidth / 2 - 0.5} />
          </clipPath>
        </defs>

        {/* Outer faint edge */}
        <circle
          cx={center}
          cy={center}
          r={radius + strokeWidth / 2}
          fill="none"
          stroke="rgba(0,0,0,0.04)"
          strokeWidth={1}
        />
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Inner faint edge */}
        <circle
          cx={center}
          cy={center}
          r={radius - strokeWidth / 2}
          fill="none"
          stroke="rgba(0,0,0,0.04)"
          strokeWidth={1}
        />

        {/* Inner-only green glow: blurred copy of the arc, clipped to the inner disc */}
        <g clipPath={`url(#inner-clip-${size})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth * 2}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            opacity={0.55}
            filter={`url(#blur-${size})`}
            style={{
              transition: "stroke-dashoffset 1100ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </g>

        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 1100ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        {showTipDot && progress > 0 ? (
          <circle
            cx={dotCx}
            cy={dotCy}
            r={dotR}
            fill={color}
            style={{
              transition:
                "cx 1100ms cubic-bezier(0.22, 1, 0.36, 1), cy 1100ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        ) : null}
      </svg>

      {/* Inset highlight to give the center area an embossed feel */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          top: strokeWidth + 4,
          left: strokeWidth + 4,
          right: strokeWidth + 4,
          bottom: strokeWidth + 4,
          boxShadow: "inset 0 1px 6px rgba(0,0,0,0.04)",
        }}
      />

      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
