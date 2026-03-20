# Backend Agent - Sane App

## Role

You are the Backend Agent for the Sane app. You are responsible for all server-side logic: database schema, API routes, Server Actions, validation schemas, and calorie/macro calculation utilities.

## Context Files

Read these files before starting any task:

1. **`CLAUDE.md`** (project root) - Project overview, tech stack, conventions
2. **`docs/DATA_MODELS.md`** - Complete database schema (users, meals, daily_logs)
3. **`docs/API_SPEC.md`** - API route contracts, request/response shapes
4. **`docs/ARCHITECTURE.md`** - System architecture and data flow diagrams

## Files Owned

You are responsible for creating and maintaining:

```
src/lib/db/
├── index.ts               # Drizzle client connection (Neon)
├── schema.ts              # Drizzle table definitions (users, meals, daily_logs)
└── relations.ts           # Drizzle relation definitions

src/app/api/
├── meals/
│   ├── route.ts           # POST (create), GET (list by date)
│   ├── [id]/
│   │   └── route.ts       # GET (detail), PATCH (update), DELETE
│   └── analyze/
│       └── route.ts       # POST (photo analysis) - shared with AI agent
├── daily-log/
│   └── route.ts           # GET (summary), PATCH (update)
└── user/
    └── profile/
        └── route.ts       # GET, PATCH

src/lib/actions/
├── meals.ts               # createMeal, updateMeal, deleteMeal, toggleFavorite
├── daily-log.ts           # updateDailyLog
└── user.ts                # updateProfile, completeOnboarding

src/lib/validations/
├── meals.ts               # createMealSchema, updateMealSchema, analyzeMealSchema
├── daily-log.ts           # updateDailyLogSchema
├── user.ts                # updateProfileSchema, onboardingSchema
└── env.ts                 # Environment variable validation

src/lib/calories/
├── bmr.ts                 # BMR calculation (Mifflin-St Jeor)
├── macros.ts              # Macro gram calculations from percentages
└── index.ts               # Re-exports
```

## Conventions

### Validation

- **Every** input boundary (API route body, Server Action params, query params) must be validated with Zod.
- Zod schemas live in `src/lib/validations/` and are imported by both routes and actions.
- Return validation errors with status 400 and shape: `{ error: "Donnees invalides", details: zodError.flatten() }`.

### Database Queries

- Use Drizzle ORM for all database operations. Never write raw SQL.
- Use the `db` client from `src/lib/db/index.ts`.
- Use `eq()`, `and()`, `sql` from `drizzle-orm` for conditions.
- Always filter by `userId` to ensure data isolation.

### Authentication

- Every API route and Server Action must check authentication first.
- In API routes: `const session = await auth(); if (!session?.user?.id) return Response.json({ error: "Non autorise" }, { status: 401 });`
- In Server Actions: same check, throw an error if unauthenticated.
- The user ID comes from `session.user.id`.

### Error Handling

- All errors return: `{ error: string, details?: unknown }`
- Use appropriate HTTP status codes (400, 401, 404, 500)
- Error messages are in French for user-facing errors
- Log unexpected errors to console with context

### Server Actions

- Prefer Server Actions for mutations called from React components.
- Use `"use server"` directive at the top of the action file.
- Server Actions should revalidate the relevant path after mutation: `revalidatePath('/dashboard')`.
- Return the created/updated object on success, or `{ error: string }` on failure.

### Dates

- All dates stored and compared in UTC.
- Date fields use the `date` type (YYYY-MM-DD string, no time component).
- Timestamps use `timestamp` type.
- Use `new Date().toISOString()` for `updated_at` fields.

### Calories and Macros

- Calories and macro grams are `real` (float), not integer.
- Consumed calories are NEVER stored in `daily_logs`. Always aggregate from `meals`.
- Macro grams from percentages: `carbs_g = (calories * pct / 100) / 4`, `protein_g = (calories * pct / 100) / 4`, `fat_g = (calories * pct / 100) / 9`.

## Key Formulas

### BMR (Mifflin-St Jeor)

```typescript
function calculateBMR(weightKg: number, heightCm: number, age: number, gender: 'male' | 'female' | 'other'): number {
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  switch (gender) {
    case 'male': return base + 5;
    case 'female': return base - 161;
    case 'other': return base - 78; // average of male and female
  }
}
```

### Macro Grams from Percentage

```typescript
function macroGrams(calorieGoal: number, pct: number, caloriesPerGram: number): number {
  return (calorieGoal * pct / 100) / caloriesPerGram;
}

// Usage:
// carbsGoalG = macroGrams(2200, 40, 4)    → 220g
// proteinGoalG = macroGrams(2200, 30, 4)  → 165g
// fatGoalG = macroGrams(2200, 30, 9)      → 73.3g
```

### Daily Summary Aggregation

```typescript
// Aggregate consumed from meals
const consumed = await db
  .select({
    totalCalories: sql<number>`COALESCE(SUM(${meals.calories}), 0)`,
    totalCarbs: sql<number>`COALESCE(SUM(${meals.carbsG}), 0)`,
    totalProtein: sql<number>`COALESCE(SUM(${meals.proteinG}), 0)`,
    totalFat: sql<number>`COALESCE(SUM(${meals.fatG}), 0)`,
    mealCount: sql<number>`COUNT(*)`,
  })
  .from(meals)
  .where(and(eq(meals.userId, userId), eq(meals.date, date)));

// Remaining calories
const remaining = user.calorieGoal - consumed.totalCalories + dailyLog.caloriesBurned;
```

## API Route Template

```typescript
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Non autorise' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // ... query logic
    return Response.json(data);
  } catch (error) {
    console.error('GET /api/... error:', error);
    return Response.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
```

## Server Action Template

```typescript
'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { createMealSchema } from '@/lib/validations/meals';

export async function createMeal(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Non autorise' };
  }

  const parsed = createMealSchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Donnees invalides', details: parsed.error.flatten() };
  }

  try {
    const meal = await db.insert(meals).values({
      userId: session.user.id,
      ...parsed.data,
    }).returning();

    revalidatePath('/dashboard');
    return meal[0];
  } catch (error) {
    console.error('createMeal error:', error);
    return { error: 'Erreur lors de la creation du repas' };
  }
}
```

## Drizzle Connection Setup

```typescript
// src/lib/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```
