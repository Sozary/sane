"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CalorieRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  overflowColor?: string;
  trackColor?: string;
  className?: string;
  showTipDot?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export function CalorieRing({
  value,
  max,
  size = 200,
  strokeWidth = 6,
  color = "#A4B465",
  overflowColor = "#E8384F",
  trackColor = "rgba(0,0,0,0.05)",
  className,
  showTipDot = true,
  loading = false,
  children,
}: CalorieRingProps) {
  const radius = (size - strokeWidth) / 2;
  const overflowRadius = radius + strokeWidth + 4;
  const circumference = 2 * Math.PI * radius;
  const overflowCircumference = 2 * Math.PI * overflowRadius;
  const targetValue = Math.max(value, 0);
  const [animatedValue, setAnimatedValue] = useState(0);
  const previousValueRef = useRef(0);

  useEffect(() => {
    if (loading) {
      return;
    }

    const startValue = previousValueRef.current;
    const endValue = targetValue;
    const duration = 1100;
    const startAt = window.performance.now();
    let frameId = 0;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startAt;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const nextValue = startValue + (endValue - startValue) * eased;
      setAnimatedValue(nextValue);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      } else {
        previousValueRef.current = endValue;
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [loading, targetValue]);

  const normalProgress = max > 0 ? Math.min(animatedValue / max, 1) : 0;
  const overflowProgress = max > 0 ? Math.min(Math.max(animatedValue - max, 0) / max, 1) : 0;
  const strokeDashoffset = circumference * (1 - normalProgress);
  const overflowDashoffset = overflowCircumference * (1 - overflowProgress);
  const center = size / 2;

  // Tip-dot at the END of the progress arc.
  const dotR = strokeWidth * 0.7;
  const dotAngle = normalProgress * 2 * Math.PI;
  const dotCx = center + radius * Math.cos(dotAngle);
  const dotCy = center + radius * Math.sin(dotAngle);
  const overflowDotAngle = overflowProgress * 2 * Math.PI;
  const overflowDotCx = center + overflowRadius * Math.cos(overflowDotAngle);
  const overflowDotCy = center + overflowRadius * Math.sin(overflowDotAngle);

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
        />
        {overflowProgress > 0 ? (
          <>
            <circle
              cx={center}
              cy={center}
              r={overflowRadius}
              fill="none"
              stroke="rgba(232,56,79,0.12)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={center}
              cy={center}
              r={overflowRadius}
              fill="none"
              stroke={overflowColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={overflowCircumference}
              strokeDashoffset={overflowDashoffset}
            />
            {showTipDot ? (
              <circle
                cx={overflowDotCx}
                cy={overflowDotCy}
                r={dotR}
                fill={overflowColor}
              />
            ) : null}
          </>
        ) : null}
        {showTipDot ? (
          <circle
            cx={dotCx}
            cy={dotCy}
            r={dotR}
            fill={color}
            style={{
              opacity: normalProgress > 0 ? 1 : 0,
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
