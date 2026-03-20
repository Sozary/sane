import { z } from "zod/v4";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(255).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  heightCm: z.number().min(50).max(300).optional(),
  weightKg: z.number().min(20).max(500).optional(),
  age: z.number().int().min(10).max(150).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  calorieGoal: z.number().int().min(500).max(10000).optional(),
  macroCarbsPct: z.number().int().min(0).max(100).optional(),
  macroProteinPct: z.number().int().min(0).max(100).optional(),
  macroFatPct: z.number().int().min(0).max(100).optional(),
  onboardingDone: z.boolean().optional(),
});
