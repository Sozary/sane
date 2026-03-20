import { z } from "zod/v4";

export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const createMealSchema = z.object({
  date: z.string().date(),
  mealType: mealTypeSchema,
  name: z.string().min(1).max(500),
  calories: z.number().min(0),
  carbsG: z.number().min(0),
  proteinG: z.number().min(0),
  fatG: z.number().min(0),
  weightG: z.number().min(0).optional(),
  score: z.number().int().min(0).max(100).optional(),
  imageUrl: z.string().url().optional(),
});

export const updateMealSchema = createMealSchema.partial();

export const mealQuerySchema = z.object({
  date: z.string().date(),
});
