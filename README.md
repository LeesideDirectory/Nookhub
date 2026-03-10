# Nook — Deployment Guide

## Prerequisites
- Node.js 18+ installed locally
- A [Supabase](https://supabase.com) account
- A [GitHub](https://github.com) account
- A [Netlify](https://netlify.com) account

---

## Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name it `nook`, choose a region close to you, set a database password
3. Wait ~2 minutes for it to spin up
4. Go to **SQL Editor** (left sidebar) → **New query**
5. Open the file `supabase-schema.sql` from this repo, paste the entire contents, click **Run**
6. Go to **Project Settings** → **API**
7. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / public** key (the long `eyJ...` string)

---

## Step 2 — Push to GitHub

```bash
# In this project folder:
git init
git add .
git commit -m "Initial Nook commit"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/nook.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Deploy on Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**
2. Choose **GitHub** → authorise → select your `nook` repo
3. Build settings (should auto-detect from `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Click **Show advanced** → **New variable**, add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy site**

Netlify will build and deploy. Your site will be live at a URL like `nook-abc123.netlify.app`.

---

## Step 4 — Test it

1. Visit your Netlify URL
2. Click **Sign up** — create an account with a real email
3. Supabase will send a confirmation email (or you can disable email confirmation in Supabase → Auth → Settings → Disable email confirmations for testing)
4. Log in, complete onboarding, start using the app

---

## Local development

```bash
# Install dependencies
npm install

# Create local env file
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Start dev server
npm run dev
# → http://localhost:5173
```

---

## Disable email confirmation (optional, for testing)

Supabase → **Authentication** → **Providers** → **Email** → toggle off **Confirm email**

This lets users log in immediately after signup without email verification.

---

## Custom domain (optional)

In Netlify → **Domain management** → **Add custom domain**, follow the DNS instructions.
