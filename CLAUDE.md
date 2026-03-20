# Sane - Calorie & Macro Tracker with AI Meal Photo Recognition

> **Brand name is "Sane", NOT "Welmi".** Always use "Sane" in code, UI, and documentation.

## Overview

Sane is a mobile-first calorie and macro tracking app. Users photograph their meals, and Claude Vision AI analyzes the photo to estimate calories, macros, and a nutritional score. The app is designed primarily for French-speaking users.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Neon serverless) |
| ORM | Drizzle ORM |
| AI | Anthropic Claude API (Vision) |
| Auth | NextAuth.js v5 (credentials provider) |
| Storage | Cloudflare R2 (meal photos) |
| Validation | Zod |
| Package Manager | pnpm |

## Project Structure

```
saneapp/
├── CLAUDE.md                  # This file - root context for all agents
├── docs/
│   ├── ARCHITECTURE.md        # System architecture
│   ├── AGENTS.md              # Agent definitions
│   ├── DATA_MODELS.md         # Database schema
│   ├── API_SPEC.md            # API specification
│   ├── UI_SPEC.md             # Screen-by-screen UI spec
│   ├── AI_PROMPTS.md          # Claude Vision prompts
│   └── agents/
│       ├── BACKEND.md         # Backend agent context
│       ├── FRONTEND.md        # Frontend agent context
│       ├── AI.md              # AI agent context
│       └── INFRA.md           # Infrastructure agent context
├── src/
│   ├── app/
│   │   ├── (onboarding)/      # Onboarding flow pages
│   │   ├── (app)/             # Main app pages (dashboard, meals, etc.)
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles & design tokens
│   │   └── page.tsx           # Landing / redirect
│   ├── components/
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   └── lib/
│       ├── db/                # Drizzle schema & connection
│       ├── actions/           # Server Actions
│       ├── validations/       # Zod schemas
│       ├── calories/          # Calorie & macro calculation utilities
│       ├── ai/                # Claude Vision integration
│       └── utils.ts           # General utilities
├── public/
│   └── manifest.json          # PWA manifest
├── drizzle.config.ts
├── next.config.ts
├── package.json
└── .env.example
```

## Key Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm db:push      # Push schema changes to database
pnpm db:generate  # Generate Drizzle migrations
pnpm db:studio    # Open Drizzle Studio (DB GUI)
```

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Accent | `#E8384F` | Primary buttons, active states, brand color |
| Background | `#FFFFFF` | Page backgrounds |
| Text | `#1A1A1A` | Primary text |
| Muted | `#6B7280` | Secondary text, placeholders |
| Carbs (Glucides) | `#3B82F6` (blue) | Carbohydrate indicators |
| Protein (Proteines) | `#EF4444` (red) | Protein indicators |
| Fat (Lipides) | `#F59E0B` (amber) | Fat indicators |
| Border radius | `12px` | Cards, buttons, inputs |

## Conventions

1. **Server Actions first** - Use Next.js Server Actions for mutations where possible. API routes only when Server Actions are insufficient (e.g., file uploads, complex streaming).
2. **Zod everywhere** - Validate ALL inputs (form data, API payloads, env vars) with Zod schemas.
3. **Dates in UTC** - All dates stored and compared in UTC. Display conversion happens client-side.
4. **Calories are real numbers** - Use `real` type in DB, not `integer`. Calories and macro grams can be decimals (e.g., 245.5 kcal).
5. **French UI** - All user-facing labels are in French. Code (variables, comments) stays in English.
6. **Mobile-first** - Design for 375px width first, then scale up. This is primarily a phone app.
7. **Consumed calories are aggregated** - The `daily_logs` table stores only burned calories, steps, and water. Consumed calories/macros are always computed by summing the `meals` table for that date.
8. **Auth on every route** - Every API route and Server Action must check authentication. No public data endpoints.
9. **Consistent error shape** - All API errors return `{ error: string, details?: unknown }` with appropriate HTTP status codes.
10. **Use Drizzle ORM** - Never write raw SQL. Use Drizzle query builder for all database operations.

## Environment Variables

See `.env.example` for the full list. Key variables:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `AUTH_SECRET` - NextAuth.js secret
- `ANTHROPIC_API_KEY` - Claude API key
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` - Cloudflare R2 credentials

## Agent Documentation

Each agent has a dedicated context file in `docs/agents/`. See `docs/AGENTS.md` for the full agent map.
