export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type Gender = "male" | "female" | "other";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  gender: Gender | null;
  calorieGoal: number;
  macroCarbsPct: number;
  macroProteinPct: number;
  macroFatPct: number;
  onboardingDone: boolean;
}

export interface Meal {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  name: string;
  calories: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  weightG: number | null;
  score: number | null;
  imageUrl: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  date: string;
  activityType: string;
  durationMinutes: number;
  caloriesBurned: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLog {
  date: string;
  caloriesConsumed: number;
  caloriesBurned: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  steps: number;
  waterMl: number;
  meals: Meal[];
}

export interface MealAnalysis {
  name: string;
  calories: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  weightG: number | null;
  score: number;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}
