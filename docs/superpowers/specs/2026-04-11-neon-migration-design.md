# Monster Mash — Neon Migration & Multi-User Design

**Date:** 2026-04-11
**Status:** Approved design, awaiting implementation plan
**Author:** Liam Coates (with Claude)

## Problem

Monster Mash is currently a Vite + React SPA. Workouts live in `src/data/workouts.json` and completion history lives in `localStorage` (`src/hooks/useHistory.ts`). This has two problems:

1. **History is unreliable.** localStorage is per-browser, per-device, wiped on cache clears or cross-device use. Liam regularly loses his completion history.
2. **No multi-user story.** A small group of friends do these workouts together — sometimes solo, sometimes as a team — and there's no way to share state or track team sessions.

## Goal

Turn Monster Mash into a "real system": hosted, authenticated, database-backed, with both personal and team workout tracking. Stack must match the existing Neon project (`the-yard-peckham`) so Liam is learning one set of tools.

## Non-Goals (v1)

- Leaderboards across teams
- Editing or adding workouts from the UI
- Per-segment / per-movement performance tracking (weights used, reps done, times)
- Push notifications / reminders
- Rotating or revoking invite codes
- Removing team members or transferring ownership

These are parked for later.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Clerk** for auth (`@clerk/nextjs`)
- **Neon Postgres** — new project `monster-mash`, separate from `the-yard-peckham`
- **Drizzle ORM** + `drizzle-kit` for schema, migrations, seeding
- **Tailwind** — preserve existing Monster Mash dark/red theme
- **Vercel** for hosting

This matches `~/Desktop/Addons/Barbell Tracker/package.json` (the-yard-peckham) exactly.

## Migration Approach

Rip out Vite in-place in `~/monster-mash` to preserve git history. Delete `vite.config.ts`, `index.html`, `src/main.tsx`, Vite-specific tsconfig bits. Add Next.js App Router structure. Move existing presentational components (`SpinWheel`, `WorkoutCard`, `WorkoutList`, `HistoryLog`, `SearchBar`, `MovementFilter`, `Header`) across unchanged. Replace the `useHistory` hook with server actions + `useOptimistic`. `src/data/workouts.json` becomes the seed source.

## Data Model

```sql
-- Mirrors Clerk identity; upserted on first authenticated request
users (
  id              serial primary key,
  clerk_user_id   text unique not null,
  display_name    text not null,
  created_at      timestamptz default now()
)

teams (
  id              serial primary key,
  name            text not null,
  invite_code     text unique not null,      -- e.g. 'MMASH-7X4K'
  created_by      int references users(id),
  created_at      timestamptz default now()
)

team_members (
  team_id         int references teams(id) on delete cascade,
  user_id         int references users(id) on delete cascade,
  role            text default 'member',     -- 'owner' | 'member'
  joined_at       timestamptz default now(),
  primary key (team_id, user_id)
)

-- Workout catalog (seeded from workouts.json; scrape.js writes here going forward)
workouts (
  id              text primary key,          -- keep existing string ids
  date            date not null,
  title           text not null,
  source_url      text,
  created_at      timestamptz default now()
)

segments (
  id              serial primary key,
  workout_id      text references workouts(id) on delete cascade,
  position        int not null,
  format          text not null,
  description     text not null
)

movements (
  id                serial primary key,
  segment_id        int references segments(id) on delete cascade,
  position          int not null,
  name              text not null,
  reps              text,
  weight_kg_male    real,
  weight_kg_female  real,
  weight_original   text,
  equipment         text
)

-- Personal completions — a log (not a set). Users can repeat workouts.
personal_completions (
  id              serial primary key,
  user_id         int references users(id) on delete cascade,
  workout_id      text references workouts(id) on delete cascade,
  completed_at    timestamptz default now()
)

-- Team session log (separate from personal — does NOT bump members' personal counters)
team_completions (
  id              serial primary key,
  team_id         int references teams(id) on delete cascade,
  workout_id      text references workouts(id) on delete cascade,
  logged_by       int references users(id),
  completed_at    timestamptz default now(),
  notes           text
)
```

### Schema Decisions

- **Logs, not sets.** Completion tables allow duplicates. "Is completed?" becomes "exists at least one row".
- **Normalised workouts.** `workouts` → `segments` → `movements` so the scraper can insert structured data and future features can query by movement name/equipment.
- **Separate completion tables.** Team sessions do not auto-tick personal history (per Q7 decision). A member can still personally tick the same workout if they want.
- **Spin pool filter.** The pool excludes any workout the user has completed **personally OR** via their currently-selected team. Rationale: the user doesn't want to be served a workout they've already done in any form. This can be relaxed later if it feels too restrictive.

## App Structure

```
src/
  app/
    layout.tsx                          — ClerkProvider, fonts, base styles
    page.tsx                            — redirects to /app or /sign-in
    sign-in/[[...sign-in]]/page.tsx     — Clerk <SignIn /> themed
    sign-up/[[...sign-up]]/page.tsx     — Clerk <SignUp /> themed
    onboarding/page.tsx                 — first run: display name + create/join team (or skip)
    app/
      layout.tsx                        — auth gate, header, tab nav, team/mode switcher
      page.tsx                          — Workouts tab (list + search + filter)
      spin/page.tsx                     — Spin tab with Solo/Team mode selector
      history/page.tsx                  — History tab (sub-tabs: Mine / Team)
      teams/page.tsx                    — create team, show invite code, join by code
  components/                           — SpinWheel, WorkoutCard, WorkoutList, etc.
  db/
    schema.ts                           — Drizzle schema
    index.ts                            — Neon HTTP client + drizzle instance
    seed.ts                             — reads workouts.json → inserts
  lib/
    actions/
      completions.ts                    — markPersonal, unmarkPersonal, logTeam, unlogTeam
      teams.ts                          — createTeam, joinByCode, leaveTeam
      user.ts                           — ensureUser (Clerk → users row upsert)
    queries/
      workouts.ts                       — listWorkouts, getSpinPool
      history.ts                        — getPersonalHistory, getTeamHistory
    auth.ts                             — helpers: currentUser, requireTeamMembership
    mode.ts                             — cookie read + write for Solo/Team mode
drizzle.config.ts
middleware.ts                           — Clerk middleware + onboarding redirect
```

### Mode Handling (Solo vs Team)

A cookie `mm_mode` holds either `solo` or `team:<teamId>`. Set by the mode selector in the Spin tab (and surfaced in the header). Read server-side by:

- `getSpinPool()` — filters by personal OR team completions depending on mode
- `markComplete` server action — writes to `personal_completions` OR `team_completions` depending on mode
- History tab — defaults to showing the view matching current mode

Defaults to `solo`. Users not in any team are locked to solo.

### Onboarding Flow

1. User visits site, unauthenticated → redirected to `/sign-in`.
2. After sign-in, middleware checks for a `users` row keyed by `clerkUserId`.
3. If missing → redirect to `/onboarding`. Form: display name (prefilled from Clerk), then one of: create team / join by code / skip (solo only).
4. On submit → server action creates `users` row + optional `teams` + `team_members` row → redirect to `/app`.
5. If `users` row exists, middleware lets the request through.

### Auth & Authorisation Rules

- All `/app/*` routes require a signed-in Clerk session (enforced in `middleware.ts`).
- Personal completions: user can only read/write their own rows.
- Team completions: user must be a member of `team_id` (checked server-side in every action/query).
- Team creation: any authenticated user.
- Team invite code join: any authenticated user with a valid code.
- Owner-only operations (rotate code, remove members, etc.) — out of scope for v1.

### Mutations

All mutations are server actions, not API routes:

- `markPersonalComplete(workoutId)` / `unmarkPersonalComplete(workoutId)`
- `logTeamSession(workoutId, notes?)` / `unlogTeamSession(completionId)`
- `createTeam(name)` → returns invite code
- `joinTeamByCode(code)`
- `setMode('solo' | { teamId: number })`
- `ensureUser()` — idempotent upsert, called implicitly by other actions

Each action: `auth()` → `ensureUser()` → authorisation check → Drizzle write → `revalidatePath()` on affected routes. Client components use `useTransition` + `useOptimistic` so the UI flips instantly without waiting for the round-trip.

### Queries

Server components read directly from Drizzle — no intermediate API layer. Typical request flow:

1. Server component calls `auth()`, gets `clerkUserId`.
2. Resolves to internal `userId` via cached `currentUser()` helper.
3. Reads cookie for current mode.
4. Calls query function (e.g. `getSpinPool(userId, mode)`).
5. Passes data as props to client components (SpinWheel, WorkoutList, etc.).

## Deployment

### Neon
- New Neon project: `monster-mash`.
- Two branches: `main` (prod), `dev` (local development).
- `DATABASE_URL` = pooled connection string.

### Clerk
- New Clerk application: `monster-mash`.
- Dev instance for `localhost:3000`, prod instance for the Vercel URL.
- Sign-in/sign-up URLs: `/sign-in`, `/sign-up`. After sign-in: `/app`.

### Vercel
- New Vercel project linked to the `monster-mash` GitHub repo.
- Environment variables:
  - `DATABASE_URL`
  - `CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
  - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app`
  - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`
- First deploy:
  1. Push to `main` → Vercel builds.
  2. Run `drizzle-kit push` once against prod `DATABASE_URL`.
  3. Run `npm run db:seed` once against prod to load workout catalog from `workouts.json`.

### Scrape Script

`scripts/scrape.js` gets updated to call an upsert helper from `src/db/` so new workouts land directly in Neon instead of rewriting the JSON file. The JSON file stays around as a backup/fallback and the seed source for fresh environments.

## Open Questions (Non-Blocking)

- Display name on first run — prefill from Clerk's `firstName`? Fall back to email if unset.
- Invite code format — `MMASH-XXXX` (short, human-friendly, shareable on WhatsApp).
- Should solo-completed workouts appear in the team history view? No for v1 — team history shows team sessions only.

## Success Criteria

- Liam and his friends can sign in, create/join a team, and see each other's team session log.
- Marking a workout complete (solo or team) persists across devices, browsers, and cache clears.
- Spin wheel excludes completed workouts (personal OR team, depending on mode).
- Everything is deployed at a Vercel URL with Neon + Clerk prod credentials.
- Zero regressions against the current UI — the Workouts, Spin, and History tabs look and feel identical (plus a Teams tab and a mode switcher).
