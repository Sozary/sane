# AI Agent - Sane App

## Role

You are the AI Agent for the Sane app. You are responsible for the Claude Vision API integration, prompt engineering, photo analysis pipeline, and nutrition scoring algorithm.

## Context Files

Read these files before starting any task:

1. **`CLAUDE.md`** (project root) - Project overview, tech stack, conventions
2. **`docs/AI_PROMPTS.md`** - Complete prompt templates, expected outputs, scoring criteria, examples
3. **`docs/API_SPEC.md`** - API contract for POST `/api/meals/analyze`
4. **`docs/DATA_MODELS.md`** - Meal data structure for mapping AI output to DB schema

## Files Owned

You are responsible for creating and maintaining:

```
src/lib/ai/
├── client.ts              # Anthropic SDK client initialization
├── prompts.ts             # System prompt and user message templates
├── analyze-meal.ts        # Main analysis function (send image, parse response)
├── validate-response.ts   # Zod schemas for validating Claude's JSON output
└── scoring.ts             # Score interpretation utilities (labels, colors)

src/app/api/meals/analyze/
└── route.ts               # POST endpoint: receive image, call Claude, return nutrition
```

## Conventions

### SDK Usage

- Use `@anthropic-ai/sdk` (already installed in dependencies)
- Initialize client once in `src/lib/ai/client.ts`
- API key from `process.env.ANTHROPIC_API_KEY`
- Model: `claude-sonnet-4-20250514` (or latest vision-capable model)
- Temperature: `0.2` for consistent factual output
- Max tokens: `1024`

### Response Handling

1. Send image + text prompt to Claude Vision API
2. Extract text content from response
3. Parse JSON from text (handle potential markdown code blocks: strip `` ```json `` wrappers if present)
4. Validate with Zod schema (`mealAnalysisResponseSchema`)
5. Check for error response (`{ error: "not_food" }`)
6. Return validated data or throw appropriate error

### Image Processing

- Accept JPEG, PNG, WebP formats
- Maximum file size: 10MB
- Convert image to base64 for Claude API
- Store original image in Cloudflare R2 before analysis
- The R2 upload is handled by the route handler, not the AI module

### Error Categories

| Error Type | Handling | HTTP Status |
|------------|----------|-------------|
| Not food | Return `{ error: "not_food" }` | 422 |
| Invalid JSON from Claude | Log, retry once, then 500 | 500 |
| Zod validation failure | Log response, attempt partial extraction, then 500 | 500 |
| API rate limit (429) | Retry with exponential backoff (max 3 attempts) | 500 |
| API timeout | Return timeout error | 500 |
| Missing API key | Throw at startup | 500 |

### Retry Logic

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      if (error instanceof Anthropic.RateLimitError) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        continue;
      }
      throw error; // Don't retry non-rate-limit errors
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Implementation Guide

### Client Initialization

```typescript
// src/lib/ai/client.ts
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

### Main Analysis Function

```typescript
// src/lib/ai/analyze-meal.ts
import { anthropic } from './client';
import { SYSTEM_PROMPT, buildUserMessage } from './prompts';
import { mealAnalysisResponseSchema } from './validate-response';

export type MealAnalysisResult = {
  name: string;
  calories: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  weight_g: number | null;
  score: number;
  meal_items: {
    name: string;
    calories: number;
    carbs_g: number;
    protein_g: number;
    fat_g: number;
    weight_g: number | null;
  }[];
};

export async function analyzeMealPhoto(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
  mealType?: string
): Promise<MealAnalysisResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: buildUserMessage(mealType),
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // Strip markdown code blocks if present
  const jsonStr = text.replace(/^```json\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();

  const parsed = JSON.parse(jsonStr);
  const validated = mealAnalysisResponseSchema.parse(parsed);

  if ('error' in validated) {
    throw new NotFoodError('Image does not contain food');
  }

  return validated;
}

export class NotFoodError extends Error {
  constructor(message = 'Not food') {
    super(message);
    this.name = 'NotFoodError';
  }
}
```

### Route Handler

```typescript
// src/app/api/meals/analyze/route.ts
import { auth } from '@/lib/auth';
import { analyzeMealPhoto, NotFoodError } from '@/lib/ai/analyze-meal';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Non autorise' }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get('image') as File | null;
  const mealType = formData.get('meal_type') as string | null;

  if (!image) {
    return Response.json({ error: 'Image requise' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(image.type)) {
    return Response.json({ error: "Format d'image non supporte" }, { status: 400 });
  }

  // Validate file size (10MB)
  if (image.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'Image trop volumineuse (max 10 Mo)' }, { status: 400 });
  }

  try {
    // Convert to base64
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString('base64');

    // TODO: Upload to R2 and get image_url

    // Analyze with Claude
    const result = await analyzeMealPhoto(
      base64,
      image.type as 'image/jpeg' | 'image/png' | 'image/webp',
      mealType || undefined
    );

    return Response.json({
      ...result,
      image_url: null, // Replace with R2 URL after upload
    });
  } catch (error) {
    if (error instanceof NotFoodError) {
      return Response.json(
        { error: "Impossible d'analyser cette image" },
        { status: 422 }
      );
    }

    console.error('Meal analysis error:', error);
    return Response.json(
      { error: "Erreur lors de l'analyse" },
      { status: 500 }
    );
  }
}
```

## Score Utilities

```typescript
// src/lib/ai/scoring.ts

export type ScoreLevel = {
  label: string;
  color: string;
};

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return { label: 'Excellent !', color: '#22C55E' };
  if (score >= 60) return { label: 'Tres bien', color: '#84CC16' };
  if (score >= 40) return { label: 'Bon', color: '#EAB308' };
  if (score >= 20) return { label: 'Moyen', color: '#F97316' };
  return { label: 'A ameliorer', color: '#EF4444' };
}
```

## Testing Considerations

- Test with various meal types: French cuisine, fast food, desserts, drinks
- Test edge cases: empty plates, non-food objects, blurry photos, multiple meals
- Validate that calorie totals match the sum of individual meal items
- Verify score consistency across similar meals
- Test JSON parsing with various Claude response formats (with/without code blocks)
- Ensure retry logic works for rate limits
