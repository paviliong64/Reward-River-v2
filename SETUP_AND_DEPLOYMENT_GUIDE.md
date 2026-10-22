# 🌊 Reward River v2.0 - Complete Setup & Deployment Guide
### Architected by Injazify Studios by Rayan Mirza ([@rynzer0x](https://github.com/rynzer0x))
**Official Website:** [https://injazify.com](https://injazify.com) | **LinkedIn:** [@rynmirza](https://linkedin.com/in/rynmirza)  
**Co-Founder:** Tahir Sanaullah ([@paviliong64](https://github.com/paviliong64))

---

## 📌 Table of Contents
1. [Introduction & System Overview](#1-introduction--system-overview)
2. [Prerequisites](#2-prerequisites)
3. [Quick Local Setup (Step-by-Step)](#3-quick-local-setup-step-by-step)
4. [Environment Variables Configuration (`.env`)](#4-environment-variables-configuration-env)
5. [Database Setup (Supabase SQL Schema)](#5-database-setup-supabase-sql-schema)
6. [Admin Portal Access & Security](#6-admin-portal-access--security)
7. [Deploying to Vercel (Recommended)](#7-deploying-to-vercel-recommended)
8. [Deploying to VPS / Docker / PM2](#8-deploying-to-vps--docker--pm2)
9. [Available Scripts & Testing](#9-available-scripts--testing)
10. [Licensing & Permanent Attribution](#10-licensing--permanent-attribution)

---

## 1. Introduction & System Overview
Reward River is an enterprise-grade micro-tasking, high-yield direct stream surveys, and dynamic offerwall monetization platform featuring:
- **60/40 Treasury Engine:** Automatically allocates 60% of network inflow to the platform treasury and 40% directly to active user balances.
- **Dynamic Provider Registry:** Integrates CPX Research, Aoyco, AdvertsReward, and custom postback providers directly from the Admin Panel.
- **Dual Settlement Rails:** Real-time USDT crypto payouts (TRC-20 and ERC-20) with automated address validation and live rate conversions.
- **Multi-Layered Admin Firewall:** Honeypot traps, brute-force IP rate limiting, timing-safe crypto comparison, and tamper-proof security headers.

---

## 2. Prerequisites
Before running the application, make sure you have the following installed on your machine:
- **Node.js:** v18.0.0 or higher (Node v20 LTS recommended)
- **npm:** v9.0.0 or higher (or `pnpm` / `bun`)
- **Git**

---

## 3. Quick Local Setup (Step-by-Step)

### Step 1: Open Terminal in Project Directory
Open PowerShell or your preferred terminal inside the unzipped project folder:
```powershell
cd "Reward-River"
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` (a ready `.env` file is already included):
```powershell
cp .env.example .env
```
Ensure your database and secret keys are set properly in `.env`.

### Step 4: Start Development Server
```powershell
npm run dev
```
The server will boot on `http://localhost:3000` (or `http://0.0.0.0:3000`).

---

## 4. Environment Variables Configuration (`.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Local server port | `3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `ADMIN_PASSWORD` | Master Admin Portal Password | Set your strong secret password |
| `SUPABASE_URL` | Supabase Project REST URL | `https://fghcghjhkfgch.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Public Anon Key | Public publishable token |
| `SUPABASE_SERVICE_ROLE_KEY`| Supabase Admin Service Role Key | Service role key for backend ledger sync |
| `CPX_APP_ID` | CPX Research Offerwall App ID | `29532` |
| `CPX_SECURE_HASH` | CPX Postback Verification Secret | `G9H47y6Hh3v8W96b34N84R4T3V6B8` |

---

## 5. Database Setup (Supabase SQL Schema)

If you are connecting a new Supabase database instance:
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project or select an existing one.
3. Open **SQL Editor** from the left navigation bar.
4. Open the included [`supabase_schema.sql`](./supabase_schema.sql) file.
5. Copy all contents, paste them into the Supabase SQL editor, and click **Run**.
6. The schema will generate:
   - `users` & `user_balances` tables
   - `task_campaigns` & `task_submissions`
   - `offerwall_postbacks` & `withdrawals`
   - `system_settings` & `audit_logs`
   - Automated triggers for ledger balance calculations and timestamps.

---

## 5.1 Google OAuth Configuration (One-Click Sign-In)

Reward River is natively configured to support Google OAuth via Supabase:
1. **Google Cloud Console:**
   - Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
   - Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
   - Under **Authorized redirect URIs**, add:
     ```
     https://vwoskusxfzmnoawbrpnr.supabase.co/auth/v1/callback
     ```
   - Copy the generated **Client ID** and **Client Secret**.
2. **Supabase Dashboard:**
   - In your [Supabase Dashboard](https://supabase.com/dashboard), navigate to **Authentication** -> **Providers** -> **Google**.
   - Toggle the switch to **Enabled**.
   - Paste your **Client ID** and **Client Secret** and click **Save**.
3. **Frontend Integration:**
   - Users can now click **Continue with Google** to seamlessly log in and sync their balance across devices.

---

## 6. Admin Portal Access & Security

To access the executive command center:
1. Open your browser and navigate to:
   ```
   http://localhost:3000/#admin
   ```
   (Or click **Admin Portal** from the main navigation).
2. Enter your master administrator credentials:
   - **Email:** `master@rewardriver.com` (or your configured admin email)
   - **Password:** The password configured in `ADMIN_PASSWORD` in `.env`
3. The Admin Portal features:
   - 60% Treasury vs 40% User Payout Financial Overview
   - Universal Ad Slot Manager (Sticky Bottom 728x90, 468x60, Sticky Rail 300x250)
   - Dynamic Offerwall Provider Integrations (Add CPX, BitLabs, TapResearch without code changes)
   - User Role Switcher & Direct Balance Adjustments
   - Interactive Postback Simulator for testing instant crediting.

---

## 7. Deploying to Vercel (Recommended)

Reward River is fully optimized for 1-click deployment on [Vercel](https://vercel.com):

1. **Push to GitHub:**
   Your repository is already live on GitHub at `https://github.com/paviliong64/Reward-River-v2`.
2. **Import into Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Click **Import Repository** and select `Reward-River-v2`.
   - Framework Preset: **Vite** (Root Directory: `./`).
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Environment Variables:**
   - In the Vercel project settings, add the environment variables from your `.env` file (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, etc.).
4. **Deploy:**
   - Click **Deploy**. Vercel will build and deploy the production app globally.

---

## 8. Deploying to VPS / Docker / PM2

For self-hosted Ubuntu / Linux VPS deployments:
```bash
# 1. Clone repository
git clone https://github.com/paviliong64/Reward-River-v2.git
cd Reward-River-v2

# 2. Install dependencies & build
npm install
npm run build

# 3. Start with PM2 Process Manager
npm install -g pm2
pm2 start server.ts --name "reward-river" --interpreter ./node_modules/.bin/tsx

# 4. Save PM2 startup list
pm2 save
pm2 startup
```

---

## 9. Available Scripts & Testing

- `npm run dev`: Runs local Vite development server with backend middleware.
- `npm run build`: Compiles TypeScript and creates optimized production assets in `/dist`.
- `npm run preview`: Previews the compiled production build locally.
- `npx tsx test_dynamic_provider_lifecycle.ts`: Tests complete lifecycle of dynamic offerwall providers.
- `npx tsx test_firewall_and_credentials.ts`: Verifies security firewall, rate limiting, and honeypot traps.
- `npx tsx test_supabase_integration.ts`: Verifies real-time Supabase connection and balance updates.

---

## 10. Licensing & Permanent Attribution

Copyright (c) 2026 **Reward River Platform**.  
Architected & Engineered by **Injazify Studios by Rayan Mirza** ([@rynzer0x](https://github.com/rynzer0x)) and **paviliong64** ([@paviliong64](https://github.com/paviliong64)).

This software is released under the **MIT License**. In accordance with the license and platform integrity protections, all authorship credits, HTTP attribution headers, and repository links must remain intact in all distributions and forks.
