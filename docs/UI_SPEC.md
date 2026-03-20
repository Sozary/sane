# UI Specification - Sane App

Screen-by-screen UI specification. All UI labels are in French. The app is mobile-first (375px primary width). Design follows the tokens defined in CLAUDE.md.

## Design System Reference

| Token | Value | CSS Variable |
|-------|-------|-------------|
| Accent | `#E8384F` | `--color-accent` |
| Background | `#FFFFFF` | `--color-background` |
| Text | `#1A1A1A` | `--color-text` |
| Muted | `#6B7280` | `--color-muted` |
| Carbs (Glucides) | `#3B82F6` | `--color-carbs` |
| Protein (Proteines) | `#EF4444` | `--color-protein` |
| Fat (Lipides) | `#F59E0B` | `--color-fat` |
| Border radius | `12px` | `--radius` |

**Typography**: System font stack (Inter preferred if loaded).
**Icons**: Lucide React icons.
**Component library**: shadcn/ui as base, customized with design tokens.

---

## Screen 01: Onboarding - Weight

**Route**: `/onboarding/weight`
**Layout**: Full-screen, white background

### Content

- **Top**: Brand "Sane" text or logo, top-left
- **Title**: "Quel est votre poids ?" (centered, large, bold)
- **Slider**: Circular or horizontal slider to select weight
  - Default: 70 kg
  - Range: 30-200 kg (or 66-440 lb)
  - Large number display showing current value (e.g., "70" in large text, "kg" smaller)
- **Unit toggle**: "kg" / "lb" toggle switch
- **Button**: "Continuer" - full-width, accent color (`#E8384F`), rounded 12px, bottom of screen
- **Progress**: Step indicator (1 of 4) or subtle progress bar

### Component Breakdown

```
OnboardingWeightPage
├── BrandLogo
├── Title ("Quel est votre poids ?")
├── WeightDisplay (large number + unit)
├── WeightSlider (circular/horizontal slider)
├── UnitToggle (kg/lb)
└── ContinueButton ("Continuer")
```

### Behavior

- Slider adjusts weight value in real-time
- Unit toggle converts displayed value between kg and lb
- Internal value always stored in kg
- "Continuer" navigates to `/onboarding/height`

---

## Screen 02: Onboarding - Height

**Route**: `/onboarding/height`
**Layout**: Full-screen, white background

### Content

- **Top**: Brand "Sane", back arrow
- **Title**: "Quelle est votre taille ?" (centered, large, bold)
- **Slider**: Vertical scale slider for height
  - Default: 170 cm
  - Range: 100-220 cm (or 3'3"-7'3")
  - Large number display (e.g., "170" with "cm" unit)
- **Unit toggle**: "cm" / "pieds" toggle switch
- **Visual**: Vertical ruler/scale graphic on the side
- **Button**: "Continuer" - same style as weight screen

### Component Breakdown

```
OnboardingHeightPage
├── BackButton
├── BrandLogo
├── Title ("Quelle est votre taille ?")
├── HeightDisplay (large number + unit)
├── HeightSlider (vertical scale)
├── UnitToggle (cm/pieds)
└── ContinueButton ("Continuer")
```

### Behavior

- Vertical slider adjusts height value
- Unit toggle converts between cm and feet/inches
- Internal value always stored in cm
- "Continuer" navigates to `/onboarding/result`

---

## Screen 03: Onboarding - BMR Result

**Route**: `/onboarding/result`
**Layout**: Full-screen, dark background (gradient or solid dark)

### Content

- **Top**: Brand "Sane" in white
- **Center**: Large circular gauge
  - Displays calculated BMR in kcal/jour (e.g., "2 247")
  - "kcal / jour" label below the number
  - Gauge ring filled proportionally (visual only, not representing a ratio)
  - Accent color (`#E8384F`) for the gauge arc
- **Bottom**: "Continuer" button (white or accent on dark background)

### Component Breakdown

```
OnboardingResultPage
├── BrandLogo (white variant)
├── CircularGauge
│   ├── GaugeRing (SVG circle with accent stroke)
│   ├── CalorieNumber ("2 247")
│   └── Label ("kcal / jour")
└── ContinueButton ("Continuer")
```

### Behavior

- BMR calculated using Mifflin-St Jeor equation from weight, height, age, gender
- If age/gender not yet provided, use defaults (age 30, average formula)
- Animated gauge fill on page load
- "Continuer" navigates to `/onboarding/goals`

### BMR Formula (Mifflin-St Jeor)

```
Male:   (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
Female: (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
```

---

## Screen 04: Onboarding - Goals

**Route**: `/onboarding/goals`
**Layout**: Full-screen, white background

### Content

- **Top**: Back arrow, brand "Sane"
- **Title**: "Calories & macros" (centered, bold)
- **Calorie Goal Section**:
  - Large editable number (pre-filled with BMR result)
  - "kcal / jour" label
  - +/- buttons or direct input
- **Macro Sliders**:
  - **Glucides** (Carbs): Blue (`#3B82F6`) slider, shows % and grams
    - e.g., "40%" and "220 g"
  - **Proteines** (Protein): Red (`#EF4444`) slider, shows % and grams
    - e.g., "30%" and "165 g"
  - **Lipides** (Fat): Amber (`#F59E0B`) slider, shows % and grams
    - e.g., "30%" and "73 g"
  - Sliders are linked: adjusting one redistributes the others to sum to 100%
- **Button**: "Terminer" or "Commencer" - full-width, accent color

### Component Breakdown

```
OnboardingGoalsPage
├── BackButton
├── BrandLogo
├── Title ("Calories & macros")
├── CalorieGoalInput
│   ├── CalorieNumber (editable)
│   └── Label ("kcal / jour")
├── MacroSliderGroup
│   ├── MacroSlider (Glucides, blue, carbs_pct)
│   ├── MacroSlider (Proteines, red, protein_pct)
│   └── MacroSlider (Lipides, amber, fat_pct)
└── FinishButton ("Commencer")
```

### Behavior

- Calorie goal is editable (direct number input or +/- controls)
- Macro percentages must sum to 100%
- Gram values computed: `calories * pct / 100 / calories_per_gram` (4 for carbs/protein, 9 for fat)
- "Commencer" calls `completeOnboarding` server action, then redirects to Dashboard

---

## Screen 05: Scan Photo

**Route**: `/scan` or modal overlay
**Layout**: Full-screen camera viewfinder

### Content

- **Background**: Live camera feed (full screen)
- **Top**: Close (X) button, flash toggle
- **Center**: Viewfinder frame/guide overlay (subtle rounded rectangle)
- **Bottom**: Large capture button (circle, white with accent border)
- **After capture**: Show preview with "Analyser" button or retake option

### Component Breakdown

```
ScanPhotoPage
├── CameraViewfinder
│   ├── CloseButton
│   ├── FlashToggle
│   └── GuideOverlay (subtle frame)
├── CaptureButton (large circle)
└── PhotoPreview (after capture)
    ├── PreviewImage
    ├── RetakeButton
    └── AnalyzeButton ("Analyser")
```

### Behavior

1. Opens device camera (rear-facing by default)
2. User frames meal in viewfinder
3. Tap capture button to take photo
4. Preview shown with "Analyser" and "Reprendre" options
5. "Analyser" uploads to R2, then calls POST `/api/meals/analyze`
6. Loading state while Claude processes (animated spinner or skeleton)
7. On success, navigates to Meal Detail screen with pre-filled data

---

## Screen 06: Meal Detail

**Route**: `/meals/[id]` or `/meals/new` (after analysis)
**Layout**: Scrollable, white background

### Content

- **Top section**:
  - Meal photo (if available) - full width, rounded bottom corners
  - Meal name (bold, large) - e.g., "Poulet grille avec riz"
  - Meal metadata: weight (e.g., "350 g"), date, meal type badge
- **Calories section**:
  - Fire icon + large calorie number (e.g., "520 kcal")
  - Accent color for the number
- **Macros section**:
  - Three horizontal bars or cards:
    - **Glucides**: Blue icon/color, "45.2 g" value
    - **Proteines**: Red icon/color, "38.0 g" value
    - **Lipides**: Amber icon/color, "15.3 g" value
- **Score badge**:
  - Circular badge showing score (e.g., "78")
  - Color coded: green (70-100), yellow (40-69), red (0-39)
  - Label: "Excellent !" / "Bon" / "A ameliorer"
- **Button**: "Termine" - full-width, accent color, bottom of screen
- **Edit**: All nutrition values should be editable (tap to edit)

### Component Breakdown

```
MealDetailPage
├── MealPhoto (full-width image or placeholder)
├── MealHeader
│   ├── MealName (editable)
│   ├── MealWeight ("350 g")
│   ├── MealDate
│   └── MealTypeBadge ("Dejeuner")
├── CalorieDisplay
│   ├── FireIcon
│   └── CalorieNumber ("520 kcal", editable)
├── MacroBreakdown
│   ├── MacroBar (Glucides, blue, 45.2g, editable)
│   ├── MacroBar (Proteines, red, 38.0g, editable)
│   └── MacroBar (Lipides, amber, 15.3g, editable)
├── ScoreBadge
│   ├── ScoreNumber (78)
│   └── ScoreLabel ("Excellent !")
└── ActionButton ("Termine")
```

### Score Labels

| Range | Label | Color |
|-------|-------|-------|
| 80-100 | "Excellent !" | Green |
| 60-79 | "Tres bien" | Green-ish |
| 40-59 | "Bon" | Yellow |
| 20-39 | "Moyen" | Orange |
| 0-19 | "A ameliorer" | Red |

### Behavior

- All nutrition values are editable (user can correct AI estimates)
- "Termine" saves the meal (POST `/api/meals` or PATCH `/api/meals/[id]`)
- After save, redirect to Dashboard
- If editing an existing meal, pre-fill all fields

---

## Screen 07: Dashboard

**Route**: `/dashboard`
**Layout**: Scrollable, white background, bottom navigation

### Content

#### Date Navigator (top)
- Left arrow, date display (e.g., "19 septembre"), right arrow
- Tap arrows to navigate days
- Tap date for date picker

#### Calorie Summary (main hero)
- Large number: "kcal restantes" (e.g., "1 709")
- Subtitle context: consumed (left) / burned (right)
  - e.g., "841 consommees" | "350 brulees"
- Circular progress ring around the calorie number
  - Ring color: accent (`#E8384F`)
  - Fill percentage: consumed / goal

#### Macro Progress Bars
Three horizontal progress bars, each showing:
- Label (Glucides / Proteines / Lipides)
- Progress bar (filled portion with color)
- Values: "97 / 220 g" (consumed / goal)

| Macro | Color | Calories per gram |
|-------|-------|-------------------|
| Glucides | `#3B82F6` (blue) | 4 |
| Proteines | `#EF4444` (red) | 4 |
| Lipides | `#F59E0B` (amber) | 9 |

#### Activity Section
- **Pas** (Steps): Shoe icon + "8 500 pas"
- **Eau** (Water): Water drop icon + "1.5 L" (or "1 500 ml")
- Tappable to edit values

#### Journal Section
- "Journal" heading
- List of today's meals, each showing:
  - Meal type icon/badge
  - Meal name
  - Calorie count
  - Small photo thumbnail (if available)
- Tap meal to open Meal Detail
- "+" button to add meal (opens scan or manual entry)

#### Bottom Navigation
- Dashboard (active)
- Scan (camera icon, center, prominent)
- Profile / Settings

### Component Breakdown

```
DashboardPage
├── DateNavigator
│   ├── PrevDayButton
│   ├── DateDisplay ("19 septembre")
│   └── NextDayButton
├── CalorieSummary
│   ├── CircularProgressRing (SVG)
│   ├── CaloriesRemaining ("1 709")
│   ├── Label ("kcal restantes")
│   └── ConsumedBurnedRow
│       ├── ConsumedLabel ("841 consommees")
│       └── BurnedLabel ("350 brulees")
├── MacroProgressSection
│   ├── MacroProgressBar (Glucides, blue, 97/220g)
│   ├── MacroProgressBar (Proteines, red, 44/165g)
│   └── MacroProgressBar (Lipides, amber, 25/73g)
├── ActivitySection
│   ├── StepsCard (shoe icon, "8 500 pas")
│   └── WaterCard (drop icon, "1.5 L")
├── JournalSection
│   ├── SectionHeader ("Journal")
│   ├── MealCard (foreach meal)
│   │   ├── MealTypeBadge
│   │   ├── MealName
│   │   ├── MealCalories
│   │   └── MealThumbnail
│   └── AddMealButton ("+")
└── BottomNavigation
    ├── DashboardTab (active)
    ├── ScanTab (center, prominent)
    └── ProfileTab
```

### Behavior

- Dashboard is the main screen after login/onboarding
- All data fetched via GET `/api/daily-log?date=YYYY-MM-DD` and GET `/api/meals?date=YYYY-MM-DD`
- Date navigator changes the date and refetches data
- Circular ring animates on load
- Tapping a meal navigates to `/meals/[id]`
- Scan button opens the camera/scan flow
- Activity cards open an edit modal for steps/water

---

## Shared Components

### CircularProgressRing

SVG-based circular progress indicator. Used on Dashboard (calorie ring) and Onboarding Result (BMR gauge).

**Props**:
- `value: number` - Current value
- `max: number` - Maximum value
- `size: number` - Diameter in pixels
- `strokeWidth: number` - Ring thickness
- `color: string` - Ring color (default: accent)

### MacroProgressBar

Horizontal progress bar for macro tracking.

**Props**:
- `label: string` - "Glucides", "Proteines", "Lipides"
- `current: number` - Grams consumed
- `goal: number` - Grams goal
- `color: string` - Bar color

### MealCard

Card for displaying a meal in lists.

**Props**:
- `meal: Meal` - Meal data object
- `onClick: () => void`

### DateNavigator

Day-by-day date navigation.

**Props**:
- `date: Date` - Current date
- `onDateChange: (date: Date) => void`

### ScoreBadge

Circular score display with color coding.

**Props**:
- `score: number` - 0-100

---

## Navigation Structure

```
/                         → Redirect to /dashboard or /onboarding/weight
/onboarding/weight        → Step 1
/onboarding/height        → Step 2
/onboarding/result        → Step 3
/onboarding/goals         → Step 4
/dashboard                → Main screen
/scan                     → Camera / photo capture
/meals/new                → Meal detail (after analysis)
/meals/[id]               → Meal detail (existing)
/profile                  → User profile / settings
```

**Route Groups**:
- `(onboarding)` - No bottom nav, full-screen flows
- `(app)` - Has bottom navigation, authenticated layout

**Auth Guard**: All routes except `/login` and `/register` require authentication. Unauthenticated users redirect to `/login`. Users with `onboarding_done = false` redirect to `/onboarding/weight`.
