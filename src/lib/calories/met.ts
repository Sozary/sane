export const ACTIVITY_TYPES = [
  { key: "course", label: "Course", met: 9.8 },
  { key: "vélo", label: "Vélo", met: 7.5 },
  { key: "natation", label: "Natation", met: 8.0 },
  { key: "musculation", label: "Musculation", met: 6.0 },
  { key: "marche", label: "Marche", met: 3.8 },
  { key: "yoga", label: "Yoga", met: 3.0 },
] as const;

export function estimateCaloriesBurned(met: number, weightKg: number, durationMinutes: number): number {
  return Math.round(met * weightKg * (durationMinutes / 60));
}
