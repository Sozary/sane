export type Gender = "male" | "female" | "other";

/**
 * Mifflin-St Jeor equation for BMR
 * Male: 10 × weight_kg + 6.25 × height_cm - 5 × age - 5
 * Female: 10 × weight_kg + 6.25 × height_cm - 5 × age - 161
 * Other: average of male and female
 */
export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  switch (gender) {
    case "male":
      return base - 5;
    case "female":
      return base - 161;
    case "other":
      return base - 83; // average of -5 and -161
  }
}

/** Light activity multiplier (1.375) */
export const ACTIVITY_MULTIPLIER = 1.375;

/** Calculate TDEE (Total Daily Energy Expenditure) */
export function calculateTDEE(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  return Math.round(calculateBMR(weightKg, heightCm, age, gender) * ACTIVITY_MULTIPLIER);
}

/** Calculate macro grams from calorie goal and percentages */
export function calculateMacroGrams(calorieGoal: number, carbsPct: number, proteinPct: number, fatPct: number) {
  return {
    carbsG: Math.round((calorieGoal * carbsPct / 100) / 4),
    proteinG: Math.round((calorieGoal * proteinPct / 100) / 4),
    fatG: Math.round((calorieGoal * fatPct / 100) / 9),
  };
}
