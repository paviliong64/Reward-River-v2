# 🌊 Reward River — Next-Generation Micro-Tasks, Direct Offerwalls & USDT Rewards Platform

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_17-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel_Ready-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Rayan_Mirza_(@rynmirza)-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/rynmirza)
[![USDT](https://img.shields.io/badge/Settlement-USDT_(TRC20_%2F_ERC20)-26A17B?style=for-the-badge&logo=tether&logoColor=white)](https://tether.to)

> **Reward River** is an enterprise-grade micro-tasks exchange, direct white-labeled survey marketplace, and cryptocurrency rewards platform. Engineered with a pure **Supabase (PostgreSQL 17)** backend, **JobsWorkTech** task workflows, **Reward River Direct Gateway** provider branding, an invisible **60/40 profit margin engine**, and turnkey **Vercel** deployment compatibility.

---

## 🏛️ Engineered & Architected By

This platform is architected, developed, and maintained by **Injazify Studios by Rayan Mirza**:

* 🚀 **Injazify Studios**: [www.injazify.com](https://injazify.com)
  * *Official Development Studio, Platform Engineering & Digital Infrastructure*
* 🛠️ **Rayan Mirza** ([@rynmirza](https://linkedin.com/in/rynmirza)):
  * 💼 **LinkedIn**: [linkedin.com/in/rynmirza](https://linkedin.com/in/rynmirza) (`@rynmirza`)
  * 🐙 **GitHub**: [@zeroxnetworks](https://github.com/zeroxnetworks)
  * *Founder, Lead Systems Architect & Co-Founder*
* 💡 **Tahir Sanaullah**:
  * *Product Architect & Co-Founder*

---

## 🏗️ High-Level System Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       REWARD RIVER PLATFORM CORE                                       │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                    │                                                                │
                    ▼                                                                ▼
   🌐 FRONTEND / CLIENT (Vite + React 19)                           ⚙️ SERVERLESS & API LAYER
    ├── 100% White-Labeled Direct UI                                  ├── Express / Vercel Serverless (`api/index.ts`)
    ├── Deep-Linked SPA Routing (`#admin`, `#tasks`, `#surveys`)      ├── Supabase Service Role Integration
    ├── Universal Responsive Ad System                                ├── Double-Entry Accounting Engine
    └── Workers & Advertisers Multi-Role Dashboard                    └── Cryptographic S2S Postbacks Listener
                    │                                                                │
                    └───────────────────────────────┬────────────────────────────────┘
                                                    ▼
                                    ⚡ SUPABASE CLOUD (PostgreSQL 17)
                                     ├── 13 Domain Tables (UUID / Indexed)
                                     ├── Double-Entry Ledger Store (`reward_ledger`)
                                     ├── JobsWorkTech Tasks & Proof Submissions
                                     ├── 60% Retained Platform Margin Treasury
                                     └── Row-Level Security & Role Governance
```

---

## ✨ Core Platform Capabilities & Modules

### 1. JobsWorkTech-Style Micro-Tasks Marketplace
- **Advertiser Campaign Creator:** Advertisers fund campaigns using USDT TRC-20/ERC-20 deposits. Escrow deductions reserve worker rewards plus a 10% platform fee.
- **Worker Execution Flow:** Direct access to verified tasks (app downloads, website registrations, social follows, reviews).
- **Proof Validation:** Supports text answers, screenshots, and transaction/reference IDs. Advertisers and Admins review and approve proofs with single-click crediting.

### 2. Reward River Direct Gateway (Zero Third-Party Vendor Leaks)
- All survey and offerwall vendors are masked behind white-labeled direct streams:
  - **CPX Research:** *"Reward River Direct Gateway • Survey Stream Alpha"*
  - **Aoyco Network:** *"Reward River Direct Gateway • App Lab & Games"*
  - **AdvertsReward Network:** *"Reward River Direct Gateway • Action Tasks Stream"*
  - **BitLabs / Custom Providers:** Easily integrated through the Admin Portal.
- Dynamic macro URL generation (`{user_id}`, `{external_id}`, `{secret}`) ensures users interact strictly with Reward River branding.

### 3. Invisible 60/40 Profit Margin Engine
- **Financial Architecture:**
  - Whenever an offerwall or survey confirms earnings, **Reward River securely retains 60% platform profit** in the Platform Treasury.
  - **Workers receive their transparent 40% payout** credited directly to their reward ledger and wallet balance.
  - Workers never see internal gross amounts or vendor margins—only their earned rewards ($0.80 for a $2.00 completion).

### 4. Pure Supabase Backend (Zero Firebase)
- **Firebase completely purged:** No Firebase SDK or files remain.
- **13 Production PostgreSQL Tables:** Defined in `supabase_schema.sql` and `supabase/migrations/`:
  - `users`, `reward_ledger`, `tasks`, `task_submissions`, `advertiser_deposits`, `providers`, `ad_slots`, `ad_settings`, `platform_treasury`, `withdrawal_requests`, `withdrawal_events`, `system_settings`, `admin_audit_logs`.
- **Dual-Mode Persistence:** Runs out of the box with intelligent offline fallback for development and seamlessly syncs with live Supabase databases in production.

### 5. Universal Dynamic Ad Slots Engine
- Full admin control over responsive ad banners without redeploying code:
  - **Sticky Bottom Desktop (728x90)**
  - **Sticky Bottom Mobile (468x60)**
  - **Sidebar Rail Banner (300x250)**
  - **Tasks Top Banner (Responsive)**
- Supports raw HTML, Google AdSense, Adsterra, PropellerAds, or custom sponsor banners.

### 6. Executive 10-Tab Command Center (Admin Portal)
1. **Financial Overview:** Gross Inflows, 60% Retained Profit, 40% User Payouts, Net Margin.
2. **Direct Providers:** Add/Edit/Delete partner networks, custom URLs, and commissions.
3. **Universal Ad Slots:** Live banner code editor and placement toggles.
4. **Commission Controls:** Set global user shares (40%) and platform margins (60%).
5. **Withdrawal Queue:** Review USDT TRC20/ERC20 cashouts, approve, reject, or mark as paid with TXID.
6. **User Directory:** Real-time balances, activity history, and manual credit/debit adjustments.
7. **Task Campaigns:** Global marketplace task moderation (approve/reject/pause campaigns).
8. **Task Submissions:** Cross-platform review of worker proofs.
9. **S2S Postback Simulator:** Test live CPX, Aoyco, or AdvertsReward webhooks with simulated payloads.
10. **🛡️ Firewall Shield & Credentials Vault:** Real-time hardware rate limiter status, live audit event stream, bot honeypot monitoring, and cryptographic Admin Email & Password rotation.

---

## 🛡️ Admin Security Shield, Firewall & Hacker Defense

To safeguard the Admin Portal against normal visitors, automated scrapers, and malicious intrusion attempts, **Injazify Studios** implemented an enterprise-grade defense shield:

### 1. Sliding Window IP Rate Limiter & Automatic Lockout
- **Threshold:** Maximum **5 failed authentication attempts** per client IP within a 15-minute window.
- **Lockout:** Breaching the threshold triggers an automatic **15-minute hardware IP lockout**.
- **HTTP 429 Status:** Any request from a locked IP receives an immediate `429 Too Many Requests` response with the remaining lockout duration.

### 2. Automated Bot Honeypot Traps
- Hidden trap fields (`_admin_trap_field`, `website_url`) are positioned outside the viewport.
- Legitimate administrators never touch these fields, but automated scraper bots fill all inputs indiscriminately.
- Any submission containing data in a honeypot field is immediately rejected with `403 Forbidden` and the offender IP is blacklisted.

### 3. Cryptographic Admin Credential Rotation (Email & Password)
- Inside the Admin Portal under **"🛡️ Firewall & Credentials"**, administrators can securely update their **Admin Email** and **Admin Master Password**.
- Changes require entering the **Current Password** to prevent session hijacking.
- Passwords are encrypted using **PBKDF2** with **10,000 iterations**, a **64-byte key length**, and **SHA-512** combined with a cryptographically random **16-byte salt**.
- Changes are instantly synchronized with the primary **Supabase PostgreSQL cluster** and a new hardened JWT session token is re-issued.

### 4. Immutable Security Audit Trail
- All security events (`ADMIN_IP_LOCKOUT`, `FIREWALL_BOT_TRAP`, `ADMIN_CREDENTIALS_UPDATED`, `ADMIN_LOGIN_SUCCESS`) are automatically logged to the `admin_audit_logs` table in Supabase.
- Admins can inspect real-time audit logs directly in the Security tab.

---

---

## 🚀 Step-by-Step Vercel Deployment Guide

Deploying Reward River to **Vercel** takes under 2 minutes:

### Step 1: Push Repository to GitHub
```bash
git add .
git commit -m "feat: Reward River production release by Injazify Studios"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/Reward-River.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Connect your GitHub account and select your **`Reward-River`** repository.
3. Framework Preset: **Vite** (Vercel will detect `package.json`).
4. Build Command: `vite build` (or leave default).
5. Output Directory: `dist` (default).

### Step 3: Configure Environment Variables in Vercel
In the Vercel project deployment settings, add the following Environment Variables:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Your Supabase Project URL | `https://vwoskusxfzmnoawbrpnr.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Anon Public Key | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret Key | `sb_secret_...` |
| `VITE_SUPABASE_URL` | Client Supabase URL | `https://vwoskusxfzmnoawbrpnr.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Client Supabase Anon Key | `sb_publishable_...` |
| `JWT_SECRET` | 32-byte Hex Session Secret | `reward-river-secure-secret-2026-prod` |
| `CPX_APP_ID` | CPX Publisher App ID | `37479` |
| `CPX_HASH_KEY` | CPX Secure Hash Key | `yTrC9mntJwV1PSRJ5WdMbwMSel6qMheY` |
| `CPX_POSTBACK_SECRET` | CPX S2S Postback Secret | `yTrC9mntJwV1PSRJ5WdMbwMSel6qMheY` |
| `NODE_ENV` | Runtime Environment | `production` |

### Step 4: Deploy & Verify
- Click **Deploy**. Vercel will build the frontend bundle and register `api/index.ts` as a serverless API function.
- The included [`vercel.json`](file:///d:/reward%20river/Reward-River/vercel.json) automatically routes all `/api/*` calls to the serverless function and all other routes to `/index.html` with zero 404 errors.

---

## 🔐 Admin Portal Access on Any Domain

The Admin Portal is fully accessible on any domain (Vercel, custom domain, localhost):

1. **Direct URL:** Navigate to `https://your-domain.vercel.app/#admin` or `https://your-domain.vercel.app/admin`.
2. **Footer Shortcut:** Click **"Command Center (Admin)"** in the bottom navigation.
3. **Master Admin Authentication:**
   - **Default Master Email:** `admin@rewardriver.com`
   - **Default Master Password:** `admin123`
   *(Update these credentials immediately upon first login in the Firewall & Credentials tab).*
4. **Hacker Protection Active:** Public one-click demo logins are strictly disabled. Only authorized administrators with verified credentials can enter. All unauthorized attempts are blocked and logged.

---

## 🛠️ Local Development & Testing

### Prerequisites
- Node.js v20 or higher
- npm or yarn

### Installation & Startup
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Run security & firewall test suite
npx tsx test_firewall_and_credentials.ts

# 4. Start local development server (Express API + Vite HMR)
npm run dev

# 5. Open in browser
http://localhost:3000
```

---

## 📦 Project Directory Structure

```text
Reward-River/
├── api/
│   └── index.ts                         # Vercel Serverless Function entrypoint
├── server/
│   ├── adminFirewall.ts                 # 🛡️ Admin IP rate limiter, honeypot traps & lockout shield
│   ├── auth.ts                          # PBKDF2 Password hashing & Supabase JWT verification
│   ├── db.ts                            # In-memory DatabaseStore with auto Supabase sync
│   ├── supabase.ts                      # Server-side Supabase client & token validator
│   ├── supabaseStore.ts                 # Supabase PostgreSQL CRUD operations
│   ├── cpxResearchService.ts            # Secure CPX S2S postback listener
│   ├── offerwallService.ts              # Aoyco & AdvertsReward webhook handlers
│   ├── usdtPriceService.ts              # CoinGecko live USDT rate feed
│   └── usdtPayoutService.ts             # USDT settlement manager
├── src/
│   ├── App.tsx                          # Main app container & deep-link hash router
│   ├── supabase.ts                      # Frontend Supabase SDK client & auth methods
│   ├── components/
│   │   ├── AdminView.tsx                # 10-Tab Executive Command Center & Defense Vault
│   │   ├── TasksView.tsx                # JobsWorkTech micro-tasks marketplace
│   │   ├── AdvertiserView.tsx           # Campaign creator & billing portal
│   │   ├── OfferwallsView.tsx           # Direct Gateway multi-offerwall hub
│   │   ├── AdBanners.tsx                # Universal dynamic ad units
│   │   ├── UserDashboard.tsx            # Worker wallet, stats & earnings
│   │   ├── WithdrawalView.tsx           # USDT TRC20/ERC20 cashout portal
│   │   ├── Navbar.tsx                   # Responsive navigation bar
│   │   └── Footer.tsx                   # Legal links & Injazify Studios credits
│   └── utils/
│       ├── ledger.ts                    # Double-entry balance calculation
│       └── cpx.ts                       # White-label direct gateway URL builder
├── supabase/
│   ├── config.toml                      # Supabase CLI configuration
│   └── migrations/                      # Production database schema migrations
├── vercel.json                          # Vercel deployment & serverless routing config
├── supabase_schema.sql                  # Complete 13-table PostgreSQL schema
├── test_supabase_integration.ts         # Supabase verification test suite
├── test_firewall_and_credentials.ts     # 🛡️ Admin Firewall & Credential rotation test suite
└── package.json                         # Project configuration & scripts
```

---

## ⚖️ License & Copyright

Copyright © 2026 **Reward River**. All rights reserved.  
Engineered with precision by **[Injazify Studios by Rayan Mirza](https://injazify.com)** ([injazify.com](https://injazify.com)) • **LinkedIn Profile:** [linkedin.com/in/rynmirza](https://linkedin.com/in/rynmirza) (`@rynmirza`).
