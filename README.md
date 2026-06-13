# World Cup Predictor League

A private friends-only World Cup predictor game built with Next.js App Router, TypeScript, Tailwind CSS, Supabase, and `@supabase/supabase-js`.

This app does not handle payments, betting, wallets, prize money, or any gambling workflow. It only tracks match predictions and points.

## Install dependencies

```bash
npm install
```

## Create a Supabase project

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Open Project Settings > API.
3. Copy the project URL and anon public key.

## Run the database schema

1. In Supabase, open SQL Editor.
2. Paste the contents of `supabase/schema.sql`.
3. Run the SQL.

## Seed the 20 PINs

1. In Supabase SQL Editor, paste the contents of `supabase/seed-pins.sql`.
2. Run the SQL.
3. Share one PIN with each friend.

## Add fixtures

Fixtures can be created manually from `/admin`, uploaded as CSV from `/admin`, or inserted using Supabase.

A sample CSV is available at `supabase/sample-fixtures.csv`. The required headers are:

```csv
home_team,away_team,stage,kickoff_at
```

Use ISO timestamps for `kickoff_at`, such as `2026-06-11T20:00:00Z`.

## Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ADMIN_PASSWORD=
```

`NEXT_PUBLIC_ADMIN_PASSWORD` is a simple Version 1 admin gate. It is visible to the browser bundle, so do not treat it as strong security.

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build locally

```bash
npm run build
```

## Deploy on Vercel

1. Push the repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com/).
3. Add these environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_PASSWORD`
4. Deploy.

## Scoring

- Correct group-stage result: 3 points
- Wrong result: 0 points
- Predictions lock after each fixture's `kickoff_at`

Results are entered from `/admin`. When an admin saves a fixture result, all predictions for that fixture are recalculated.
