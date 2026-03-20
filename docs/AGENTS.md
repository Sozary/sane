# Agent Definitions - Sane App

This document defines the 4 specialized agents that work on the Sane codebase. Each agent has a dedicated context file in `docs/agents/` with detailed instructions.

## Agent Overview

| Agent | Role | Context File |
|-------|------|-------------|
| Backend | DB schema, API routes, Server Actions, validations, calculations | `docs/agents/BACKEND.md` |
| Frontend | Pages, UI components, hooks, styling, navigation, PWA | `docs/agents/FRONTEND.md` |
| AI | Claude Vision API, prompts, photo analysis, nutrition scoring | `docs/agents/AI.md` |
| Infrastructure | Scaffolding, config, env vars, deployment, PWA setup | `docs/agents/INFRA.md` |

---

## 1. Backend Agent

**Role**: Backend development for the Sane app.

**Scope**: Database schema design, API route implementation, Server Actions, Zod validation schemas, calorie and macro calculation logic.

**Files Owned**:
- `src/lib/db/` - Drizzle schema, connection, queries
- `src/app/api/` - API route handlers
- `src/lib/actions/` - Server Actions
- `src/lib/validations/` - Zod schemas
- `src/lib/calories/` - BMR, TDEE, macro calculations

**Context Files to Read**:
1. `CLAUDE.md` - Project overview and conventions
2. `docs/DATA_MODELS.md` - Complete database schema
3. `docs/API_SPEC.md` - API contracts and response shapes
4. `docs/ARCHITECTURE.md` - System architecture and data flows

**Key Responsibilities**:
- Implement and maintain the Drizzle ORM schema matching `DATA_MODELS.md`
- Build API routes matching the contracts in `API_SPEC.md`
- Create Server Actions for all mutations
- Write Zod schemas for every input boundary
- Implement BMR (Mifflin-St Jeor) and macro calculations
- Ensure auth checks on every route and action
- Return consistent error shapes: `{ error: string, details?: unknown }`

---

## 2. Frontend Agent

**Role**: Frontend development for the Sane app.

**Scope**: Page components, UI components, custom hooks, styling, navigation, PWA features.

**Files Owned**:
- `src/app/(onboarding)/` - Onboarding flow pages (weight, height, result, goals)
- `src/app/(app)/` - Main app pages (dashboard, meals, scan, profile)
- `src/components/` - Shared UI components (shadcn/ui and custom)
- `src/hooks/` - Custom React hooks

**Context Files to Read**:
1. `CLAUDE.md` - Project overview and conventions
2. `docs/UI_SPEC.md` - Screen-by-screen UI specification
3. `docs/API_SPEC.md` - API contracts for data fetching
4. `docs/ARCHITECTURE.md` - System architecture

**Key Responsibilities**:
- Build all screens as specified in `UI_SPEC.md`
- Use shadcn/ui components as the base, customize with design tokens
- Implement mobile-first responsive layouts (375px primary)
- All UI labels in French
- Use Server Components by default, Client Components only for interactivity
- Implement the circular progress ring, macro bars, and other custom visualizations
- Handle camera access for meal photo capture
- Build the onboarding flow with slider inputs and smooth transitions

---

## 3. AI Agent

**Role**: AI integration for the Sane app.

**Scope**: Claude Vision API integration, prompt engineering, photo analysis pipeline, nutrition scoring algorithm.

**Files Owned**:
- `src/lib/ai/` - Claude API client, prompt templates, response parsing
- `src/app/api/meals/analyze/` - Meal analysis API endpoint

**Context Files to Read**:
1. `CLAUDE.md` - Project overview and conventions
2. `docs/AI_PROMPTS.md` - Prompt templates and expected outputs
3. `docs/API_SPEC.md` - API contract for the analyze endpoint
4. `docs/DATA_MODELS.md` - Meal data structure for response mapping

**Key Responsibilities**:
- Implement the Claude Vision API integration using `@anthropic-ai/sdk`
- Craft and maintain prompts for accurate meal analysis (French food context)
- Parse and validate Claude's JSON response with Zod
- Implement the nutrition score algorithm (0-100)
- Handle edge cases: non-food images, unclear photos, multiple items
- Optimize prompt for portion size estimation accuracy
- Return structured data matching the meals table schema

---

## 4. Infrastructure Agent

**Role**: Infrastructure and configuration for the Sane app.

**Scope**: Project scaffolding, dependency management, environment configuration, deployment setup, PWA configuration.

**Files Owned**:
- `package.json` - Dependencies and scripts
- `next.config.ts` - Next.js configuration
- `.env.example` - Environment variable template
- `manifest.json` - PWA manifest
- `drizzle.config.ts` - Drizzle ORM configuration
- `tsconfig.json` - TypeScript configuration
- `postcss.config.mjs` - PostCSS configuration
- `eslint.config.mjs` - ESLint configuration

**Context Files to Read**:
1. `CLAUDE.md` - Project overview and conventions
2. `docs/ARCHITECTURE.md` - System architecture

**Key Responsibilities**:
- Maintain project dependencies and ensure compatibility
- Configure Next.js for PWA support (headers, manifest, service worker)
- Set up environment variable validation with Zod
- Configure Drizzle ORM connection and migration scripts
- Set up Cloudflare R2 SDK configuration
- Configure NextAuth.js v5
- Ensure TypeScript strict mode and proper path aliases
- Set up deployment configuration (Vercel or similar)

---

## Agent Coordination

### Dependency Order

For a fresh build, agents should work in this order:

1. **Infrastructure** - Project setup, dependencies, config files
2. **Backend** - Database schema, API routes, Server Actions
3. **AI** - Claude Vision integration (depends on Backend API structure)
4. **Frontend** - Pages and components (depends on Backend APIs and AI endpoint)

### Shared Boundaries

- **Backend <-> Frontend**: API contracts defined in `docs/API_SPEC.md`. Backend implements, Frontend consumes.
- **Backend <-> AI**: The AI agent's analyze endpoint returns data that Backend's meal creation action saves. Both must agree on the meal data shape from `docs/DATA_MODELS.md`.
- **Frontend <-> AI**: Frontend calls the analyze endpoint and displays the result. The response shape is defined in `docs/API_SPEC.md`.
- **Infrastructure <-> All**: Infrastructure sets up the environment that all other agents depend on.

### Conflict Resolution

If two agents need to modify the same file:
1. The agent whose scope is more specific to that file takes priority
2. If ambiguous, the Backend agent's data contracts take precedence
3. Always check `docs/API_SPEC.md` and `docs/DATA_MODELS.md` as the source of truth for data shapes
