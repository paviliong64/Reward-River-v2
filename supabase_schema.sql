-- ==============================================================================
-- Reward River - Supabase PostgreSQL Schema & Migrations
-- Complete Production Database Architecture for Reward River
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USERS & PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT DEFAULT '',
    salt TEXT DEFAULT '',
    display_name TEXT DEFAULT '',
    email_verified BOOLEAN DEFAULT FALSE,
    role TEXT CHECK (role IN ('user', 'advertiser', 'admin')) DEFAULT 'user',
    external_opaque_id TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    whatsapp_number TEXT,
    country_code TEXT DEFAULT 'US',
    provider TEXT DEFAULT 'supabase',
    advertiser_balance_cents INTEGER DEFAULT 0,
    has_prompted_phone BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_external_opaque_id ON public.users(external_opaque_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ------------------------------------------------------------------------------
-- 2. REWARD LEDGER TABLE (Financial Audit & Balance Tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reward_ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider_tx_id TEXT,
    amount_cents INTEGER NOT NULL, -- 100 cents = $1.00 USD = 10,000 Points
    entry_type TEXT CHECK (entry_type IN ('credit', 'debit', 'reversal')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'reversed')) DEFAULT 'confirmed',
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_ledger_user ON public.reward_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_tx ON public.reward_ledger(provider_tx_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_created ON public.reward_ledger(created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. TASK CAMPAIGNS (JobsWorkTech Micro-Tasks Marketplace)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    advertiser_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    advertiser_email TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions JSONB DEFAULT '[]'::jsonb,
    category TEXT CHECK (category IN ('signup', 'app', 'social', 'review', 'survey', 'website', 'other')) DEFAULT 'other',
    target_url TEXT NOT NULL,
    reward_points INTEGER NOT NULL, -- e.g. 100 Points = 1 cent
    reward_cents INTEGER NOT NULL,
    total_slots INTEGER NOT NULL,
    completed_slots INTEGER DEFAULT 0,
    target_country TEXT DEFAULT 'ALL',
    target_device TEXT CHECK (target_device IN ('all', 'mobile', 'desktop')) DEFAULT 'all',
    required_proof_type TEXT CHECK (required_proof_type IN ('text', 'screenshot', 'reference_id', 'both')) DEFAULT 'text',
    proof_instructions TEXT DEFAULT '',
    status TEXT CHECK (status IN ('pending_approval', 'active', 'paused', 'completed', 'rejected')) DEFAULT 'pending_approval',
    platform_fee_percent INTEGER DEFAULT 10,
    advertiser_budget_reserved_cents INTEGER DEFAULT 0,
    advertiser_fee_reserved_cents INTEGER DEFAULT 0,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_advertiser ON public.tasks(advertiser_id);

-- ------------------------------------------------------------------------------
-- 4. TASK SUBMISSIONS (Worker Proof Reviews)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_submissions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    task_title TEXT NOT NULL,
    worker_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    worker_email TEXT NOT NULL,
    advertiser_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reward_points INTEGER NOT NULL,
    reward_cents INTEGER NOT NULL,
    proof_text TEXT,
    proof_screenshot_url TEXT,
    proof_reference_id TEXT,
    status TEXT CHECK (status IN ('pending_review', 'approved', 'rejected')) DEFAULT 'pending_review',
    rejection_reason TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_submissions_task ON public.task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_worker ON public.task_submissions(worker_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_advertiser ON public.task_submissions(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON public.task_submissions(status);

-- ------------------------------------------------------------------------------
-- 5. ADVERTISER DEPOSITS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.advertiser_deposits (
    id TEXT PRIMARY KEY,
    advertiser_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    advertiser_email TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    method TEXT DEFAULT 'USDT',
    status TEXT CHECK (status IN ('pending', 'confirmed', 'rejected')) DEFAULT 'confirmed',
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advertiser_deposits_adv ON public.advertiser_deposits(advertiser_id);

-- ------------------------------------------------------------------------------
-- 6. PARTNER & PROVIDER CONFIGURATIONS (Reward River Direct Streams)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    public_brand_name TEXT NOT NULL,
    tagline TEXT DEFAULT '',
    description TEXT DEFAULT '',
    category TEXT CHECK (category IN ('surveys', 'offers', 'tasks', 'sponsors', 'ads')) DEFAULT 'offers',
    enabled BOOLEAN DEFAULT TRUE,
    launch_url_template TEXT NOT NULL,
    app_id TEXT DEFAULT '',
    secret_key TEXT DEFAULT '',
    hash_key TEXT,
    user_share_percent INTEGER DEFAULT 40,      -- Earner gets 40%
    platform_share_percent INTEGER DEFAULT 60,  -- Reward River keeps 60%
    icon TEXT DEFAULT 'RR',
    badge TEXT DEFAULT 'Reward River Direct',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. UNIVERSAL DYNAMIC AD SLOTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ad_slots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    placement TEXT CHECK (placement IN ('sticky_bottom', 'sidebar', 'tasks_top', 'surveys_top', 'dashboard')) NOT NULL,
    format TEXT CHECK (format IN ('728x90', '468x60', '300x250', 'responsive', 'custom')) DEFAULT 'responsive',
    enabled BOOLEAN DEFAULT TRUE,
    ad_code TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. PLATFORM TREASURY (60% Retained Platform Margin)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_treasury (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    source_type TEXT CHECK (source_type IN ('survey', 'offerwall', 'microtask', 'advertiser_fee', 'ad_revenue')) NOT NULL,
    gross_amount_cents INTEGER NOT NULL,
    user_share_cents INTEGER NOT NULL,         -- 40%
    platform_share_cents INTEGER NOT NULL,     -- 60%
    user_id TEXT,
    user_email TEXT,
    provider_tx_id TEXT,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_treasury_provider ON public.platform_treasury(provider_id);
CREATE INDEX IF NOT EXISTS idx_platform_treasury_user ON public.platform_treasury(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_treasury_created ON public.platform_treasury(created_at DESC);

-- ------------------------------------------------------------------------------
-- 9. WITHDRAWAL REQUESTS & AUDIT EVENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    usdt_address TEXT NOT NULL,
    network TEXT CHECK (network IN ('TRC20', 'ERC20')) NOT NULL,
    amount_cents INTEGER NOT NULL,
    fee_cents INTEGER NOT NULL,
    net_cents INTEGER NOT NULL,
    gross_usdt TEXT NOT NULL,
    fee_usdt TEXT NOT NULL,
    net_usdt TEXT NOT NULL,
    status TEXT CHECK (status IN ('requested', 'under_review', 'approved', 'processing', 'paid', 'rejected', 'failed', 'cancelled')) DEFAULT 'requested',
    tx_hash TEXT,
    review_notes TEXT,
    reviewed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawal_requests(status);

CREATE TABLE IF NOT EXISTS public.withdrawal_events (
    id TEXT PRIMARY KEY,
    withdrawal_id TEXT NOT NULL REFERENCES public.withdrawal_requests(id) ON DELETE CASCADE,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    actor_user_id TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_events_wid ON public.withdrawal_events(withdrawal_id);

-- ------------------------------------------------------------------------------
-- 10. SYSTEM SETTINGS & AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    min_withdrawal_cents INTEGER DEFAULT 500,
    max_withdrawal_cents INTEGER DEFAULT 50000,
    fee_cents_trc20 INTEGER DEFAULT 100,
    fee_cents_erc20 INTEGER DEFAULT 250,
    platform_fee_percent INTEGER DEFAULT 10,
    points_rate_per_usd INTEGER DEFAULT 10000,
    default_user_share_percent INTEGER DEFAULT 40,
    default_platform_share_percent INTEGER DEFAULT 60,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    default_network TEXT DEFAULT 'TRC20',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ad_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    ads_enabled BOOLEAN DEFAULT TRUE,
    test_mode BOOLEAN DEFAULT FALSE,
    sticky_bottom_enabled BOOLEAN DEFAULT TRUE,
    sticky_rail_enabled BOOLEAN DEFAULT TRUE,
    sticky_bottom_728_code TEXT DEFAULT '',
    sticky_bottom_468_code TEXT DEFAULT '',
    sticky_rail_300_code TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details TEXT DEFAULT '',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 11. DEFAULT SYSTEM SEEDS
-- ------------------------------------------------------------------------------
INSERT INTO public.system_settings (id, min_withdrawal_cents, max_withdrawal_cents, fee_cents_trc20, fee_cents_erc20, platform_fee_percent, points_rate_per_usd, default_user_share_percent, default_platform_share_percent, maintenance_mode, default_network)
VALUES ('global', 500, 50000, 100, 250, 10, 10000, 40, 60, FALSE, 'TRC20')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ad_settings (id, ads_enabled, test_mode, sticky_bottom_enabled, sticky_rail_enabled)
VALUES ('global', TRUE, FALSE, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Providers (CPX, Aoyco, AdvertsReward) as Reward River Direct Streams
INSERT INTO public.providers (id, name, public_brand_name, tagline, description, category, enabled, launch_url_template, app_id, secret_key, user_share_percent, platform_share_percent, icon, badge)
VALUES 
(
    'cpx',
    'CPX Research Network',
    'Reward River Direct Gateway • Survey Stream Alpha',
    'Real-time academic & consumer research studies',
    'High fill-rate surveys verified and credited directly to your wallet in real-time.',
    'surveys',
    TRUE,
    'https://offers.cpx-research.com/index.php?app_id={app_id}&ext_user_id={external_id}',
    '37479',
    'demo_cpx_secret',
    40,
    60,
    'RR',
    'Direct Stream'
),
(
    'aoyco',
    'Aoyco Offerwall Network',
    'Reward River Direct Gateway • App Lab & Games',
    'Sponsored mobile app milestones, trials & games',
    'Download sponsored apps, test emerging mobile games, and complete verified in-app actions.',
    'offers',
    TRUE,
    'https://aoyco.in/offerwall/{app_id}?user_id={external_id}',
    'aoyco_pub_demo',
    'aoyco_secret_key',
    40,
    60,
    'APP',
    'Direct Stream'
),
(
    'advertsreward',
    'AdvertsReward Network',
    'Reward River Direct Gateway • Action Tasks Stream',
    'High fill-rate micro-tasks & rewarded engagement',
    'Engage with advertiser campaigns, website sign-ups, videos, and multi-stage offers across desktop and mobile.',
    'tasks',
    TRUE,
    'https://advertsreward.com/wall?pub_id={app_id}&subid={external_id}',
    'adv_pub_demo',
    'adv_secret_key',
    40,
    60,
    'ADV',
    'Direct Stream'
)
ON CONFLICT (id) DO NOTHING;
