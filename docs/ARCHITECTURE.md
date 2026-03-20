# Architecture - Sane App

## System Overview

Sane is a mobile-first Progressive Web App (PWA) for calorie and macro tracking with AI-powered meal photo recognition. The system follows a monolithic Next.js architecture with clear separation between client, server, database, AI, and storage layers.

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│  Next.js App Router  ·  React 19  ·  Tailwind/shadcn   │
│  PWA (manifest.json + service worker)                    │
└──────────────────────┬──────────────────────────────────┘
                       │ Server Actions / API Routes
┌──────────────────────▼──────────────────────────────────┐
│                     SERVER (Next.js)                      │
│  Server Actions  ·  API Routes  ·  NextAuth.js v5        │
│  Zod Validation  ·  Drizzle ORM                          │
└───┬──────────┬───────────┬──────────────────────────────┘
    │          │           │
    ▼          ▼           ▼
┌────────┐ ┌────────┐ ┌────────────┐
│ Neon   │ │ Claude │ │ Cloudflare │
│ Postgres│ │ Vision │ │ R2         │
│ (DB)   │ │ (AI)   │ │ (Storage)  │
└────────┘ └────────┘ └────────────┘
```

## Layer Details

### 1. Client Layer

- **Framework**: Next.js 15 App Router with React 19
- **Rendering**: Server Components by default, Client Components only when interactivity is needed (sliders, camera, navigation state)
- **Styling**: Tailwind CSS v4 with shadcn/ui component library
- **PWA**: `manifest.json` in `/public`, service worker for offline capability
- **Target**: Mobile-first (375px primary breakpoint), responsive up to desktop

### 2. Server Layer

- **Server Actions**: Primary mechanism for mutations (create meal, update profile, update daily log). Defined in `src/lib/actions/`.
- **API Routes**: Used for operations that need streaming, file uploads, or complex request/response handling. Defined in `src/app/api/`.
- **Authentication**: NextAuth.js v5 with credentials provider (email + password). Session checked on every Server Action and API route.
- **Validation**: Zod schemas validate all incoming data at the server boundary. Schemas defined in `src/lib/validations/`.

### 3. Database Layer

- **Provider**: Neon serverless PostgreSQL
- **ORM**: Drizzle ORM with `@neondatabase/serverless` driver
- **Schema**: Defined in `src/lib/db/schema.ts`
- **Tables**: `users`, `meals`, `daily_logs`
- **Key design decision**: `daily_logs` stores only burned calories, steps, and water. Consumed calories and macros are always aggregated from the `meals` table at query time. This prevents data inconsistency between meal records and daily totals.

### 4. AI Layer

- **Provider**: Anthropic Claude API (Vision capability)
- **SDK**: `@anthropic-ai/sdk`
- **Flow**: User uploads meal photo -> image sent to Claude Vision -> structured JSON response with nutrition data
- **Output**: meal name, calories, carbs_g, protein_g, fat_g, weight_g, score (0-100), meal_items array
- **Integration**: `src/lib/ai/` for prompt construction and response parsing, `src/app/api/meals/analyze/` for the API endpoint

### 5. Storage Layer

- **Provider**: Cloudflare R2 (S3-compatible)
- **Usage**: Meal photo storage
- **Flow**: Client uploads image -> Server validates and streams to R2 -> R2 URL saved in `meals.image_url`
- **Access**: Public read URLs for displaying photos, authenticated write via server-side SDK

### 6. Auth Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  Login   │────>│ NextAuth.js  │────>│ Verify   │
│  Form    │     │ credentials  │     │ bcrypt   │
└──────────┘     │ provider     │     │ hash     │
                 └──────┬───────┘     └────┬─────┘
                        │                  │
                        ▼                  ▼
                 ┌──────────────┐   ┌──────────┐
                 │ JWT Session  │   │ DB users │
                 │ (httpOnly    │   │ table    │
                 │  cookie)     │   └──────────┘
                 └──────────────┘
```

1. User submits email + password via login form
2. NextAuth.js credentials provider receives the request
3. Server looks up user by email, verifies password with bcrypt
4. On success, JWT session token is set as httpOnly cookie
5. Subsequent requests include the session cookie automatically
6. Server Actions and API routes call `auth()` to validate the session

## Data Flow Diagrams

### Meal Photo Analysis Flow

```
User takes photo
       │
       ▼
Upload image to Cloudflare R2
       │
       ▼
Send image URL to POST /api/meals/analyze
       │
       ▼
Server fetches image, sends to Claude Vision API
       │
       ▼
Claude Vision returns structured JSON:
  { name, calories, carbs_g, protein_g, fat_g, weight_g, score, meal_items }
       │
       ▼
Server validates response with Zod
       │
       ▼
Return nutrition data to client
       │
       ▼
User reviews & confirms (can edit values)
       │
       ▼
POST /api/meals → Save meal to database
       │
       ▼
Dashboard updated (daily totals recomputed from meals)
```

### Daily Summary Computation Flow

```
GET /api/daily-log?date=2025-03-19
       │
       ▼
Fetch daily_logs row for (user_id, date)
  → calories_burned, steps, water_ml
       │
       ▼
Aggregate meals for (user_id, date)
  → SUM(calories), SUM(carbs_g), SUM(protein_g), SUM(fat_g)
       │
       ▼
Fetch user profile
  → calorie_goal, macro_carbs_pct, macro_protein_pct, macro_fat_pct
       │
       ▼
Compute remaining:
  calories_remaining = calorie_goal - consumed + burned
  macro_remaining = goal_grams - consumed_grams
       │
       ▼
Return combined response to client
```

### Onboarding Flow

```
New user signs up
       │
       ▼
Step 1: Weight Input
  "Quel est votre poids ?"
  Slider: kg/lb toggle
       │
       ▼
Step 2: Height Input
  "Quelle est votre taille ?"
  Slider: cm/pieds toggle
       │
       ▼
Step 3: BMR Result
  Calculate BMR using Mifflin-St Jeor equation
  Display calculated kcal/jour on circular gauge
       │
       ▼
Step 4: Calorie & Macro Goals
  Editable calorie goal (pre-filled with BMR result)
  Macro sliders: Glucides / Proteines / Lipides (% that must sum to 100)
       │
       ▼
Save profile → onboarding_done = true
       │
       ▼
Redirect to Dashboard
```

## Key Architectural Decisions

### 1. Consumed Calories Aggregated, Not Stored

The `daily_logs` table intentionally does NOT store consumed calories or macros. These values are always computed by aggregating the `meals` table for the given user and date. This ensures:
- No data inconsistency when meals are added, edited, or deleted
- Single source of truth (meals table)
- No need for background sync jobs

### 2. Server Actions over API Routes

Server Actions are preferred for most mutations because they:
- Eliminate client-side fetch boilerplate
- Provide automatic revalidation
- Are type-safe end-to-end
- Work with progressive enhancement

API routes are used only when:
- File uploads are involved (meal photo upload)
- Complex streaming responses are needed (AI analysis)
- External services need to call back (webhooks)

### 3. Mobile-First PWA

The app is designed as a PWA rather than a native app to:
- Enable single codebase for all platforms
- Allow instant deployment without app store review
- Support "Add to Home Screen" for native-like experience
- Reduce development complexity

### 4. French-First UI

All user-facing strings are in French. This is hardcoded, not i18n. If multi-language support is needed later, extract strings into a messages file. Code (variables, function names, comments) remains in English.

### 5. Neon Serverless PostgreSQL

Chosen for:
- Serverless scaling (pay per query, no idle costs)
- Native WebSocket support (works in edge runtimes)
- Branching for development/staging environments
- Compatible with standard PostgreSQL and Drizzle ORM
