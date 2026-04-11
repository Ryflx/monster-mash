# Monster Mash — Neon Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Monster Mash from a Vite SPA with localStorage history to Next.js 16 + Clerk + Neon + Drizzle on Vercel, adding personal and team completion tracking for a small group of friends.

**Architecture:** Rip out Vite in-place in `~/monster-mash` (preserve git history), scaffold Next.js 16 App Router, plug in Clerk for auth and Drizzle against a new Neon project. Existing presentational components move across unchanged; the `useHistory` hook is deleted and replaced with server actions + `useOptimistic`. Mode (Solo/Team) is stored in a cookie and read server-side by query and mutation helpers.

**Tech Stack:** Next.js 16 (App Router, TypeScript), Tailwind v4, Clerk (`@clerk/nextjs`), Neon Postgres (`@neondatabase/serverless`), Drizzle ORM + drizzle-kit, Vercel.

**Spec:** `docs/superpowers/specs/2026-04-11-neon-migration-design.md`

---

## Pre-flight

Before starting Task 1, confirm:
- Working directory is `~/monster-mash` on the `main` branch, working tree clean.
- Node 20+ installed (`node -v`).
- `gh` CLI authenticated (`gh auth status`) — used later for pushing to GitHub.
- A **Neon account** is available (uses the same account as `the-yard-peckham`).
- A **Clerk account** is available.
- A **Vercel account** is available and linked to GitHub.

---

## Task 1: Back up existing Vite code and create feature branch

**Files:**
- Create: `src-vite-backup/` (temporary, deleted at end of Task 2)
- Modify: working tree

**Why:** We're ripping out Vite in-place. We keep a copy of the existing `src/` so Task 2 can move the presentational components back into the new Next.js structure without re-reading git history.

- [ ] **Step 1: Create and switch to a feature branch**

```bash
cd ~/monster-mash
git checkout -b feat/neon-migration
```

- [ ] **Step 2: Snapshot current src/ to src-vite-backup/**

```bash
cp -R src src-vite-backup
```

- [ ] **Step 3: Verify the backup**

```bash
ls src-vite-backup/components
```

Expected: `Header.tsx HistoryLog.tsx MovementFilter.tsx SearchBar.tsx SpinWheel.tsx WorkoutCard.tsx WorkoutList.tsx`

- [ ] **Step 4: Do NOT commit the backup** — it's added to `.gitignore` now so it doesn't land in history.

```bash
echo "src-vite-backup/" >> .gitignore
```

- [ ] **Step 5: Commit the gitignore change**

```bash
git add .gitignore
git commit -m "chore: ignore temporary vite src backup during migration"
```

---

## Task 2: Remove Vite, scaffold Next.js 16

**Files:**
- Delete: `vite.config.ts`, `index.html`, `eslint.config.js`, `postcss.config.js`, `tailwind.config.js`, `tsconfig.app.json`, `tsconfig.node.json`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/index.css`, `src/vite-env.d.ts`, `src/assets/`
- Keep: `src/components/`, `src/types/`, `src/utils/`, `src/data/`, `public/`, `scripts/`, `README.md`, `.git/`
- Modify: `package.json`, `tsconfig.json`, `.gitignore`
- Create: `next.config.ts`, `next-env.d.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `postcss.config.mjs`

- [ ] **Step 1: Delete Vite-specific files**

```bash
rm vite.config.ts index.html eslint.config.js postcss.config.js tailwind.config.js tsconfig.app.json tsconfig.node.json
rm src/main.tsx src/App.tsx src/App.css src/index.css src/vite-env.d.ts
rm -rf src/assets
rm -rf node_modules package-lock.json
```

- [ ] **Step 2: Replace package.json with a Next.js 16 + matching-stack package.json**

Overwrite `package.json`:

```json
{
  "name": "monster-mash",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:seed": "npx tsx src/db/seed.ts"
  },
  "dependencies": {
    "@clerk/nextjs": "^7.0.12",
    "@clerk/themes": "^2.4.57",
    "@neondatabase/serverless": "^1.0.2",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "drizzle-orm": "^0.45.2",
    "next": "16.2.3",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "drizzle-kit": "^0.31.10",
    "eslint": "^9",
    "eslint-config-next": "16.2.3",
    "tailwindcss": "^4",
    "tsx": "^4.19.0",
    "typescript": "^5"
  }
}
```

- [ ] **Step 3: Replace tsconfig.json with Next.js defaults**

Overwrite `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "src-vite-backup"]
}
```

- [ ] **Step 4: Create next.config.ts**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 5: Create next-env.d.ts**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 6: Create postcss.config.mjs for Tailwind v4**

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 7: Update .gitignore for Next.js**

Append to `.gitignore`:

```
.next
.vercel
.env*.local
next-env.d.ts
```

- [ ] **Step 8: Install dependencies**

```bash
npm install
```

Expected: clean install, no peer dep errors.

- [ ] **Step 9: Create minimal root layout at src/app/layout.tsx**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monster Mash',
  description: 'WOD tracker for Monster Mash workouts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0D0D0D] text-white min-h-screen">{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: Create placeholder src/app/page.tsx**

```tsx
export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Monster Mash — migration in progress</h1>
    </main>
  );
}
```

- [ ] **Step 11: Create src/app/globals.css with Tailwind v4 import**

```css
@import 'tailwindcss';

@theme {
  --color-mm-bg: #0D0D0D;
  --color-mm-red: #E63946;
  --color-mm-orange: #F4A261;
  --color-mm-card: #1A1A1A;
  --color-mm-border: #2A2A2A;
  --font-display: 'Barlow Condensed', system-ui, sans-serif;
  --font-barlow: 'Barlow', system-ui, sans-serif;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

- [ ] **Step 12: Start dev server and verify it boots**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: see "Monster Mash — migration in progress" on a dark background. Stop the server (Ctrl+C).

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: scaffold next.js 16 in place, remove vite"
```

---

## Task 3: Restore presentational components into the new structure

**Files:**
- Move: `src/components/*` already in place — verify
- Delete: `src/hooks/useHistory.ts`, `src/hooks/useWorkouts.ts` (they'll be replaced by server components + actions)
- Keep: `src/components/`, `src/types/`, `src/utils/`, `src/data/`

- [ ] **Step 1: Verify existing component files still exist**

```bash
ls src/components src/types src/utils src/data
```

Expected: `Header.tsx HistoryLog.tsx ...` / `workout.ts` / `converter.ts` / `workouts.json`

- [ ] **Step 2: Delete the old hooks (no longer used — data comes from the server)**

```bash
rm -rf src/hooks
```

- [ ] **Step 3: Mark each component file as a client component**

Every file in `src/components/*.tsx` needs `'use client';` at the top because they use `useState`, `useEffect`, canvas refs, or click handlers.

Add `'use client';` as the first line of each of:
- `src/components/Header.tsx`
- `src/components/HistoryLog.tsx`
- `src/components/MovementFilter.tsx`
- `src/components/SearchBar.tsx`
- `src/components/SpinWheel.tsx`
- `src/components/WorkoutCard.tsx`
- `src/components/WorkoutList.tsx`

Example for `src/components/Header.tsx`:

```tsx
'use client';

import type { FC } from 'react';
// ... rest of file unchanged
```

- [ ] **Step 4: Run a type-check to catch any broken imports**

```bash
npx tsc --noEmit
```

Expected: clean, no errors. If any component imports from `../hooks/useHistory`, fix it in the next tasks — for now leave the type error if it appears and note it.

- [ ] **Step 5: Commit**

```bash
git add src/components src/hooks
git commit -m "chore: mark existing components as client components, drop old hooks"
```

---

## Task 4: Provision Neon project and set local env

**Files:**
- Create: `.env.local` (gitignored)

**This task requires user action in the Neon dashboard.** The agent should pause here and prompt.

- [ ] **Step 1: Create a new Neon project**

In the Neon dashboard (https://console.neon.tech):
1. Click **New Project**.
2. Name: `monster-mash`.
3. Region: whatever matches the other project (likely `eu-west-2` or `aws-eu-central-1`).
4. Postgres version: latest.
5. Create.

- [ ] **Step 2: Copy the pooled connection string**

From the Neon project dashboard, copy the **Pooled connection** string (it contains `-pooler` in the hostname).

- [ ] **Step 3: Create .env.local with the connection string**

```bash
cat > .env.local <<'EOF'
DATABASE_URL="<paste pooled connection string here>"
EOF
```

Replace `<paste pooled connection string here>` with the actual string.

- [ ] **Step 4: Verify .env.local is gitignored**

```bash
git status .env.local
```

Expected: nothing — file is ignored by the `.env*.local` rule added in Task 2.

- [ ] **Step 5: Sanity-check the connection**

```bash
npx tsx -e "import { neon } from '@neondatabase/serverless'; const sql = neon(process.env.DATABASE_URL); sql\`select 1 as ok\`.then(console.log).catch((e) => { console.error(e); process.exit(1); });" 2>&1
```

Note: `npx tsx` needs env vars loaded — instead use this shell form:

```bash
node --env-file=.env.local -e "const { neon } = require('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL); sql\`select 1 as ok\`.then(r => console.log(r)).catch(e => { console.error(e); process.exit(1); });"
```

Expected: `[ { ok: 1 } ]`.

- [ ] **Step 6: Nothing to commit (env is gitignored)**

No git action required.

---

## Task 5: Define Drizzle schema

**Files:**
- Create: `src/db/schema.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Create drizzle.config.ts**

```ts
import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

- [ ] **Step 2: Install dotenv (drizzle-kit needs it for config loading)**

```bash
npm install -D dotenv
```

- [ ] **Step 3: Create src/db/schema.ts**

```ts
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  date,
  real,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teamMembers = pgTable(
  'team_members',
  {
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.teamId, t.userId] }) }),
);

export const workouts = pgTable('workouts', {
  id: text('id').primaryKey(),
  date: date('date').notNull(),
  title: text('title').notNull(),
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const segments = pgTable('segments', {
  id: serial('id').primaryKey(),
  workoutId: text('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  format: text('format').notNull(),
  description: text('description').notNull(),
});

export const movements = pgTable('movements', {
  id: serial('id').primaryKey(),
  segmentId: integer('segment_id')
    .notNull()
    .references(() => segments.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  name: text('name').notNull(),
  reps: text('reps'),
  weightKgMale: real('weight_kg_male'),
  weightKgFemale: real('weight_kg_female'),
  weightOriginal: text('weight_original'),
  equipment: text('equipment'),
});

export const personalCompletions = pgTable('personal_completions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  workoutId: text('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teamCompletions = pgTable('team_completions', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  workoutId: text('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  loggedBy: integer('logged_by').references(() => users.id),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes'),
});
```

- [ ] **Step 4: Commit**

```bash
git add drizzle.config.ts src/db/schema.ts package.json package-lock.json
git commit -m "feat: add drizzle schema for users, teams, workouts, completions"
```

---

## Task 6: Create Drizzle client and push schema to Neon

**Files:**
- Create: `src/db/index.ts`

- [ ] **Step 1: Create src/db/index.ts**

```ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export * as schema from './schema';
```

- [ ] **Step 2: Push the schema to Neon**

```bash
npm run db:push
```

Expected: `drizzle-kit` reads `drizzle.config.ts`, connects to Neon, and creates all 8 tables. Output ends with `[✓] Your SQL migration file ➜ ...` or `Everything is up-to-date`.

- [ ] **Step 3: Verify tables exist in Neon**

```bash
node --env-file=.env.local -e "const { neon } = require('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL); sql\`select table_name from information_schema.tables where table_schema='public' order by table_name\`.then(console.log);"
```

Expected: `[ { table_name: 'movements' }, { table_name: 'personal_completions' }, { table_name: 'segments' }, { table_name: 'team_completions' }, { table_name: 'team_members' }, { table_name: 'teams' }, { table_name: 'users' }, { table_name: 'workouts' } ]`

- [ ] **Step 4: Commit**

```bash
git add src/db/index.ts
git commit -m "feat: add drizzle client, push schema to neon"
```

---

## Task 7: Seed workouts from workouts.json

**Files:**
- Create: `src/db/seed.ts`

- [ ] **Step 1: Create src/db/seed.ts**

```ts
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import workoutsJson from '../data/workouts.json';

type WeightKg = { male: number; female: number };
type Movement = {
  name: string;
  reps?: string;
  weightKg?: WeightKg;
  weightOriginal?: string;
  equipment?: string;
};
type Segment = { format: string; description: string; movements: Movement[] };
type Workout = {
  id: string;
  date: string;
  title: string;
  segments: Segment[];
  movements: string[];
  sourceUrl: string;
};

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const data = workoutsJson as Workout[];
  console.log(`Seeding ${data.length} workouts...`);

  for (const w of data) {
    await db
      .insert(schema.workouts)
      .values({
        id: w.id,
        date: w.date,
        title: w.title,
        sourceUrl: w.sourceUrl,
      })
      .onConflictDoNothing();

    for (let si = 0; si < w.segments.length; si++) {
      const seg = w.segments[si];
      const [insertedSeg] = await db
        .insert(schema.segments)
        .values({
          workoutId: w.id,
          position: si,
          format: seg.format,
          description: seg.description,
        })
        .returning();

      for (let mi = 0; mi < seg.movements.length; mi++) {
        const mv = seg.movements[mi];
        await db.insert(schema.movements).values({
          segmentId: insertedSeg.id,
          position: mi,
          name: mv.name,
          reps: mv.reps ?? null,
          weightKgMale: mv.weightKg?.male ?? null,
          weightKgFemale: mv.weightKg?.female ?? null,
          weightOriginal: mv.weightOriginal ?? null,
          equipment: mv.equipment ?? null,
        });
      }
    }
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Make seed idempotent-friendly: clear segments/movements before reinserting**

At the top of `main()` (before the loop), add:

```ts
  // Wipe derived rows so re-runs don't duplicate segments/movements.
  // Workouts use onConflictDoNothing so they stay stable.
  await db.delete(schema.movements);
  await db.delete(schema.segments);
```

Full function body now begins:

```ts
async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const data = workoutsJson as Workout[];
  console.log(`Seeding ${data.length} workouts...`);

  await db.delete(schema.movements);
  await db.delete(schema.segments);

  for (const w of data) {
    // ... (rest unchanged)
```

- [ ] **Step 3: Run the seed**

```bash
npm run db:seed
```

Expected output ends with `Done.`. Runtime: 30–120 seconds depending on workout count (~619).

- [ ] **Step 4: Verify a workout landed correctly**

```bash
node --env-file=.env.local -e "const { neon } = require('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL); (async () => { const w = await sql\`select id, title from workouts order by date desc limit 1\`; const s = await sql\`select count(*)::int as n from segments\`; const m = await sql\`select count(*)::int as n from movements\`; console.log({ latest: w[0], segments: s[0].n, movements: m[0].n }); })();"
```

Expected: object showing a workout title, and non-zero segments/movements counts.

- [ ] **Step 5: Commit**

```bash
git add src/db/seed.ts
git commit -m "feat: seed workouts from workouts.json into neon"
```

---

## Task 8: Provision Clerk app and wire up provider

**Files:**
- Modify: `.env.local`
- Modify: `src/app/layout.tsx`
- Create: `middleware.ts` (at repo root)

**This task requires user action in the Clerk dashboard.**

- [ ] **Step 1: Create a Clerk application**

In the Clerk dashboard (https://dashboard.clerk.com):
1. Click **Create application**.
2. Name: `Monster Mash`.
3. Sign-in options: Email + Google (keep it simple).
4. Create.

- [ ] **Step 2: Copy the API keys**

From **API Keys** in the sidebar, copy:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

- [ ] **Step 3: Append Clerk env vars to .env.local**

```bash
cat >> .env.local <<'EOF'

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="<publishable key>"
CLERK_SECRET_KEY="<secret key>"
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/app
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
EOF
```

Replace `<publishable key>` and `<secret key>` with real values.

- [ ] **Step 4: Wrap the app in ClerkProvider**

Overwrite `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monster Mash',
  description: 'WOD tracker for Monster Mash workouts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#0D0D0D] text-white min-h-screen">{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 5: Create middleware.ts at the repo root**

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

- [ ] **Step 6: Restart dev server and verify protected routes redirect**

```bash
npm run dev
```

Visit `http://localhost:3000/app` — expected: redirect to Clerk's hosted sign-in. Sign up with a test email. After sign-in, Clerk will try to redirect to `/app` — you'll get a 404 because the route doesn't exist yet. That's fine. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add src/app/layout.tsx middleware.ts
git commit -m "feat: wire up clerk auth middleware and provider"
```

---

## Task 9: Build sign-in and sign-up pages

**Files:**
- Create: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/sign-up/[[...sign-up]]/page.tsx`

- [ ] **Step 1: Create src/app/sign-in/[[...sign-in]]/page.tsx**

```tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-4">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#E63946',
            colorBackground: '#1A1A1A',
            colorText: '#FFFFFF',
            colorTextSecondary: '#888888',
            colorInputBackground: '#0D0D0D',
            colorInputText: '#FFFFFF',
            borderRadius: '0.75rem',
          },
        }}
      />
    </main>
  );
}
```

- [ ] **Step 2: Create src/app/sign-up/[[...sign-up]]/page.tsx**

```tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-4">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: '#E63946',
            colorBackground: '#1A1A1A',
            colorText: '#FFFFFF',
            colorTextSecondary: '#888888',
            colorInputBackground: '#0D0D0D',
            colorInputText: '#FFFFFF',
            borderRadius: '0.75rem',
          },
        }}
      />
    </main>
  );
}
```

- [ ] **Step 3: Verify in the browser**

Run `npm run dev`, visit `/sign-in` and `/sign-up`. Expected: themed Clerk forms on a dark background. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/app/sign-in src/app/sign-up
git commit -m "feat: add themed clerk sign-in and sign-up pages"
```

---

## Task 10: Add auth helpers — currentUser, ensureUser, requireTeamMembership

**Files:**
- Create: `src/lib/auth.ts`

- [ ] **Step 1: Create src/lib/auth.ts**

```ts
import 'server-only';
import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, teamMembers } from '@/db/schema';
import { cache } from 'react';

export const getInternalUser = cache(async () => {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  return existing[0] ?? null;
});

export async function ensureUser(): Promise<{ id: number; displayName: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error('Not signed in');

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (existing[0]) return { id: existing[0].id, displayName: existing[0].displayName };

  const clerk = await clerkCurrentUser();
  const displayName =
    clerk?.firstName ??
    clerk?.username ??
    clerk?.emailAddresses[0]?.emailAddress ??
    'Monster';

  const [row] = await db
    .insert(users)
    .values({ clerkUserId, displayName })
    .returning();

  return { id: row.id, displayName: row.displayName };
}

export async function requireTeamMembership(userId: number, teamId: number) {
  const rows = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
    .limit(1);

  if (!rows[0]) throw new Error('Not a member of this team');
}
```

- [ ] **Step 2: Install server-only**

```bash
npm install server-only
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts package.json package-lock.json
git commit -m "feat: add auth helpers getInternalUser, ensureUser, requireTeamMembership"
```

---

## Task 11: Add mode cookie helpers (Solo / Team)

**Files:**
- Create: `src/lib/mode.ts`

- [ ] **Step 1: Create src/lib/mode.ts**

```ts
import 'server-only';
import { cookies } from 'next/headers';

export type Mode = { kind: 'solo' } | { kind: 'team'; teamId: number };

const COOKIE_NAME = 'mm_mode';

export async function getMode(): Promise<Mode> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw || raw === 'solo') return { kind: 'solo' };
  if (raw.startsWith('team:')) {
    const teamId = Number(raw.slice(5));
    if (Number.isFinite(teamId)) return { kind: 'team', teamId };
  }
  return { kind: 'solo' };
}

export async function setModeCookie(mode: Mode): Promise<void> {
  const jar = await cookies();
  const value = mode.kind === 'solo' ? 'solo' : `team:${mode.teamId}`;
  jar.set(COOKIE_NAME, value, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/mode.ts
git commit -m "feat: add mode cookie helpers for solo vs team"
```

---

## Task 12: Query helpers — listWorkouts, getSpinPool, history

**Files:**
- Create: `src/lib/queries/workouts.ts`
- Create: `src/lib/queries/history.ts`

- [ ] **Step 1: Create src/lib/queries/workouts.ts**

```ts
import 'server-only';
import { and, asc, desc, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { workouts, segments, movements, personalCompletions, teamCompletions } from '@/db/schema';
import type { Mode } from '@/lib/mode';

export type HydratedWorkout = {
  id: string;
  date: string;
  title: string;
  sourceUrl: string | null;
  segments: {
    format: string;
    description: string;
    movements: {
      name: string;
      reps: string | null;
      weightKg: { male: number; female: number } | null;
      weightOriginal: string | null;
      equipment: string | null;
    }[];
  }[];
  movementNames: string[];
};

async function hydrate(rows: typeof workouts.$inferSelect[]): Promise<HydratedWorkout[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const segRows = await db
    .select()
    .from(segments)
    .where(inArray(segments.workoutId, ids))
    .orderBy(asc(segments.workoutId), asc(segments.position));

  const segIds = segRows.map((s) => s.id);
  const mvRows =
    segIds.length === 0
      ? []
      : await db
          .select()
          .from(movements)
          .where(inArray(movements.segmentId, segIds))
          .orderBy(asc(movements.segmentId), asc(movements.position));

  const mvBySeg = new Map<number, typeof mvRows>();
  for (const m of mvRows) {
    const arr = mvBySeg.get(m.segmentId) ?? [];
    arr.push(m);
    mvBySeg.set(m.segmentId, arr);
  }

  const segByWorkout = new Map<string, typeof segRows>();
  for (const s of segRows) {
    const arr = segByWorkout.get(s.workoutId) ?? [];
    arr.push(s);
    segByWorkout.set(s.workoutId, arr);
  }

  return rows.map((w) => {
    const ws = segByWorkout.get(w.id) ?? [];
    const hydratedSegments = ws.map((s) => {
      const mvs = mvBySeg.get(s.id) ?? [];
      return {
        format: s.format,
        description: s.description,
        movements: mvs.map((m) => ({
          name: m.name,
          reps: m.reps,
          weightKg:
            m.weightKgMale != null && m.weightKgFemale != null
              ? { male: m.weightKgMale, female: m.weightKgFemale }
              : null,
          weightOriginal: m.weightOriginal,
          equipment: m.equipment,
        })),
      };
    });
    const movementNames = Array.from(
      new Set(hydratedSegments.flatMap((s) => s.movements.map((m) => m.name))),
    ).sort();
    return {
      id: w.id,
      date: w.date,
      title: w.title,
      sourceUrl: w.sourceUrl,
      segments: hydratedSegments,
      movementNames,
    };
  });
}

export async function listAllWorkouts(): Promise<HydratedWorkout[]> {
  const rows = await db.select().from(workouts).orderBy(desc(workouts.date));
  return hydrate(rows);
}

export async function getSpinPool(userId: number, mode: Mode): Promise<HydratedWorkout[]> {
  const excluded = new Set<string>();

  const personal = await db
    .select({ workoutId: personalCompletions.workoutId })
    .from(personalCompletions)
    .where(eq(personalCompletions.userId, userId));
  for (const r of personal) excluded.add(r.workoutId);

  if (mode.kind === 'team') {
    const team = await db
      .select({ workoutId: teamCompletions.workoutId })
      .from(teamCompletions)
      .where(eq(teamCompletions.teamId, mode.teamId));
    for (const r of team) excluded.add(r.workoutId);
  }

  const excludeList = Array.from(excluded);
  const rows =
    excludeList.length === 0
      ? await db.select().from(workouts).orderBy(desc(workouts.date))
      : await db
          .select()
          .from(workouts)
          .where(notInArray(workouts.id, excludeList))
          .orderBy(desc(workouts.date));

  return hydrate(rows);
}

export async function getCompletedWorkoutIds(userId: number, mode: Mode): Promise<Set<string>> {
  const ids = new Set<string>();

  const personal = await db
    .select({ workoutId: personalCompletions.workoutId })
    .from(personalCompletions)
    .where(eq(personalCompletions.userId, userId));
  for (const r of personal) ids.add(r.workoutId);

  if (mode.kind === 'team') {
    const team = await db
      .select({ workoutId: teamCompletions.workoutId })
      .from(teamCompletions)
      .where(eq(teamCompletions.teamId, mode.teamId));
    for (const r of team) ids.add(r.workoutId);
  }

  return ids;
}
```

- [ ] **Step 2: Create src/lib/queries/history.ts**

```ts
import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { personalCompletions, teamCompletions, users } from '@/db/schema';

export async function getPersonalHistory(userId: number) {
  return db
    .select({
      id: personalCompletions.id,
      workoutId: personalCompletions.workoutId,
      completedAt: personalCompletions.completedAt,
    })
    .from(personalCompletions)
    .where(eq(personalCompletions.userId, userId))
    .orderBy(desc(personalCompletions.completedAt));
}

export async function getTeamHistory(teamId: number) {
  return db
    .select({
      id: teamCompletions.id,
      workoutId: teamCompletions.workoutId,
      completedAt: teamCompletions.completedAt,
      notes: teamCompletions.notes,
      loggedByName: users.displayName,
    })
    .from(teamCompletions)
    .leftJoin(users, eq(users.id, teamCompletions.loggedBy))
    .where(eq(teamCompletions.teamId, teamId))
    .orderBy(desc(teamCompletions.completedAt));
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/queries
git commit -m "feat: add workout and history query helpers"
```

---

## Task 13: Server actions — completions

**Files:**
- Create: `src/lib/actions/completions.ts`

- [ ] **Step 1: Create src/lib/actions/completions.ts**

```ts
'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { personalCompletions, teamCompletions } from '@/db/schema';
import { ensureUser, requireTeamMembership } from '@/lib/auth';
import { getMode } from '@/lib/mode';

export async function markComplete(workoutId: string): Promise<void> {
  const user = await ensureUser();
  const mode = await getMode();

  if (mode.kind === 'solo') {
    await db.insert(personalCompletions).values({ userId: user.id, workoutId });
  } else {
    await requireTeamMembership(user.id, mode.teamId);
    await db.insert(teamCompletions).values({
      teamId: mode.teamId,
      workoutId,
      loggedBy: user.id,
    });
  }

  revalidatePath('/app');
  revalidatePath('/app/spin');
  revalidatePath('/app/history');
}

export async function unmarkComplete(workoutId: string): Promise<void> {
  const user = await ensureUser();
  const mode = await getMode();

  if (mode.kind === 'solo') {
    await db
      .delete(personalCompletions)
      .where(
        and(
          eq(personalCompletions.userId, user.id),
          eq(personalCompletions.workoutId, workoutId),
        ),
      );
  } else {
    await requireTeamMembership(user.id, mode.teamId);
    await db
      .delete(teamCompletions)
      .where(
        and(
          eq(teamCompletions.teamId, mode.teamId),
          eq(teamCompletions.workoutId, workoutId),
        ),
      );
  }

  revalidatePath('/app');
  revalidatePath('/app/spin');
  revalidatePath('/app/history');
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/completions.ts
git commit -m "feat: add mark/unmark completion server actions"
```

---

## Task 14: Server actions — teams & mode

**Files:**
- Create: `src/lib/actions/teams.ts`
- Create: `src/lib/actions/mode.ts`
- Create: `src/lib/invite-code.ts`

- [ ] **Step 1: Create src/lib/invite-code.ts**

```ts
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

export function generateInviteCode(): string {
  let out = 'MMASH-';
  for (let i = 0; i < 5; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}
```

- [ ] **Step 2: Create src/lib/actions/teams.ts**

```ts
'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { teams, teamMembers } from '@/db/schema';
import { ensureUser } from '@/lib/auth';
import { generateInviteCode } from '@/lib/invite-code';
import { setModeCookie } from '@/lib/mode';

export async function createTeam(name: string): Promise<{ id: number; inviteCode: string }> {
  const user = await ensureUser();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Team name is required');

  let inviteCode = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const clash = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.inviteCode, inviteCode))
      .limit(1);
    if (!clash[0]) break;
    inviteCode = generateInviteCode();
  }

  const [team] = await db
    .insert(teams)
    .values({ name: trimmed, inviteCode, createdBy: user.id })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner',
  });

  await setModeCookie({ kind: 'team', teamId: team.id });
  revalidatePath('/app/teams');
  return { id: team.id, inviteCode };
}

export async function joinTeamByCode(code: string): Promise<{ id: number; name: string }> {
  const user = await ensureUser();
  const normalised = code.trim().toUpperCase();

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.inviteCode, normalised))
    .limit(1);
  if (!team) throw new Error('Invite code not found');

  const existing = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, user.id)))
    .limit(1);

  if (!existing[0]) {
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: user.id,
      role: 'member',
    });
  }

  await setModeCookie({ kind: 'team', teamId: team.id });
  revalidatePath('/app/teams');
  return { id: team.id, name: team.name };
}

export async function listMyTeams(): Promise<{ id: number; name: string; inviteCode: string; role: string }[]> {
  const user = await ensureUser();
  return db
    .select({
      id: teams.id,
      name: teams.name,
      inviteCode: teams.inviteCode,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, user.id));
}
```

- [ ] **Step 3: Create src/lib/actions/mode.ts**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { ensureUser, requireTeamMembership } from '@/lib/auth';
import { setModeCookie, type Mode } from '@/lib/mode';

export async function setMode(mode: Mode): Promise<void> {
  const user = await ensureUser();
  if (mode.kind === 'team') {
    await requireTeamMembership(user.id, mode.teamId);
  }
  await setModeCookie(mode);
  revalidatePath('/app');
  revalidatePath('/app/spin');
  revalidatePath('/app/history');
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "feat: add team server actions and mode setter"
```

---

## Task 15: Onboarding page

**Files:**
- Create: `src/app/onboarding/page.tsx`
- Create: `src/app/onboarding/OnboardingForm.tsx`
- Modify: `middleware.ts` (add onboarding redirect)

- [ ] **Step 1: Update middleware.ts to redirect users without a users row to /onboarding**

Overwrite `middleware.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return (await auth()).redirectToSignIn({ returnBackUrl: req.url });
  }

  // Clerk claim "metadata.onboarded" is set after onboarding completes.
  const onboarded = (sessionClaims?.publicMetadata as { onboarded?: boolean } | undefined)?.onboarded;

  if (!onboarded && !isOnboardingRoute(req)) {
    const url = new URL('/onboarding', req.url);
    return NextResponse.redirect(url);
  }

  if (onboarded && isOnboardingRoute(req)) {
    const url = new URL('/app', req.url);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

- [ ] **Step 2: Create src/app/onboarding/page.tsx**

```tsx
import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import OnboardingForm from './OnboardingForm';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const clerk = await currentUser();
  const defaultName =
    clerk?.firstName ??
    clerk?.username ??
    clerk?.emailAddresses[0]?.emailAddress?.split('@')[0] ??
    '';

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-900 uppercase tracking-tight">
            <span className="text-[#E63946]">Welcome</span>
          </h1>
          <p className="text-sm text-[#888] mt-1">
            Pick a name and either create a team or join one with an invite code. You can
            also skip and track workouts solo.
          </p>
        </div>
        <OnboardingForm defaultName={defaultName} />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create src/app/onboarding/OnboardingForm.tsx**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completeOnboarding } from './actions';

type Choice = 'create' | 'join' | 'solo';

export default function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [choice, setChoice] = useState<Choice>('solo');
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        await completeOnboarding({
          displayName: name.trim(),
          choice,
          teamName: teamName.trim(),
          inviteCode: inviteCode.trim(),
        });
        router.push('/app');
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const btnBase =
    'px-4 py-2 rounded-lg font-display font-700 uppercase tracking-widest text-xs border transition-colors';
  const btnActive = 'bg-[#E63946] border-[#E63946] text-white';
  const btnIdle = 'bg-transparent border-[#2A2A2A] text-[#888] hover:border-[#E63946]/40';

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="font-display text-[10px] font-700 uppercase tracking-widest text-[#888]">
          Display name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:border-[#E63946] outline-none"
          placeholder="Liam"
        />
      </label>

      <div className="flex gap-2">
        <button onClick={() => setChoice('solo')} className={`${btnBase} ${choice === 'solo' ? btnActive : btnIdle}`}>Solo</button>
        <button onClick={() => setChoice('create')} className={`${btnBase} ${choice === 'create' ? btnActive : btnIdle}`}>Create team</button>
        <button onClick={() => setChoice('join')} className={`${btnBase} ${choice === 'join' ? btnActive : btnIdle}`}>Join team</button>
      </div>

      {choice === 'create' && (
        <label className="block">
          <span className="font-display text-[10px] font-700 uppercase tracking-widest text-[#888]">
            Team name
          </span>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:border-[#E63946] outline-none"
            placeholder="The Monsters"
          />
        </label>
      )}

      {choice === 'join' && (
        <label className="block">
          <span className="font-display text-[10px] font-700 uppercase tracking-widest text-[#888]">
            Invite code
          </span>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:border-[#E63946] outline-none"
            placeholder="MMASH-XXXXX"
          />
        </label>
      )}

      {error && <p className="text-sm text-[#E63946]">{error}</p>}

      <button
        onClick={submit}
        disabled={isPending || !name.trim() || (choice === 'create' && !teamName.trim()) || (choice === 'join' && !inviteCode.trim())}
        className="w-full py-3 rounded-lg bg-[#E63946] text-white font-display font-900 uppercase tracking-widest text-sm disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {isPending ? 'Finishing...' : 'Get started'}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create src/app/onboarding/actions.ts**

```ts
'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { createTeam, joinTeamByCode } from '@/lib/actions/teams';

type Input = {
  displayName: string;
  choice: 'solo' | 'create' | 'join';
  teamName: string;
  inviteCode: string;
};

export async function completeOnboarding(input: Input): Promise<void> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error('Not signed in');
  if (!input.displayName) throw new Error('Display name required');

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(users)
      .set({ displayName: input.displayName })
      .where(eq(users.clerkUserId, clerkUserId));
  } else {
    await db.insert(users).values({ clerkUserId, displayName: input.displayName });
  }

  if (input.choice === 'create') {
    await createTeam(input.teamName);
  } else if (input.choice === 'join') {
    await joinTeamByCode(input.inviteCode);
  }

  const clerk = await clerkClient();
  await clerk.users.updateUser(clerkUserId, {
    publicMetadata: { onboarded: true },
  });
}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 6: Manual smoke test**

```bash
npm run dev
```

Visit `/app` as a fresh signed-in user — expected: redirected to `/onboarding`. Complete the form (try "Solo"). Expected: redirected to `/app` (which 404s for now — that's fine). Stop the server.

- [ ] **Step 7: Commit**

```bash
git add middleware.ts src/app/onboarding
git commit -m "feat: add onboarding flow with solo/create/join options"
```

---

## Task 16: App shell layout with tabs and mode switcher

**Files:**
- Create: `src/app/app/layout.tsx`
- Create: `src/app/app/AppHeader.tsx`

- [ ] **Step 1: Create src/app/app/AppHeader.tsx**

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { UserButton } from '@clerk/nextjs';
import { setMode } from '@/lib/actions/mode';

type Team = { id: number; name: string };
type Props = {
  teams: Team[];
  currentMode: 'solo' | { teamId: number };
};

const TABS = [
  { href: '/app', label: 'Workouts' },
  { href: '/app/spin', label: 'Spin' },
  { href: '/app/history', label: 'History' },
  { href: '/app/teams', label: 'Teams' },
];

export default function AppHeader({ teams, currentMode }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    startTransition(async () => {
      if (value === 'solo') {
        await setMode({ kind: 'solo' });
      } else {
        await setMode({ kind: 'team', teamId: Number(value) });
      }
      router.refresh();
    });
  };

  const selectValue = currentMode === 'solo' ? 'solo' : String(currentMode.teamId);

  return (
    <header className="sticky top-0 z-50 bg-[#0D0D0D] border-b border-[#2A2A2A]">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-3xl font-900 tracking-tight leading-none">
            <span className="text-[#E63946]">MONSTER</span>
            <span className="text-white ml-2">MASH</span>
          </h1>
          <span className="text-[#F4A261] text-xl leading-none" aria-hidden>⚡</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectValue}
            onChange={handleModeChange}
            disabled={isPending}
            className="bg-[#1A1A1A] border border-[#2A2A2A] text-white font-display text-xs font-700 uppercase tracking-widest rounded-md px-2 py-1"
          >
            <option value="solo">Solo</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <nav className="flex px-4">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                'relative py-3 mr-6 font-display text-sm font-700 uppercase tracking-widest transition-colors duration-150',
                isActive ? 'text-white' : 'text-[#555] hover:text-[#888]',
              ].join(' ')}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#E63946] to-[#F4A261] rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Create src/app/app/layout.tsx**

```tsx
import { listMyTeams } from '@/lib/actions/teams';
import { getMode } from '@/lib/mode';
import AppHeader from './AppHeader';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const teams = await listMyTeams();
  const mode = await getMode();
  const headerMode = mode.kind === 'solo' ? ('solo' as const) : { teamId: mode.teamId };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <AppHeader teams={teams.map((t) => ({ id: t.id, name: t.name }))} currentMode={headerMode} />
      <main className="px-4 py-5 max-w-2xl mx-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/app
git commit -m "feat: add app shell layout with tabs and mode switcher"
```

---

## Task 17: Workouts tab (list with search and filter)

**Files:**
- Create: `src/app/app/page.tsx`
- Create: `src/app/app/WorkoutsTab.tsx`

- [ ] **Step 1: Create src/app/app/page.tsx**

```tsx
import { ensureUser } from '@/lib/auth';
import { getMode } from '@/lib/mode';
import { listAllWorkouts, getCompletedWorkoutIds } from '@/lib/queries/workouts';
import WorkoutsTab from './WorkoutsTab';

export default async function WorkoutsPage() {
  const user = await ensureUser();
  const mode = await getMode();
  const [workouts, completedIds] = await Promise.all([
    listAllWorkouts(),
    getCompletedWorkoutIds(user.id, mode),
  ]);

  return <WorkoutsTab workouts={workouts} completedIds={Array.from(completedIds)} />;
}
```

- [ ] **Step 2: Create src/app/app/WorkoutsTab.tsx**

```tsx
'use client';

import { useMemo, useState, useTransition, useOptimistic } from 'react';
import SearchBar from '@/components/SearchBar';
import MovementFilter from '@/components/MovementFilter';
import WorkoutList from '@/components/WorkoutList';
import { markComplete, unmarkComplete } from '@/lib/actions/completions';
import type { HydratedWorkout } from '@/lib/queries/workouts';
import type { Workout } from '@/types/workout';

type Props = {
  workouts: HydratedWorkout[];
  completedIds: string[];
};

function toLegacy(w: HydratedWorkout): Workout {
  return {
    id: w.id,
    date: w.date,
    title: w.title,
    sourceUrl: w.sourceUrl ?? '',
    segments: w.segments.map((s) => ({
      format: s.format,
      description: s.description,
      movements: s.movements.map((m) => ({
        name: m.name,
        reps: m.reps ?? undefined,
        weightKg: m.weightKg ?? undefined,
        weightOriginal: m.weightOriginal ?? undefined,
        equipment: m.equipment ?? undefined,
      })),
    })),
    movements: w.movementNames,
  };
}

export default function WorkoutsTab({ workouts, completedIds }: Props) {
  const [search, setSearch] = useState('');
  const [selectedMovements, setSelectedMovements] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    new Set(completedIds),
    (current: Set<string>, action: { kind: 'mark' | 'unmark'; id: string }) => {
      const next = new Set(current);
      if (action.kind === 'mark') next.add(action.id);
      else next.delete(action.id);
      return next;
    },
  );

  const legacy = useMemo(() => workouts.map(toLegacy), [workouts]);
  const allMovements = useMemo(() => {
    const set = new Set<string>();
    workouts.forEach((w) => w.movementNames.forEach((m) => set.add(m)));
    return Array.from(set).sort();
  }, [workouts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return legacy.filter((w) => {
      if (q) {
        const inTitle = w.title.toLowerCase().includes(q);
        const inSegments = w.segments.some((s) => s.description.toLowerCase().includes(q));
        if (!inTitle && !inSegments) return false;
      }
      if (selectedMovements.length > 0) {
        const wMovements = w.movements.map((m) => m.toLowerCase());
        const allMatch = selectedMovements.every((m) =>
          wMovements.some((wm) => wm.includes(m.toLowerCase())),
        );
        if (!allMatch) return false;
      }
      return true;
    });
  }, [search, selectedMovements, legacy]);

  const handleMark = (id: string) => {
    startTransition(async () => {
      setOptimisticCompleted({ kind: 'mark', id });
      await markComplete(id);
    });
  };

  const handleUnmark = (id: string) => {
    startTransition(async () => {
      setOptimisticCompleted({ kind: 'unmark', id });
      await unmarkComplete(id);
    });
  };

  const toggleMovement = (m: string) =>
    setSelectedMovements((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} />
      {allMovements.length > 0 && (
        <MovementFilter
          movements={allMovements}
          selected={selectedMovements}
          onToggle={toggleMovement}
          onClear={() => setSelectedMovements([])}
        />
      )}
      <WorkoutList
        workouts={filtered}
        isCompleted={(id) => optimisticCompleted.has(id)}
        onMarkComplete={handleMark}
        onUnmark={handleUnmark}
      />
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Smoke test the Workouts tab**

```bash
npm run dev
```

Sign in, complete onboarding (solo). Expected: `/app` shows the full workout list using the existing WorkoutCard. Tick a workout — expected: instant tick, persists after a refresh. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/app/app/page.tsx src/app/app/WorkoutsTab.tsx
git commit -m "feat: workouts tab with server-backed completion toggles"
```

---

## Task 18: Spin tab

**Files:**
- Create: `src/app/app/spin/page.tsx`
- Create: `src/app/app/spin/SpinTab.tsx`

- [ ] **Step 1: Create src/app/app/spin/page.tsx**

```tsx
import { ensureUser } from '@/lib/auth';
import { getMode } from '@/lib/mode';
import { getSpinPool, listAllWorkouts } from '@/lib/queries/workouts';
import SpinTab from './SpinTab';

export default async function SpinPage() {
  const user = await ensureUser();
  const mode = await getMode();
  const [pool, all] = await Promise.all([getSpinPool(user.id, mode), listAllWorkouts()]);
  return <SpinTab pool={pool} totalCount={all.length} />;
}
```

- [ ] **Step 2: Create src/app/app/spin/SpinTab.tsx**

```tsx
'use client';

import { useMemo, useOptimistic, useTransition } from 'react';
import SpinWheel from '@/components/SpinWheel';
import { markComplete, unmarkComplete } from '@/lib/actions/completions';
import type { HydratedWorkout } from '@/lib/queries/workouts';
import type { Workout } from '@/types/workout';

function toLegacy(w: HydratedWorkout): Workout {
  return {
    id: w.id,
    date: w.date,
    title: w.title,
    sourceUrl: w.sourceUrl ?? '',
    segments: w.segments.map((s) => ({
      format: s.format,
      description: s.description,
      movements: s.movements.map((m) => ({
        name: m.name,
        reps: m.reps ?? undefined,
        weightKg: m.weightKg ?? undefined,
        weightOriginal: m.weightOriginal ?? undefined,
        equipment: m.equipment ?? undefined,
      })),
    })),
    movements: w.movementNames,
  };
}

type Props = { pool: HydratedWorkout[]; totalCount: number };

export default function SpinTab({ pool, totalCount }: Props) {
  const legacy = useMemo(() => pool.map(toLegacy), [pool]);
  const [, startTransition] = useTransition();
  const [completed, setCompleted] = useOptimistic(
    new Set<string>(),
    (set: Set<string>, action: { kind: 'mark' | 'unmark'; id: string }) => {
      const next = new Set(set);
      if (action.kind === 'mark') next.add(action.id);
      else next.delete(action.id);
      return next;
    },
  );

  const handleMark = (id: string) => {
    startTransition(async () => {
      setCompleted({ kind: 'mark', id });
      await markComplete(id);
    });
  };
  const handleUnmark = (id: string) => {
    startTransition(async () => {
      setCompleted({ kind: 'unmark', id });
      await unmarkComplete(id);
    });
  };

  const excluded = totalCount - pool.length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl font-900 uppercase tracking-widest text-white mb-1">
          Spin the Wheel
        </h2>
        <p className="text-sm text-[#555]">
          {pool.length} workouts in the pool
          {excluded > 0 && <span className="text-[#444]"> · {excluded} already done</span>}
        </p>
      </div>
      <SpinWheel
        workouts={legacy}
        onSelect={() => {}}
        isCompleted={(id) => completed.has(id)}
        onMarkComplete={handleMark}
        onUnmark={handleUnmark}
      />
    </div>
  );
}
```

- [ ] **Step 3: Smoke test**

```bash
npm run dev
```

Visit `/app/spin`. Expected: wheel renders, pool count matches total. Spin — expected: picks a random workout and shows a WorkoutCard. Mark it complete, go back to `/app/spin` — expected: pool count drops by 1. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/app/app/spin
git commit -m "feat: spin tab with server-filtered pool"
```

---

## Task 19: History tab

**Files:**
- Create: `src/app/app/history/page.tsx`
- Create: `src/app/app/history/HistoryTab.tsx`

- [ ] **Step 1: Create src/app/app/history/page.tsx**

```tsx
import { ensureUser } from '@/lib/auth';
import { getMode } from '@/lib/mode';
import { listAllWorkouts } from '@/lib/queries/workouts';
import { getPersonalHistory, getTeamHistory } from '@/lib/queries/history';
import HistoryTab from './HistoryTab';

export default async function HistoryPage() {
  const user = await ensureUser();
  const mode = await getMode();
  const all = await listAllWorkouts();

  if (mode.kind === 'solo') {
    const history = await getPersonalHistory(user.id);
    return (
      <HistoryTab
        workouts={all}
        entries={history.map((h) => ({
          id: String(h.id),
          workoutId: h.workoutId,
          completedAt: h.completedAt.toISOString(),
          label: 'Solo',
        }))}
        mode="solo"
      />
    );
  }

  const history = await getTeamHistory(mode.teamId);
  return (
    <HistoryTab
      workouts={all}
      entries={history.map((h) => ({
        id: String(h.id),
        workoutId: h.workoutId,
        completedAt: h.completedAt.toISOString(),
        label: h.loggedByName ?? 'Team',
        notes: h.notes ?? undefined,
      }))}
      mode="team"
    />
  );
}
```

- [ ] **Step 2: Create src/app/app/history/HistoryTab.tsx**

```tsx
'use client';

import { useMemo, useTransition } from 'react';
import HistoryLog from '@/components/HistoryLog';
import { unmarkComplete } from '@/lib/actions/completions';
import type { HydratedWorkout } from '@/lib/queries/workouts';
import type { Workout, CompletedWorkout } from '@/types/workout';

type Entry = {
  id: string;
  workoutId: string;
  completedAt: string;
  label: string;
  notes?: string;
};

type Props = {
  workouts: HydratedWorkout[];
  entries: Entry[];
  mode: 'solo' | 'team';
};

function toLegacy(w: HydratedWorkout): Workout {
  return {
    id: w.id,
    date: w.date,
    title: w.title,
    sourceUrl: w.sourceUrl ?? '',
    segments: w.segments.map((s) => ({
      format: s.format,
      description: s.description,
      movements: s.movements.map((m) => ({
        name: m.name,
        reps: m.reps ?? undefined,
        weightKg: m.weightKg ?? undefined,
        weightOriginal: m.weightOriginal ?? undefined,
        equipment: m.equipment ?? undefined,
      })),
    })),
    movements: w.movementNames,
  };
}

export default function HistoryTab({ workouts, entries, mode }: Props) {
  const legacy = useMemo(() => workouts.map(toLegacy), [workouts]);
  const [, startTransition] = useTransition();

  const history: CompletedWorkout[] = entries.map((e) => ({
    workoutId: e.workoutId,
    completedAt: e.completedAt,
  }));

  const handleUnmark = (workoutId: string) => {
    startTransition(async () => {
      await unmarkComplete(workoutId);
    });
  };

  return (
    <div className="space-y-4">
      <div className="font-display text-[10px] font-700 uppercase tracking-widest text-[#888]">
        {mode === 'solo' ? 'Your personal history' : 'Team session log'}
      </div>
      <HistoryLog history={history} allWorkouts={legacy} onUnmark={handleUnmark} />
    </div>
  );
}
```

- [ ] **Step 3: Smoke test**

```bash
npm run dev
```

Visit `/app/history`. Expected: shows completed workouts with stats. Unmarking — expected: disappears. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/app/app/history
git commit -m "feat: history tab backed by server queries"
```

---

## Task 20: Teams page (create / join / show invite code)

**Files:**
- Create: `src/app/app/teams/page.tsx`
- Create: `src/app/app/teams/TeamsPanel.tsx`

- [ ] **Step 1: Create src/app/app/teams/page.tsx**

```tsx
import { listMyTeams } from '@/lib/actions/teams';
import TeamsPanel from './TeamsPanel';

export default async function TeamsPage() {
  const teams = await listMyTeams();
  return <TeamsPanel teams={teams} />;
}
```

- [ ] **Step 2: Create src/app/app/teams/TeamsPanel.tsx**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTeam, joinTeamByCode } from '@/lib/actions/teams';

type Team = { id: number; name: string; inviteCode: string; role: string };

export default function TeamsPanel({ teams }: { teams: Team[] }) {
  const [newName, setNewName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      try {
        await createTeam(newName);
        setNewName('');
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const handleJoin = () => {
    setError(null);
    startTransition(async () => {
      try {
        await joinTeamByCode(code);
        setCode('');
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-lg font-800 uppercase tracking-widest text-white mb-3">
          Your teams
        </h2>
        {teams.length === 0 ? (
          <p className="text-sm text-[#555]">No teams yet. Create one or join with a code below.</p>
        ) : (
          <div className="space-y-2">
            {teams.map((t) => (
              <div key={t.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-display font-800 text-white">{t.name}</div>
                  <div className="font-display text-[10px] font-700 uppercase tracking-widest text-[#555] mt-0.5">
                    {t.role}
                  </div>
                </div>
                <div className="font-mono text-xs text-[#F4A261] bg-[#F4A261]/10 px-3 py-1.5 rounded-lg select-all">
                  {t.inviteCode}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
        <h3 className="font-display text-sm font-800 uppercase tracking-widest text-white">
          Create a team
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="The Monsters"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:border-[#E63946] outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={isPending || !newName.trim()}
            className="px-4 py-2 rounded-lg bg-[#E63946] text-white font-display font-800 uppercase tracking-widest text-xs disabled:opacity-30"
          >
            Create
          </button>
        </div>
      </section>

      <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
        <h3 className="font-display text-sm font-800 uppercase tracking-widest text-white">
          Join a team
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="MMASH-XXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="flex-1 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:border-[#E63946] outline-none font-mono"
          />
          <button
            onClick={handleJoin}
            disabled={isPending || !code.trim()}
            className="px-4 py-2 rounded-lg bg-[#F4A261] text-[#0D0D0D] font-display font-800 uppercase tracking-widest text-xs disabled:opacity-30"
          >
            Join
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-[#E63946]">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Smoke test**

```bash
npm run dev
```

Visit `/app/teams`. Create a team — expected: row appears with invite code. Sign in as a second test user (incognito), go to `/app/teams`, paste the code, join — expected: team appears in mode switcher. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/app/app/teams
git commit -m "feat: teams page with create and join flows"
```

---

## Task 21: Delete legacy landing page and redirect root to /app

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Overwrite src/app/page.tsx**

```tsx
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect('/app');
  redirect('/sign-in');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redirect root to /app or /sign-in"
```

---

## Task 22: Update scrape.js to write to Neon

**Files:**
- Modify: `scripts/scrape.js`
- Create: `scripts/upsert-workout.ts` (small helper imported from scrape)

- [ ] **Step 1: Read the current scrape.js to understand its output shape**

```bash
head -60 scripts/scrape.js
```

Note the data structure it produces per workout — it should match the `Workout` type. The current script writes to `src/data/workouts.json`.

- [ ] **Step 2: Create scripts/upsert-workout.ts**

```ts
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';

type Workout = {
  id: string;
  date: string;
  title: string;
  sourceUrl: string;
  segments: {
    format: string;
    description: string;
    movements: {
      name: string;
      reps?: string;
      weightKg?: { male: number; female: number };
      weightOriginal?: string;
      equipment?: string;
    }[];
  }[];
};

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export async function upsertWorkout(w: Workout) {
  await db
    .insert(schema.workouts)
    .values({ id: w.id, date: w.date, title: w.title, sourceUrl: w.sourceUrl })
    .onConflictDoUpdate({
      target: schema.workouts.id,
      set: { date: w.date, title: w.title, sourceUrl: w.sourceUrl },
    });

  // Wipe and re-insert segments/movements for this workout (cascade takes movements)
  await db.delete(schema.segments).where(eq(schema.segments.workoutId, w.id));

  for (let si = 0; si < w.segments.length; si++) {
    const seg = w.segments[si];
    const [insertedSeg] = await db
      .insert(schema.segments)
      .values({
        workoutId: w.id,
        position: si,
        format: seg.format,
        description: seg.description,
      })
      .returning();

    for (let mi = 0; mi < seg.movements.length; mi++) {
      const mv = seg.movements[mi];
      await db.insert(schema.movements).values({
        segmentId: insertedSeg.id,
        position: mi,
        name: mv.name,
        reps: mv.reps ?? null,
        weightKgMale: mv.weightKg?.male ?? null,
        weightKgFemale: mv.weightKg?.female ?? null,
        weightOriginal: mv.weightOriginal ?? null,
        equipment: mv.equipment ?? null,
      });
    }
  }
}
```

- [ ] **Step 3: Modify scripts/scrape.js to also call upsertWorkout**

Find the part of `scripts/scrape.js` where it writes to `src/data/workouts.json` (at the end of the main function). **Keep the JSON write** (it stays as a backup/seed source) and add a call to the DB upsert after it:

```js
// At the top of scripts/scrape.js, near other imports:
// (scrape.js is CJS/ESM JavaScript — check which; add import accordingly)

// If scrape.js is ESM:
// import { upsertWorkout } from './upsert-workout.js';

// After the JSON file is written, add:
const { upsertWorkout } = await import('../dist-scripts/upsert-workout.js').catch(() => ({ upsertWorkout: null }));
if (upsertWorkout) {
  console.log('Upserting workouts to Neon...');
  for (const w of allWorkouts) {
    try {
      await upsertWorkout(w);
    } catch (e) {
      console.error('Failed to upsert', w.id, e);
    }
  }
  console.log('Done.');
} else {
  console.warn('Skipping DB upsert — run `npx tsx scripts/sync-to-db.ts` manually');
}
```

**Important:** the exact integration point depends on what `scrape.js` looks like. If it's plain CJS and adding tsx feels heavy, create instead a standalone `scripts/sync-to-db.ts` that reads `src/data/workouts.json` and calls `upsertWorkout` on each — call it as a separate npm script. Choose whichever is simpler when executing.

- [ ] **Step 4: Simpler alternative — add a standalone sync script**

Create `scripts/sync-to-db.ts`:

```ts
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { upsertWorkout } from './upsert-workout';

async function main() {
  const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'workouts.json'), 'utf8');
  const workouts = JSON.parse(raw);
  console.log(`Syncing ${workouts.length} workouts to Neon...`);
  for (const w of workouts) {
    await upsertWorkout(w);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Add script to `package.json`:

```json
"db:sync": "npx tsx scripts/sync-to-db.ts"
```

- [ ] **Step 5: Test the sync script**

```bash
npm run db:sync
```

Expected: ends with `Done.`, no errors.

- [ ] **Step 6: Commit**

```bash
git add scripts/upsert-workout.ts scripts/sync-to-db.ts package.json
git commit -m "feat: add db:sync script to upsert workouts into neon"
```

---

## Task 23: Deploy to Vercel

**Files:**
- Create: GitHub repo (if not already remote)

- [ ] **Step 1: Confirm remote exists**

```bash
git remote -v
```

If a remote exists, skip to Step 3. Otherwise continue to Step 2.

- [ ] **Step 2: Create GitHub repo and push**

```bash
gh repo create monster-mash --private --source=. --remote=origin
git push -u origin feat/neon-migration
```

- [ ] **Step 3: Merge branch to main**

```bash
git checkout main
git merge --no-ff feat/neon-migration -m "feat: neon migration"
git push origin main
```

- [ ] **Step 4: Create Vercel project**

In Vercel dashboard:
1. **Add New → Project**.
2. Import the `monster-mash` GitHub repo.
3. Framework preset: **Next.js** (auto-detected).
4. Do **not** deploy yet — add env vars first.

- [ ] **Step 5: Add environment variables in Vercel**

In **Project Settings → Environment Variables**, add for Production (and Preview):

- `DATABASE_URL` (Neon pooled connection string)
- `CLERK_SECRET_KEY` (Clerk production secret)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Clerk production publishable)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/app`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding`

**Note on Clerk production vs dev keys:** the keys in `.env.local` are your Clerk **development** keys. For production, in Clerk dashboard, click **Production** instance (upper-left switcher), follow the DNS setup steps (adds CNAME records for `clerk.<your-domain>` if using a custom domain, or uses Clerk's default). Copy the production keys into Vercel.

- [ ] **Step 6: Trigger first deploy**

Click **Deploy**. Expected: build succeeds.

- [ ] **Step 7: Run drizzle push and seed against production database**

From local machine, temporarily point `.env.local` at the **production** Neon branch (or use a separate `.env.production.local`):

```bash
DATABASE_URL="<prod neon url>" npm run db:push
DATABASE_URL="<prod neon url>" npm run db:seed
```

Expected: tables created, workouts seeded in production.

- [ ] **Step 8: Add Vercel URL to Clerk allowed origins**

In Clerk dashboard → Production instance → **Domains**, add the Vercel deployment URL (e.g. `monster-mash.vercel.app`).

- [ ] **Step 9: Smoke test production**

Visit `https://monster-mash.vercel.app`. Sign up, complete onboarding, create a team, mark workouts complete, spin the wheel. Expected: everything works end-to-end.

- [ ] **Step 10: Commit the final state**

Nothing to commit — deployment is done via Vercel watching `main`.

---

## Task 24: Clean up

**Files:**
- Delete: `src-vite-backup/`

- [ ] **Step 1: Remove the temporary backup**

```bash
rm -rf src-vite-backup
```

- [ ] **Step 2: Confirm nothing important was in it** (we've migrated what we needed).

```bash
git status
```

Expected: clean.

---

## Self-Review Notes

Reviewed against the spec (`2026-04-11-neon-migration-design.md`):

- **Stack** (Task 2) — ✓ Next.js 16, Clerk, Neon, Drizzle, Tailwind v4.
- **Migration approach** (Task 1–3) — ✓ in-place, components preserved, `useHistory` deleted.
- **Schema** (Tasks 5–6) — ✓ all eight tables present with the correct types and FK cascades.
- **Seed** (Task 7) — ✓ reads `workouts.json`, idempotent via wipe-and-reinsert.
- **Auth helpers** (Task 10) — ✓ `getInternalUser`, `ensureUser`, `requireTeamMembership`.
- **Mode cookie** (Task 11) — ✓ cookie-backed `solo | team:<id>`.
- **Queries** (Task 12) — ✓ `listAllWorkouts`, `getSpinPool` (personal ∪ team exclusion), `getCompletedWorkoutIds`, `getPersonalHistory`, `getTeamHistory`.
- **Mutations** (Tasks 13–14) — ✓ `markComplete`, `unmarkComplete` (mode-aware), `createTeam`, `joinTeamByCode`, `listMyTeams`, `setMode`.
- **Onboarding** (Task 15) — ✓ solo / create / join, updates Clerk `publicMetadata.onboarded`.
- **App shell** (Task 16) — ✓ tabs, mode switcher, UserButton.
- **Tabs** (Tasks 17–19) — ✓ Workouts, Spin, History all server-driven with optimistic updates.
- **Teams page** (Task 20) — ✓ create/join flows, invite code display.
- **Scrape integration** (Task 22) — ✓ `db:sync` standalone script.
- **Deploy** (Task 23) — ✓ Vercel + env vars + prod Clerk + seed.

No placeholders. All types and identifiers (`HydratedWorkout`, `setModeCookie`, `getMode`, `ensureUser`, `markComplete`, `unmarkComplete`, `createTeam`, `joinTeamByCode`, `listMyTeams`, `setMode`) are defined before they're referenced.
