# API Specification - Sane App

Complete API specification with request/response contracts. All routes require authentication (NextAuth.js session). All dates are in UTC.

## Route Overview

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/meals/analyze` | Photo -> Claude Vision -> nutrition JSON |
| `POST` | `/api/meals` | Create a meal entry |
| `GET` | `/api/meals?date=YYYY-MM-DD` | List meals for a date |
| `GET` | `/api/meals/[id]` | Get meal detail |
| `PATCH` | `/api/meals/[id]` | Update a meal |
| `DELETE` | `/api/meals/[id]` | Delete a meal |
| `GET` | `/api/daily-log?date=YYYY-MM-DD` | Daily summary (aggregated) |
| `PATCH` | `/api/daily-log` | Update steps/water/burned |
| `GET` | `/api/user/profile` | Get user profile |
| `PATCH` | `/api/user/profile` | Update profile/goals |

## Authentication

All routes require a valid NextAuth.js session. Unauthenticated requests receive:

```json
{
  "error": "Non autorise"
}
```

**HTTP Status**: `401 Unauthorized`

The authenticated user ID is extracted from the session and used for all queries. Users can only access their own data.

## Error Response Shape

All errors follow this shape:

```typescript
type ErrorResponse = {
  error: string;           // Human-readable error message
  details?: unknown;       // Optional: Zod validation errors, etc.
};
```

Common error codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no session)
- `403` - Forbidden (accessing another user's data)
- `404` - Not Found
- `500` - Internal Server Error

---

## POST `/api/meals/analyze`

Analyze a meal photo using Claude Vision API. Returns estimated nutrition data.

### Request

**Content-Type**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | `File` | Yes | Meal photo (JPEG, PNG, WebP). Max 10MB. |
| `meal_type` | `string` | No | Hint: "breakfast", "lunch", "dinner", "snack" |

**Zod Schema Reference**: `analyzeMealSchema` in `src/lib/validations/meals.ts`

### Response (200 OK)

```typescript
type AnalyzeMealResponse = {
  name: string;            // e.g., "Poulet grille avec riz basmati et legumes"
  calories: number;        // e.g., 520.5
  carbs_g: number;         // e.g., 45.2
  protein_g: number;       // e.g., 38.0
  fat_g: number;           // e.g., 15.3
  weight_g: number | null; // e.g., 350
  score: number;           // 0-100, e.g., 78
  meal_items: {
    name: string;          // e.g., "Poulet grille"
    calories: number;
    carbs_g: number;
    protein_g: number;
    fat_g: number;
    weight_g: number | null;
  }[];
  image_url: string;       // R2 URL of uploaded photo
};
```

### Example

**Request**:
```
POST /api/meals/analyze
Content-Type: multipart/form-data

image: [meal photo file]
meal_type: "lunch"
```

**Response**:
```json
{
  "name": "Poulet grille avec riz basmati et salade verte",
  "calories": 520.5,
  "carbs_g": 45.2,
  "protein_g": 38.0,
  "fat_g": 15.3,
  "weight_g": 350,
  "score": 78,
  "meal_items": [
    {
      "name": "Poulet grille",
      "calories": 250,
      "carbs_g": 0,
      "protein_g": 35,
      "fat_g": 11,
      "weight_g": 150
    },
    {
      "name": "Riz basmati",
      "calories": 210,
      "carbs_g": 43,
      "protein_g": 2,
      "fat_g": 1.5,
      "weight_g": 150
    },
    {
      "name": "Salade verte",
      "calories": 60.5,
      "carbs_g": 2.2,
      "protein_g": 1.0,
      "fat_g": 2.8,
      "weight_g": 50
    }
  ],
  "image_url": "https://r2.example.com/meals/abc123.jpg"
}
```

### Errors

| Status | Error | When |
|--------|-------|------|
| `400` | "Image requise" | No image file provided |
| `400` | "Format d'image non supporte" | Not JPEG/PNG/WebP |
| `400` | "Image trop volumineuse (max 10 Mo)" | File exceeds 10MB |
| `422` | "Impossible d'analyser cette image" | Claude cannot identify food |
| `500` | "Erreur lors de l'analyse" | Claude API failure |

---

## POST `/api/meals`

Create a new meal entry.

### Request

**Content-Type**: `application/json`

```typescript
type CreateMealRequest = {
  date: string;            // "YYYY-MM-DD"
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;            // 1-255 chars
  calories: number;        // >= 0
  carbs_g: number;         // >= 0
  protein_g: number;       // >= 0
  fat_g: number;           // >= 0
  weight_g?: number;       // >= 0, optional
  score?: number;          // 0-100, optional
  image_url?: string;      // optional
};
```

**Zod Schema Reference**: `createMealSchema` in `src/lib/validations/meals.ts`

### Response (201 Created)

```typescript
type CreateMealResponse = {
  id: string;              // uuid
  user_id: string;
  date: string;
  meal_type: string;
  name: string;
  calories: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  weight_g: number | null;
  score: number | null;
  image_url: string | null;
  is_favorite: boolean;
  created_at: string;      // ISO 8601
  updated_at: string;
};
```

### Example

**Request**:
```json
{
  "date": "2025-03-19",
  "meal_type": "lunch",
  "name": "Poulet grille avec riz",
  "calories": 520.5,
  "carbs_g": 45.2,
  "protein_g": 38.0,
  "fat_g": 15.3,
  "weight_g": 350,
  "score": 78,
  "image_url": "https://r2.example.com/meals/abc123.jpg"
}
```

**Response** (201):
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "date": "2025-03-19",
  "meal_type": "lunch",
  "name": "Poulet grille avec riz",
  "calories": 520.5,
  "carbs_g": 45.2,
  "protein_g": 38.0,
  "fat_g": 15.3,
  "weight_g": 350,
  "score": 78,
  "image_url": "https://r2.example.com/meals/abc123.jpg",
  "is_favorite": false,
  "created_at": "2025-03-19T12:30:00.000Z",
  "updated_at": "2025-03-19T12:30:00.000Z"
}
```

### Errors

| Status | Error | When |
|--------|-------|------|
| `400` | "Donnees invalides" | Zod validation failure (details in `details` field) |

---

## GET `/api/meals?date=YYYY-MM-DD`

List all meals for the authenticated user on the given date.

### Request

**Query Parameters**:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | `string` | Yes | Date in YYYY-MM-DD format |

### Response (200 OK)

```typescript
type ListMealsResponse = {
  meals: {
    id: string;
    date: string;
    meal_type: string;
    name: string;
    calories: number;
    carbs_g: number;
    protein_g: number;
    fat_g: number;
    weight_g: number | null;
    score: number | null;
    image_url: string | null;
    is_favorite: boolean;
    created_at: string;
  }[];
};
```

### Example

```
GET /api/meals?date=2025-03-19
```

```json
{
  "meals": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "date": "2025-03-19",
      "meal_type": "breakfast",
      "name": "Tartines beurre confiture",
      "calories": 320,
      "carbs_g": 52,
      "protein_g": 6,
      "fat_g": 10,
      "weight_g": 180,
      "score": 45,
      "image_url": null,
      "is_favorite": false,
      "created_at": "2025-03-19T07:30:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "date": "2025-03-19",
      "meal_type": "lunch",
      "name": "Poulet grille avec riz",
      "calories": 520.5,
      "carbs_g": 45.2,
      "protein_g": 38.0,
      "fat_g": 15.3,
      "weight_g": 350,
      "score": 78,
      "image_url": "https://r2.example.com/meals/abc123.jpg",
      "is_favorite": true,
      "created_at": "2025-03-19T12:30:00.000Z"
    }
  ]
}
```

### Errors

| Status | Error | When |
|--------|-------|------|
| `400` | "Date invalide" | Missing or invalid date format |

---

## GET `/api/meals/[id]`

Get a single meal by ID.

### Request

**URL Parameters**:
- `id` (uuid) - Meal ID

### Response (200 OK)

Same shape as a single item in the `ListMealsResponse.meals` array, plus `updated_at`.

### Errors

| Status | Error | When |
|--------|-------|------|
| `404` | "Repas non trouve" | Meal does not exist or belongs to another user |

---

## PATCH `/api/meals/[id]`

Update an existing meal. All fields are optional - only provided fields are updated.

### Request

**Content-Type**: `application/json`

```typescript
type UpdateMealRequest = {
  meal_type?: "breakfast" | "lunch" | "dinner" | "snack";
  name?: string;
  calories?: number;
  carbs_g?: number;
  protein_g?: number;
  fat_g?: number;
  weight_g?: number | null;
  score?: number | null;
  is_favorite?: boolean;
};
```

**Zod Schema Reference**: `updateMealSchema` in `src/lib/validations/meals.ts`

### Response (200 OK)

Returns the full updated meal object (same shape as GET `/api/meals/[id]`).

### Example

**Request**:
```json
{
  "calories": 480,
  "is_favorite": true
}
```

### Errors

| Status | Error | When |
|--------|-------|------|
| `400` | "Donnees invalides" | Zod validation failure |
| `404` | "Repas non trouve" | Meal not found or not owned by user |

---

## DELETE `/api/meals/[id]`

Delete a meal.

### Request

**URL Parameters**:
- `id` (uuid) - Meal ID

### Response (200 OK)

```json
{
  "success": true
}
```

### Errors

| Status | Error | When |
|--------|-------|------|
| `404` | "Repas non trouve" | Meal not found or not owned by user |

---

## GET `/api/daily-log?date=YYYY-MM-DD`

Get the daily summary for a given date. This aggregates consumed calories/macros from meals and combines them with the daily log data (burned, steps, water) and user goals.

### Request

**Query Parameters**:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | `string` | Yes | Date in YYYY-MM-DD format |

### Response (200 OK)

```typescript
type DailyLogResponse = {
  date: string;

  // Goals (from user profile)
  calorie_goal: number;
  carbs_goal_g: number;       // computed: (calorie_goal * carbs_pct / 100) / 4
  protein_goal_g: number;     // computed: (calorie_goal * protein_pct / 100) / 4
  fat_goal_g: number;         // computed: (calorie_goal * fat_pct / 100) / 9

  // Consumed (aggregated from meals)
  consumed_calories: number;
  consumed_carbs_g: number;
  consumed_protein_g: number;
  consumed_fat_g: number;

  // Activity (from daily_logs)
  calories_burned: number;
  steps: number;
  water_ml: number;

  // Computed
  calories_remaining: number; // calorie_goal - consumed + burned

  // Meals summary
  meal_count: number;
};
```

### Example

```
GET /api/daily-log?date=2025-03-19
```

```json
{
  "date": "2025-03-19",
  "calorie_goal": 2200,
  "carbs_goal_g": 220,
  "protein_goal_g": 165,
  "fat_goal_g": 73.3,
  "consumed_calories": 840.5,
  "consumed_carbs_g": 97.2,
  "consumed_protein_g": 44.0,
  "consumed_fat_g": 25.3,
  "calories_burned": 350,
  "steps": 8500,
  "water_ml": 1500,
  "calories_remaining": 1709.5,
  "meal_count": 2
}
```

### Errors

| Status | Error | When |
|--------|-------|------|
| `400` | "Date invalide" | Missing or invalid date format |

---

## PATCH `/api/daily-log`

Update daily activity data (burned calories, steps, water). Creates the daily log entry if it does not exist (upsert).

### Request

**Content-Type**: `application/json`

```typescript
type UpdateDailyLogRequest = {
  date: string;                   // "YYYY-MM-DD", required
  calories_burned?: number;       // >= 0
  steps?: number;                 // >= 0, integer
  water_ml?: number;              // >= 0, integer
};
```

**Zod Schema Reference**: `updateDailyLogSchema` in `src/lib/validations/daily-log.ts`

### Response (200 OK)

```typescript
type UpdateDailyLogResponse = {
  id: string;
  date: string;
  calories_burned: number;
  steps: number;
  water_ml: number;
  updated_at: string;
};
```

### Example

**Request**:
```json
{
  "date": "2025-03-19",
  "steps": 10200,
  "water_ml": 2000
}
```

**Response**:
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "date": "2025-03-19",
  "calories_burned": 350,
  "steps": 10200,
  "water_ml": 2000,
  "updated_at": "2025-03-19T18:00:00.000Z"
}
```

### Errors

| Status | Error | When |
|--------|-------|------|
| `400` | "Donnees invalides" | Zod validation failure |

---

## GET `/api/user/profile`

Get the authenticated user's profile.

### Response (200 OK)

```typescript
type UserProfileResponse = {
  id: string;
  email: string;
  name: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  calorie_goal: number;
  macro_carbs_pct: number;
  macro_protein_pct: number;
  macro_fat_pct: number;
  onboarding_done: boolean;
};
```

### Example

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "user@example.com",
  "name": "Marie",
  "height_cm": 165,
  "weight_kg": 62.5,
  "age": 28,
  "gender": "female",
  "calorie_goal": 2200,
  "macro_carbs_pct": 40,
  "macro_protein_pct": 30,
  "macro_fat_pct": 30,
  "onboarding_done": true
}
```

---

## PATCH `/api/user/profile`

Update user profile and/or goals.

### Request

**Content-Type**: `application/json`

```typescript
type UpdateProfileRequest = {
  name?: string;
  height_cm?: number;
  weight_kg?: number;
  age?: number;
  gender?: "male" | "female" | "other";
  calorie_goal?: number;         // > 0
  macro_carbs_pct?: number;      // 0-100
  macro_protein_pct?: number;    // 0-100
  macro_fat_pct?: number;        // 0-100
};
```

**Zod Schema Reference**: `updateProfileSchema` in `src/lib/validations/user.ts`

**Validation**: If any macro percentage is provided, all three must be provided and must sum to 100.

### Response (200 OK)

Returns the full updated profile (same shape as GET `/api/user/profile`).

### Example

**Request**:
```json
{
  "calorie_goal": 2400,
  "macro_carbs_pct": 45,
  "macro_protein_pct": 30,
  "macro_fat_pct": 25
}
```

### Errors

| Status | Error | When |
|--------|-------|------|
| `400` | "Donnees invalides" | Zod validation failure |
| `400` | "Les macros doivent totaliser 100%" | Macro percentages do not sum to 100 |

---

## Server Actions

In addition to API routes, the following Server Actions are available for use directly in React Server Components and forms:

| Action | File | Description |
|--------|------|-------------|
| `createMeal` | `src/lib/actions/meals.ts` | Create a meal (same as POST /api/meals) |
| `updateMeal` | `src/lib/actions/meals.ts` | Update a meal |
| `deleteMeal` | `src/lib/actions/meals.ts` | Delete a meal |
| `toggleFavorite` | `src/lib/actions/meals.ts` | Toggle meal favorite status |
| `updateDailyLog` | `src/lib/actions/daily-log.ts` | Update daily log (upsert) |
| `updateProfile` | `src/lib/actions/user.ts` | Update user profile |
| `completeOnboarding` | `src/lib/actions/user.ts` | Save onboarding data and set flag |

Server Actions use the same Zod schemas and return the same response shapes as their API route equivalents.
