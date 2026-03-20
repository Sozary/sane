# Data Models - Sane App

Complete database schema documentation for the Sane app. The database is PostgreSQL (Neon serverless) accessed via Drizzle ORM.

## Entity Relationship Diagram

```
┌──────────────────────┐
│        users         │
├──────────────────────┤
│ id (PK, uuid)        │
│ email (unique)       │
│ name                 │
│ password_hash        │
│ height_cm            │
│ weight_kg            │
│ age                  │
│ gender               │
│ calorie_goal         │
│ macro_carbs_pct      │
│ macro_protein_pct    │
│ macro_fat_pct        │
│ onboarding_done      │
│ created_at           │
│ updated_at           │
└──────────┬───────────┘
           │
           │ 1:N
           ▼
┌──────────────────────┐      ┌──────────────────────┐
│        meals         │      │     daily_logs        │
├──────────────────────┤      ├──────────────────────┤
│ id (PK, uuid)        │      │ id (PK, uuid)        │
│ user_id (FK)  ───────┤      │ user_id (FK)  ───────┤
│ date                 │      │ date                 │
│ meal_type            │      │ calories_burned      │
│ name                 │      │ steps                │
│ calories             │      │ water_ml             │
│ carbs_g              │      │ UNIQUE(user_id,date) │
│ protein_g            │      │ created_at           │
│ fat_g                │      │ updated_at           │
│ weight_g             │      └──────────────────────┘
│ score                │
│ image_url            │
│ is_favorite          │
│ created_at           │
│ updated_at           │
└──────────────────────┘
```

## Enums

### gender_enum

```sql
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
```

Drizzle definition:
```typescript
export const genderEnum = pgEnum('gender_enum', ['male', 'female', 'other']);
```

### meal_type_enum

```sql
CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
```

Drizzle definition:
```typescript
export const mealTypeEnum = pgEnum('meal_type_enum', ['breakfast', 'lunch', 'dinner', 'snack']);
```

---

## Table: `users`

Stores user accounts, physical attributes, and nutrition goals.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | `uuid` | PRIMARY KEY | `gen_random_uuid()` | Unique user identifier |
| `email` | `varchar(255)` | UNIQUE, NOT NULL | - | User email address (login) |
| `name` | `varchar(255)` | - | `NULL` | Display name |
| `password_hash` | `varchar(255)` | NOT NULL | - | bcrypt hashed password |
| `height_cm` | `real` | - | `NULL` | Height in centimeters |
| `weight_kg` | `real` | - | `NULL` | Weight in kilograms |
| `age` | `integer` | - | `NULL` | Age in years |
| `gender` | `gender_enum` | - | `NULL` | Gender for BMR calculation |
| `calorie_goal` | `integer` | - | `2000` | Daily calorie target (kcal) |
| `macro_carbs_pct` | `integer` | - | `40` | Carbohydrate target (% of calories) |
| `macro_protein_pct` | `integer` | - | `30` | Protein target (% of calories) |
| `macro_fat_pct` | `integer` | - | `30` | Fat target (% of calories) |
| `onboarding_done` | `boolean` | - | `false` | Whether user completed onboarding |
| `created_at` | `timestamp` | NOT NULL | `now()` | Account creation time (UTC) |
| `updated_at` | `timestamp` | NOT NULL | `now()` | Last profile update time (UTC) |

**Drizzle Schema**:

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  heightCm: real('height_cm'),
  weightKg: real('weight_kg'),
  age: integer('age'),
  gender: genderEnum('gender'),
  calorieGoal: integer('calorie_goal').default(2000),
  macrosCarbsPct: integer('macro_carbs_pct').default(40),
  macrosProteinPct: integer('macro_protein_pct').default(30),
  macrosFatPct: integer('macro_fat_pct').default(30),
  onboardingDone: boolean('onboarding_done').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Indexes**:
- `users_email_idx` on `email` (implicit from UNIQUE constraint)

**Notes**:
- `macro_carbs_pct + macro_protein_pct + macro_fat_pct` should always equal 100. Enforce in application logic (Zod validation).
- `height_cm` and `weight_kg` are stored in metric. Unit conversion (lb, feet) is a display-only concern.
- `password_hash` uses bcrypt via the `bcryptjs` library.

---

## Table: `meals`

Stores individual meal entries with nutritional data and optional photo.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | `uuid` | PRIMARY KEY | `gen_random_uuid()` | Unique meal identifier |
| `user_id` | `uuid` | FK -> users.id, ON DELETE CASCADE, NOT NULL | - | Owner of the meal |
| `date` | `date` | NOT NULL | - | Date of the meal (UTC, YYYY-MM-DD) |
| `meal_type` | `meal_type_enum` | NOT NULL | - | Type: breakfast, lunch, dinner, snack |
| `name` | `varchar(255)` | NOT NULL | - | Meal name (e.g., "Poulet grille avec riz") |
| `calories` | `real` | NOT NULL | - | Total calories (kcal) |
| `carbs_g` | `real` | NOT NULL | - | Carbohydrates in grams |
| `protein_g` | `real` | NOT NULL | - | Protein in grams |
| `fat_g` | `real` | NOT NULL | - | Fat in grams |
| `weight_g` | `real` | - | `NULL` | Estimated total weight in grams |
| `score` | `integer` | - | `NULL` | Nutritional score 0-100 |
| `image_url` | `varchar(512)` | - | `NULL` | Cloudflare R2 URL of meal photo |
| `is_favorite` | `boolean` | - | `false` | Whether user marked as favorite |
| `created_at` | `timestamp` | NOT NULL | `now()` | Creation time (UTC) |
| `updated_at` | `timestamp` | NOT NULL | `now()` | Last update time (UTC) |

**Drizzle Schema**:

```typescript
export const meals = pgTable('meals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  mealType: mealTypeEnum('meal_type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  calories: real('calories').notNull(),
  carbsG: real('carbs_g').notNull(),
  proteinG: real('protein_g').notNull(),
  fatG: real('fat_g').notNull(),
  weightG: real('weight_g'),
  score: integer('score'),
  imageUrl: varchar('image_url', { length: 512 }),
  isFavorite: boolean('is_favorite').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Indexes**:
- `meals_user_date_idx` on `(user_id, date)` - Primary query pattern: get all meals for a user on a given date
- `meals_user_favorite_idx` on `(user_id, is_favorite)` WHERE `is_favorite = true` - For favorite meals listing

**Notes**:
- `calories`, `carbs_g`, `protein_g`, `fat_g` are `real` (float), not integer. Nutrition values can be decimals.
- `score` is 0-100, computed by the AI agent based on macro balance, calorie density, and nutritional quality.
- `image_url` is nullable because meals can be logged manually without a photo.
- `date` is stored as `date` type (no time component). The time is captured in `created_at`.
- ON DELETE CASCADE ensures meals are deleted when a user is deleted.

---

## Table: `daily_logs`

Stores daily activity data (burned calories, steps, water). **Consumed calories and macros are NOT stored here** - they are computed by aggregating the `meals` table.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | `uuid` | PRIMARY KEY | `gen_random_uuid()` | Unique log identifier |
| `user_id` | `uuid` | FK -> users.id, ON DELETE CASCADE, NOT NULL | - | Owner of the log |
| `date` | `date` | NOT NULL | - | Date of the log (UTC, YYYY-MM-DD) |
| `calories_burned` | `real` | - | `0` | Calories burned through activity |
| `steps` | `integer` | - | `0` | Step count |
| `water_ml` | `integer` | - | `0` | Water intake in milliliters |
| `created_at` | `timestamp` | NOT NULL | `now()` | Creation time (UTC) |
| `updated_at` | `timestamp` | NOT NULL | `now()` | Last update time (UTC) |

**Constraints**:
- `UNIQUE(user_id, date)` - Only one daily log per user per day

**Drizzle Schema**:

```typescript
export const dailyLogs = pgTable('daily_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  caloriesBurned: real('calories_burned').default(0),
  steps: integer('steps').default(0),
  waterMl: integer('water_ml').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userDateUnique: unique().on(table.userId, table.date),
}));
```

**Indexes**:
- `daily_logs_user_date_idx` on `(user_id, date)` - Implicit from UNIQUE constraint. Primary query pattern.

**Critical Design Note**:
> Consumed calories and macros are **NEVER** stored in `daily_logs`. They are always computed by running:
> ```sql
> SELECT
>   COALESCE(SUM(calories), 0) as total_calories,
>   COALESCE(SUM(carbs_g), 0) as total_carbs,
>   COALESCE(SUM(protein_g), 0) as total_protein,
>   COALESCE(SUM(fat_g), 0) as total_fat
> FROM meals
> WHERE user_id = $1 AND date = $2;
> ```
> This ensures consumed totals are always consistent with the actual meal records.

---

## Relationships

| From | To | Type | FK Column | On Delete |
|------|----|------|-----------|-----------|
| `meals` | `users` | Many-to-One | `meals.user_id` | CASCADE |
| `daily_logs` | `users` | Many-to-One | `daily_logs.user_id` | CASCADE |

**Drizzle Relations** (for query builder):

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  meals: many(meals),
  dailyLogs: many(dailyLogs),
}));

export const mealsRelations = relations(meals, ({ one }) => ({
  user: one(users, { fields: [meals.userId], references: [users.id] }),
}));

export const dailyLogsRelations = relations(dailyLogs, ({ one }) => ({
  user: one(users, { fields: [dailyLogs.userId], references: [users.id] }),
}));
```

---

## Computed Values

These values are NOT stored in the database but computed at query time or in application logic:

| Value | Formula | Source |
|-------|---------|--------|
| `consumed_calories` | `SUM(meals.calories) WHERE date = X` | Aggregated from meals |
| `consumed_carbs_g` | `SUM(meals.carbs_g) WHERE date = X` | Aggregated from meals |
| `consumed_protein_g` | `SUM(meals.protein_g) WHERE date = X` | Aggregated from meals |
| `consumed_fat_g` | `SUM(meals.fat_g) WHERE date = X` | Aggregated from meals |
| `calories_remaining` | `calorie_goal - consumed + burned` | Computed in API |
| `carbs_goal_g` | `(calorie_goal * macro_carbs_pct / 100) / 4` | 4 cal per gram of carbs |
| `protein_goal_g` | `(calorie_goal * macro_protein_pct / 100) / 4` | 4 cal per gram of protein |
| `fat_goal_g` | `(calorie_goal * macro_fat_pct / 100) / 9` | 9 cal per gram of fat |
| `bmr` | Mifflin-St Jeor equation | See BMR section |

### BMR Calculation (Mifflin-St Jeor)

```
Male:   BMR = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
Female: BMR = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
Other:  BMR = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 78  (average of male/female)
```

---

## Migration Strategy

- Use `pnpm db:push` for development (pushes schema directly to Neon)
- Use `pnpm db:generate` to create migration files for production
- Schema changes must be backwards-compatible or include a migration plan
- Always test schema changes on a Neon branch before pushing to production
