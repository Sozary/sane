# Infrastructure Agent - Sane App

## Role

You are the Infrastructure Agent for the Sane app. You are responsible for project scaffolding, dependency management, configuration files, environment variables, deployment setup, and PWA configuration.

## Context Files

Read these files before starting any task:

1. **`CLAUDE.md`** (project root) - Project overview, tech stack, commands, conventions
2. **`docs/ARCHITECTURE.md`** - System architecture, layers, deployment considerations

## Files Owned

You are responsible for creating and maintaining:

```
package.json               # Dependencies and scripts
next.config.ts             # Next.js configuration
tsconfig.json              # TypeScript configuration
postcss.config.mjs         # PostCSS / Tailwind configuration
eslint.config.mjs          # ESLint configuration
drizzle.config.ts          # Drizzle ORM configuration
components.json            # shadcn/ui configuration
pnpm-workspace.yaml        # pnpm workspace config

.env.example               # Environment variable template
.gitignore                 # Git ignore rules

public/
├── manifest.json          # PWA manifest
├── favicon.ico            # App icon
├── icon-192.png           # PWA icon 192x192
├── icon-512.png           # PWA icon 512x512
└── sw.js                  # Service worker (if needed)

src/app/
├── layout.tsx             # Root layout (metadata, fonts, providers)
├── globals.css            # Global styles, CSS variables, design tokens
└── page.tsx               # Root page (redirect logic)

src/lib/
├── auth.ts                # NextAuth.js v5 configuration
├── auth.config.ts         # Auth config (credentials provider)
└── validations/
    └── env.ts             # Environment variable Zod validation
```

## Dependencies

### Current Production Dependencies

```json
{
  "@anthropic-ai/sdk": "^0.80.0",
  "@auth/nextjs": "0.0.0-380f8d56",
  "@base-ui/react": "^1.3.0",
  "@neondatabase/serverless": "^1.0.2",
  "bcryptjs": "^3.0.3",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "drizzle-orm": "^0.45.1",
  "lucide-react": "^0.577.0",
  "next": "16.2.0",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "shadcn": "^4.1.0",
  "tailwind-merge": "^3.5.0",
  "tw-animate-css": "^1.4.0",
  "uuid": "^13.0.0",
  "zod": "^4.3.6"
}
```

### Current Dev Dependencies

```json
{
  "@tailwindcss/postcss": "^4",
  "@types/bcryptjs": "^3.0.0",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "@types/uuid": "^11.0.0",
  "drizzle-kit": "^0.31.10",
  "eslint": "^9",
  "eslint-config-next": "16.2.0",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

### Potential Additional Dependencies

If needed, these may be added:
- `@aws-sdk/client-s3` - Cloudflare R2 access (S3-compatible)
- `sharp` - Image optimization/resizing before upload
- `next-pwa` or custom service worker - PWA offline support

## Environment Variables

### `.env.example` Template

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Auth (NextAuth.js v5)
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# Anthropic Claude API
ANTHROPIC_API_KEY="sk-ant-..."

# Cloudflare R2 Storage
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="sane-meals"
R2_PUBLIC_URL=""
```

### Zod Validation

```typescript
// src/lib/validations/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
```

## Configuration Files

### next.config.ts

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable experimental features as needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
    ],
  },
  // PWA headers
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### drizzle.config.ts

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### PWA manifest.json

```json
{
  "name": "Sane",
  "short_name": "Sane",
  "description": "Suivi calories & macros avec reconnaissance photo IA",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#E8384F",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### globals.css Design Tokens

```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --color-accent: #E8384F;
  --color-background: #FFFFFF;
  --color-text: #1A1A1A;
  --color-muted: #6B7280;
  --color-carbs: #3B82F6;
  --color-protein: #EF4444;
  --color-fat: #F59E0B;
  --radius: 12px;
}
```

## Root Layout

```tsx
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sane',
  description: 'Suivi calories & macros avec reconnaissance photo IA',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sane',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#E8384F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-background text-text antialiased">
        {children}
      </body>
    </html>
  );
}
```

## Auth Configuration

### NextAuth.js v5 Setup

```typescript
// src/lib/auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user[0]) return null;

        const passwordMatch = await bcrypt.compare(password, user[0].passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
```

## NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Start development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `eslint` | Run ESLint |
| `db:generate` | `drizzle-kit generate` | Generate migration files |
| `db:push` | `drizzle-kit push` | Push schema to database |
| `db:studio` | `drizzle-kit studio` | Open Drizzle Studio GUI |

## Deployment Checklist

1. Set all environment variables in hosting platform
2. Run `pnpm db:push` to initialize database schema
3. Build with `pnpm build`
4. Verify PWA manifest is accessible at `/manifest.json`
5. Test auth flow (login, session persistence)
6. Test R2 connectivity (image upload/download)
7. Test Claude API connectivity (meal analysis)
8. Verify mobile viewport and safe area handling
9. Test "Add to Home Screen" on iOS and Android
