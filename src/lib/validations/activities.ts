import { z } from "zod/v4";

export const createActivitySchema = z.object({
  date: z.string().date(),
  activityType: z.string().min(1).max(100),
  durationMinutes: z.number().int().min(1),
  caloriesBurned: z.number().min(0),
});

export const updateActivitySchema = createActivitySchema.partial();
