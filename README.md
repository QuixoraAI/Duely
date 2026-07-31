# Tenfa — setup instructions

This is the real, working codebase: sign up/login, add properties, upload compliance
documents, see status at a glance, and a proof-of-what-happened activity log —
all wired to your actual Supabase project.

## What's already built
- Email/password sign up and login
- Add properties
- Full compliance checklist per property (the 9 UK landlord requirements)
- Upload a document against each requirement, with issue/expiry dates
- Automatic status: Compliant / Renew soon / Expired / Missing
- Activity log per property
- Every landlord only ever sees their own data (enforced by the database itself)

## What's NOT built yet (on purpose — these come later)
- Email reminders (Phase 2)
- AI document reading (Phase 2)
- Tenant portal / proof pack export (Phase 2)
- Portfolio/agent multi-user view (Phase 3)

This is the real MVP — enough to hand to the landlords you interviewed and get genuine feedback.

---

## Step 1 — Set up the database
1. Open your Supabase project
2. Go to the **SQL Editor** (left sidebar)
3. Click **New query**
4. Open `supabase-schema.sql` from this folder, copy everything, paste it in, click **Run**
5. Go to **Storage** (left sidebar) → **New bucket** → name it exactly `documents` → set it to **Private** → Create

## Step 2 — Set up the code on your computer
You'll need [Node.js](https://nodejs.org) installed (the free "LTS" version) if you don't have it already.

1. Unzip this project somewhere on your computer
2. Open a terminal in that folder
3. Run:
   ```
   npm install
   ```
4. Copy `.env.local.example` to a new file called `.env.local` (same folder) — it already has your project's URL and key filled in from our setup, so you shouldn't need to change anything
5. Run:
   ```
   npm run dev
   ```
6. Open `http://localhost:3000` in your browser — you should see the login page

Try signing up with your own email, adding a property, and uploading a test document. If that all works, you're ready to put it online.

## Step 3 — Push the code to GitHub
1. Create a new empty repository on GitHub (no README, no .gitignore — just empty)
2. In your terminal, inside the project folder:
   ```
   git init
   git add .
   git commit -m "First version of Tenfa"
   git branch -M main
   git remote add origin <the URL GitHub gives you>
   git push -u origin main
   ```
   (GitHub shows you these exact commands when you create the repo — just copy them from there)

## Step 4 — Deploy on Vercel
1. In Vercel, click **Add New → Project**
2. Import the GitHub repository you just created
3. Before clicking Deploy, expand **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your publishable key
4. Click **Deploy**

A minute later you'll have a live link like `tenfa1.vercel.app` — that's your real, working app, live on the internet.

## Step 5 — Connect your real domain (once you're ready)
In Vercel: **Project → Settings → Domains** → add your domain → follow the DNS instructions it gives you (this usually means adding a couple of records at wherever you bought the domain).

---

## If something breaks
The most common issues:
- **Blank page / errors on load** — double check `.env.local` has the right values and restart `npm run dev`
- **"Row level security" errors when adding a property** — means Step 1 (running the SQL) didn't fully complete; re-run `supabase-schema.sql`
- **Upload fails** — make sure the `documents` storage bucket was created exactly as named in Step 1
