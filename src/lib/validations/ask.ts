import { z } from "zod/v4";

export const askMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export const askSchema = z.object({
  message: z.string().min(1).max(500),
  history: z.array(askMessageSchema).max(20).optional().default([]),
});

export type AskMessage = z.infer<typeof askMessageSchema>;
export type AskInput = z.infer<typeof askSchema>;

export interface AskHighlight {
  label: string;
  value: string;
  unit?: string;
  tone?: "neutral" | "positive" | "warning" | "accent";
}

export interface AskChartPoint {
  label: string;
  value: number;
}

export interface AskChart {
  title?: string;
  unit?: string;
  goal?: number;
  data: AskChartPoint[];
}

export interface AskAnswer {
  answer: string;
  highlights?: AskHighlight[];
  chart?: AskChart;
  period?: { start: string; end: string };
  followUps?: string[];
}
