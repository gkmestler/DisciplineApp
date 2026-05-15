Build me a full-stack discipline tracking web app called "DISCIPLINE" using Next.js, Supabase, and Tailwind CSS. Deploy target is Vercel. Here is the complete spec:

---

## STACK
- Next.js 14 (App Router)
- Supabase (auth + database)
- Tailwind CSS
- TypeScript
- Deploy to Vercel

---

## DESIGN
Dark/minimal. Black and charcoal backgrounds. Clean, sharp typography. Mobile-first — this is used primarily on a phone. Sticky bottom navigation. No clutter. Think brutally clean — like a training log, not a wellness app. Use a distinctive display font (not Inter or Roboto) for headings and scores. Subtle animations on point gain/loss. Brief flash or pulse animation when XP is added.

---

## SUPABASE SCHEMA

### users table
- id (uuid, primary key, references auth.users)
- created_at

### discipline_items table
- id (uuid, primary key)
- user_id (uuid, references users)
- name (text) — e.g. "Skip the sweet treat"
- points (int) — 1, 3, 5, or 10
- status (text) — 'active', 'graduated', 'slipped'
- consecutive_wins (int, default 0)
- total_logs (int, default 0)
- created_at

### discipline_logs table
- id (uuid, primary key)
- user_id (uuid, references users)
- item_id (uuid, references discipline_items)
- item_name (text) — snapshot at time of log
- points (int) — positive or negative
- was_disciplined (boolean)
- logged_at (timestamp)

---

## AUTH
Use Supabase Auth with email/password. Simple login and signup screen. After login, all data is scoped to that user. This must work cross-device — phone and laptop see the same data.

---

## CORE FEATURES

### 1. Discipline Items
Users build a personal list of discipline items. Each item has:
- Name (user-defined, e.g. "Hit last set", "First alarm", "No junk food")
- Point value: 1, 3, 5, or 10 (user chooses when creating)
- Status: Active, Graduated, or Slipped

Add item flow: tap "+" → enter name → choose point value (1/3/5/10, shown as selectable tiles) → save.

On the main screen, show all Active and Slipped items as a list. Each item has two buttons: ✅ Disciplined and ❌ Failed.

### 2. Logging
Tap Disciplined on an item:
- Adds points to daily score and lifetime XP
- Increments consecutive_wins on that item
- Checks graduation threshold (see below)

Tap Failed on an item:
- Subtracts points from daily score and lifetime XP
- Resets consecutive_wins to 0
- If item is Graduated → first fail sets status to 'slipped', subtracts 2x points
- If item is Slipped → second fail sets status back to 'active', resets consecutive_wins to 0, subtracts 2x points

### 3. Graduation System
Consecutive wins required to trigger graduation prompt, by point value:
- 1 pt → 14 consecutive wins
- 3 pts → 10 consecutive wins
- 5 pts → 7 consecutive wins
- 10 pts → 5 consecutive wins

When threshold is hit, show a modal/bottom sheet: "You've done this [X] times in a row. Is this a habit now?" with two buttons: "Graduate It" and "Not Yet". If graduated, status becomes 'graduated', item moves to Graduated list.

### 4. Scoring
- **Daily Score**: sum of all logs for today (can go negative). Resets at midnight.
- **Lifetime XP**: running total of all logs, never resets. Always positive floor of 0 (can't go below 0 lifetime).
- Show both on home screen prominently.
- Show an XP progress bar toward the next threshold. Thresholds: 100, 300, 600, 1000, 1500, 2200, 3000, 4200, 6000. No level titles, just the bar and the number.

### 5. Graduated Habits List
Separate section or tab showing all graduated items. Each shows:
- Item name
- Point value
- Total times logged
- Status badge (Graduated or Slipped)

If slipped, show a warning indicator. User can still log Disciplined/Failed from this list.

### 6. Log History
Full chronological log of every entry. Show: item name, points (green if positive, red if negative), timestamp. Paginated or infinite scroll.

---

## SCREENS / NAVIGATION

Bottom nav with 3 tabs:
1. **Home** — Daily score, Lifetime XP + progress bar, Active items list with Disciplined/Failed buttons, quick-add item button
2. **Habits** — Graduated habits list
3. **Log** — Full history

---

## UX DETAILS
- Mobile first. Buttons must be thumb-friendly (large tap targets).
- When points are added/subtracted, animate the score change (count up/down briefly).
- Graduation prompt is a bottom sheet on mobile.
- Empty states should be motivating, not generic (e.g. "Nothing locked in yet. Start building." for the Habits tab).
- Error states handled gracefully.
- Loading states on all async actions.

---

## PROJECT SETUP
- Initialize as a Next.js 14 app with TypeScript and Tailwind
- Set up Supabase client with environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Include a /supabase/schema.sql file with all the SQL to set up the database
- Include a README with setup instructions: how to create the Supabase project, run the schema, add env vars, and deploy to Vercel
- RLS (Row Level Security) policies on all tables so users can only access their own data

Build the full app, not a skeleton. Every feature above should be working.