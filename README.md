# Resume Builder

Free, minimal resume builder. Edit, preview live, and export to PDF.

- **Framework**: Vite + React 19 + TypeScript 6
- **Styling**: Tailwind CSS v4 (via `@theme` tokens in `src/styles/globals.css`)
- **Backend**: Supabase (auth + Postgres, optional — the app works fully offline via localStorage)
- **Hosting**: Vercel

## Getting started

```bash
npm install
cp .env.example .env.local      # fill in Supabase values if you want cloud sync
npm run dev
```

Without Supabase configured the app runs in local-only mode: drafts are saved to `localStorage` and never leave the browser. Configure Supabase and the "Save to cloud" button lets users sign in via magic link and sync across devices.

## Supabase setup

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL editor, paste the contents of `supabase-setup.sql` and run it. This creates the `resumes` table and row-level-security policies so users can only see their own row.
3. Copy `Project URL` and `anon public key` from **Project Settings → API** into `.env.local`.
4. Under **Authentication → Providers**, make sure Email is enabled with Magic Link.
5. Add your Vercel production URL (and `localhost:5173` for dev) to **Authentication → URL Configuration → Redirect URLs**.

## Deploy

Push to GitHub, import the repo into Vercel, set the same two env vars in Vercel project settings. Vercel auto-detects Vite and deploys.

## Scripts

```bash
npm run dev      # dev server
npm run build    # tsc + vite build
npm run preview  # preview production build
npm run lint     # eslint
```
