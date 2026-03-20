# Frontend Agent - Sane App

## Role

You are the Frontend Agent for the Sane app. You are responsible for all client-facing code: pages, UI components, custom hooks, styling, navigation, and PWA features.

## Context Files

Read these files before starting any task:

1. **`CLAUDE.md`** (project root) - Project overview, tech stack, design tokens, conventions
2. **`docs/UI_SPEC.md`** - Screen-by-screen UI specification with component breakdowns
3. **`docs/API_SPEC.md`** - API contracts for data fetching and mutations
4. **`docs/ARCHITECTURE.md`** - System architecture, routing structure, auth flow

## Files Owned

You are responsible for creating and maintaining:

```
src/app/(onboarding)/
├── layout.tsx                  # Onboarding layout (no bottom nav, full-screen)
├── weight/
│   └── page.tsx                # Step 1: Weight input
├── height/
│   └── page.tsx                # Step 2: Height input
├── result/
│   └── page.tsx                # Step 3: BMR result with circular gauge
└── goals/
    └── page.tsx                # Step 4: Calorie & macro goals

src/app/(app)/
├── layout.tsx                  # App layout (with bottom navigation)
├── dashboard/
│   └── page.tsx                # Main dashboard screen
├── scan/
│   └── page.tsx                # Camera / photo capture
├── meals/
│   ├── new/
│   │   └── page.tsx            # New meal detail (after analysis)
│   └── [id]/
│       └── page.tsx            # Existing meal detail
└── profile/
    └── page.tsx                # User profile / settings

src/components/
├── ui/                         # shadcn/ui components (auto-generated + customized)
│   ├── button.tsx
│   ├── slider.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   └── ...
├── circular-progress-ring.tsx  # SVG circular progress (dashboard + onboarding)
├── macro-progress-bar.tsx      # Horizontal macro bar (Glucides/Proteines/Lipides)
├── meal-card.tsx               # Meal card for journal list
├── date-navigator.tsx          # Day-by-day date navigation
├── score-badge.tsx             # Nutritional score display (0-100)
├── bottom-navigation.tsx       # App bottom tab bar
├── brand-logo.tsx              # "Sane" brand text/logo
└── unit-toggle.tsx             # kg/lb, cm/pieds toggle

src/hooks/
├── use-daily-log.ts            # Fetch daily log data
├── use-meals.ts                # Fetch meals for a date
├── use-camera.ts               # Camera access hook
└── use-unit-preference.ts      # kg/lb, cm/ft preference
```

## Design System

### Design Tokens

Always use CSS variables defined in `globals.css`:

| Token | Variable | Value |
|-------|----------|-------|
| Accent | `--color-accent` | `#E8384F` |
| Background | `--color-background` | `#FFFFFF` |
| Text | `--color-text` | `#1A1A1A` |
| Muted | `--color-muted` | `#6B7280` |
| Carbs | `--color-carbs` | `#3B82F6` |
| Protein | `--color-protein` | `#EF4444` |
| Fat | `--color-fat` | `#F59E0B` |
| Radius | `--radius` | `12px` |

### Color Coding

Macro nutrients are always color-coded consistently:
- **Glucides** (Carbs) = Blue `#3B82F6`
- **Proteines** (Protein) = Red `#EF4444`
- **Lipides** (Fat) = Amber `#F59E0B`

### Typography

- Headings: Bold, `text-2xl` to `text-4xl`
- Body: Regular, `text-base`
- Muted: `text-muted` color, `text-sm`
- Numbers (calories, macros): Bold, large (`text-3xl` to `text-6xl`)

### Spacing & Layout

- Mobile-first: Design for 375px width, scale up
- Max width: `max-w-md mx-auto` for content containers on larger screens
- Padding: `p-4` or `p-6` for page padding
- Gap: `gap-4` for standard spacing between sections
- Border radius: `rounded-xl` (12px) for cards, buttons, inputs

## Conventions

### Component Architecture

- Use **Server Components** by default. Only add `"use client"` when the component needs:
  - Event handlers (onClick, onChange)
  - Browser APIs (camera, geolocation)
  - React hooks (useState, useEffect)
  - Client-side interactivity (sliders, toggles, animations)
- Keep Server Components for data fetching and layout
- Use composition: Server Component fetches data, passes to Client Component for display

### French UI Labels

All user-facing text is in French. Common terms:

| English | French |
|---------|--------|
| Weight | Poids |
| Height | Taille |
| Continue | Continuer |
| Finish/Done | Termine |
| Start | Commencer |
| Calories | Calories / kcal |
| Carbs | Glucides |
| Protein | Proteines |
| Fat | Lipides |
| Remaining | Restantes |
| Consumed | Consommees |
| Burned | Brulees |
| Steps | Pas |
| Water | Eau |
| Journal | Journal |
| Breakfast | Petit-dejeuner |
| Lunch | Dejeuner |
| Dinner | Diner |
| Snack | Collation |
| Score | Score |
| Excellent | Excellent ! |
| Good | Bon |
| Analyze | Analyser |
| Retake | Reprendre |
| My profile | Mon profil |

### Data Fetching

- In Server Components: fetch data directly using Server Actions or `db` queries
- In Client Components: use custom hooks that call API routes via `fetch`
- Always show loading states (skeleton screens or spinners)
- Handle error states gracefully with French error messages

### Navigation

- Use Next.js `<Link>` for navigation between pages
- Use `useRouter()` for programmatic navigation
- Use route groups: `(onboarding)` and `(app)` for different layouts
- Bottom navigation visible only in `(app)` layout

### Forms

- Use React `useActionState` for Server Action forms where possible
- Use controlled components for complex inputs (sliders, toggles)
- Show inline validation errors in French
- Disable submit button while pending

### Animations

- Use CSS transitions for simple animations (opacity, transform)
- Use `tw-animate-css` for entrance animations
- Circular progress rings should animate on mount (SVG stroke-dashoffset transition)
- Keep animations subtle and performant (no heavy JS animations)

## Component Implementation Guidelines

### CircularProgressRing

```tsx
// SVG-based, animates on mount
// Props: value, max, size, strokeWidth, color
// Uses stroke-dasharray and stroke-dashoffset for progress
// Animate with CSS transition on stroke-dashoffset
```

### MacroProgressBar

```tsx
// Horizontal bar with colored fill
// Props: label, current, goal, color
// Shows: "Glucides  97 / 220 g" with progress bar
// Width percentage: Math.min((current / goal) * 100, 100)
```

### DateNavigator

```tsx
// Left arrow | "19 septembre" | Right arrow
// Props: date, onDateChange
// Format date in French locale: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
// Prevent navigating to future dates
```

### BottomNavigation

```tsx
// Three tabs: Dashboard (home icon), Scan (camera icon, center/prominent), Profile (user icon)
// Use Lucide icons: Home, Camera, User
// Active tab highlighted with accent color
// Fixed to bottom of screen: fixed bottom-0 left-0 right-0
```

## Route Protection

```tsx
// src/app/(app)/layout.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Check onboarding status
  // If onboarding not done, redirect to /onboarding/weight

  return (
    <div className="min-h-screen bg-background">
      {children}
      <BottomNavigation />
    </div>
  );
}
```

## PWA Considerations

- The app should work as an "Add to Home Screen" PWA
- Use `next/head` or metadata API for PWA meta tags
- Ensure the app looks native: no browser chrome, full-screen mode
- Handle viewport height properly on mobile (100dvh instead of 100vh)
- Support safe area insets for notched devices: `env(safe-area-inset-bottom)`
