# DISCIPLINE

A brutally clean discipline tracker. Build your own list of things you said you'd do, log wins and fails, watch the score move. Mobile-first.

Built with **Next.js 14** (App Router), **Supabase** (auth + database), **Tailwind CSS**, and **TypeScript**. Deploys to **Vercel**.

---

## Features

- **Personal discipline items** with point values 1 / 3 / 5 / 10
- **Daily score** (resets at midnight) + **lifetime XP** (never resets, floored at 0)
- **Graduation** — hit the threshold consecutive wins and an item becomes a habit
- **Slip handling** — graduated items that fail slip; another fail downgrades them back to active. Slip fails cost 2x points.
- **XP progress bar** toward the next threshold (100, 300, 600, 1000, 1500, 2200, 3000, 4200, 6000)
- **Log** with chronological history, infinite scroll, grouped by day
- **Bottom nav**: Home / Habits / Log
- **Row Level Security** on every table — your data is yours

---

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Wait for the database to provision.
3. In the project dashboard, open **SQL editor**.
4. Paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it. This creates the `users`, `discipline_items`, and `discipline_logs` tables, the trigger that mirrors auth users into `public.users`, and the RLS policies.
5. Under **Authentication → Providers**, make sure **Email** is enabled. For dev, you may want to disable "Confirm email" so new signups can log in immediately.

### 2. Grab the env vars

From the Supabase project dashboard, go to **Project settings → API** and copy:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Copy `.env.local.example` to `.env.local` and fill them in:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 3. Install + run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, then start adding disciplines.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com), click **Add New → Project** and import the repo.
3. In the project settings, add the two environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. The app works cross-device because Supabase is the source of truth — sign in on your phone and on your laptop and you'll see the same data.

---

## Project structure

```
app/
  actions.ts          server actions: createItem, logDisciplined, logFailed, graduateItem
  page.tsx            Home (server)
  HomeClient.tsx      Home interactive shell
  habits/             Graduated habits tab
  log/                Full chronological log tab
  login/, signup/     Auth pages
  auth/signout/       POST route to sign out
components/
  AppShell.tsx        Layout wrapper with bottom nav
  BottomNav.tsx       Sticky bottom navigation
  ItemRow.tsx         A discipline item with Disciplined/Failed buttons
  AddItemSheet.tsx    Bottom-sheet for adding a new item
  GraduationSheet.tsx Graduation prompt when threshold is hit
  AnimatedNumber.tsx  Smoothly tweens score changes
  XpBar.tsx           Progress toward next XP threshold
lib/
  discipline.ts       Threshold + XP logic
  supabase/           SSR-aware browser, server, and middleware clients
  types.ts            Shared types
supabase/
  schema.sql          Run this in the Supabase SQL editor on a fresh project
middleware.ts         Redirects unauthenticated users to /login
```

---

## Rules of the system

**Graduation thresholds** (consecutive wins required):

| Points | Wins to graduate |
| ------ | ---------------- |
| 1      | 14               |
| 3      | 10               |
| 5      | 7                |
| 10     | 5                |

**Fail behavior** depends on item status:

- **Active**: -1x points, streak resets to 0
- **Graduated** + fail: -2x points, becomes **slipped**, streak resets
- **Slipped** + fail: -2x points, drops back to **active**, streak resets
- **Slipped** + disciplined: +1x points, restored to **graduated**

**Daily score** is the sum of all logs since midnight local time. Can go negative.

**Lifetime XP** is the running sum of every log, floored at 0.
