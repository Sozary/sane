import { pgTable, uuid, varchar, real, integer, boolean, timestamp, date, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";

// Enums
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const mealTypeEnum = pgEnum("meal_type", ["breakfast", "lunch", "dinner", "snack"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  heightCm: real("height_cm"),
  weightKg: real("weight_kg"),
  age: integer("age"),
  gender: genderEnum("gender"),
  calorieGoal: integer("calorie_goal").default(2000),
  macroCarbsPct: integer("macro_carbs_pct").default(40),
  macroProteinPct: integer("macro_protein_pct").default(30),
  macroFatPct: integer("macro_fat_pct").default(30),
  onboardingDone: boolean("onboarding_done").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Meals table
export const meals = pgTable("meals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  mealType: mealTypeEnum("meal_type").notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  calories: real("calories").notNull(),
  carbsG: real("carbs_g").notNull(),
  proteinG: real("protein_g").notNull(),
  fatG: real("fat_g").notNull(),
  weightG: real("weight_g"),
  score: integer("score"),
  imageUrl: varchar("image_url", { length: 1000 }),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Activities table
export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  activityType: varchar("activity_type", { length: 100 }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  caloriesBurned: real("calories_burned").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Daily logs table
export const dailyLogs = pgTable("daily_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  caloriesBurned: real("calories_burned").default(0),
  steps: integer("steps").default(0),
  waterMl: integer("water_ml").default(0),
}, (table) => [
  uniqueIndex("daily_logs_user_date_idx").on(table.userId, table.date),
]);
