import { z } from "zod/v4";

export const dailyLogQuerySchema = z.object({
  date: z.string().date(),
});

export const updateDailyLogSchema = z.object({
  date: z.string().date(),
  caloriesBurned: z.number().min(0).optional(),
  steps: z.number().int().min(0).optional(),
  waterMl: z.number().int().min(0).optional(),
});
