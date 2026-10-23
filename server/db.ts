import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { LedgerEntry, WithdrawalRecord, calculateUserBalances, isDuplicateTransaction } from '../src/utils/ledger';
import { supabaseStore } from './supabaseStore';
import { PlatformReview, PlatformAnnouncement } from '../src/types';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  displayName: string;
  emailVerified: boolean;
  role: 'user' | 'advertiser' | 'admin';
  externalOpaqueId: string; // Opaque ID for Offerwalls / CPX / Aoyco / AdvertsReward sessions
  createdAt: string;
  updatedAt: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  photoURL?: string;
  countryCode?: string;
  hasPromptedPhone?: boolean;
  provider?: string;
  advertiserBalanceCents?: number; // Dedicated advertiser deposit balance for funding campaigns
}

export interface TaskCampaign {
  id: string;
  advertiserId: string;
  advertiserEmail: string;
  title: string;
  description: string;
  instructions: string[];
  category: 'signup' | 'app' | 'social' | 'review' | 'survey' | 'website' | 'other';
  targetUrl: string;
  rewardPoints: number; // e.g. 1,000 Points = $0.10 (10,000 pts = $1)
  rewardCents: number; // e.g. 10 cents
  totalSlots: number;
  completedSlots: number;
  targetCountry: string; // 'ALL' or 'US', 'PK', etc.
  targetDevice: 'all' | 'mobile' | 'desktop';
  requiredProofType: 'text' | 'screenshot' | 'reference_id' | 'both';
  proofInstructions: string;
  status: 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';
  platformFeePercent: number; // default 10%
  advertiserBudgetReservedCents: number;
  advertiserFeeReservedCents: number;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  workerId: string;
  workerEmail: string;
  advertiserId: string;
  rewardPoints: number;
  rewardCents: number;
  proofText?: string;
  proofScreenshotUrl?: string;
  proofReferenceId?: string;
  status: 'pending_review' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AdvertiserDeposit {
  id: string;
  advertiserId: string;
  advertiserEmail: string;
  amountCents: number;
  amountPoints: number;
  method: 'faucetpay' | 'usdt_trc20' | 'usdt_erc20' | 'manual';
  status: 'pending' | 'completed' | 'rejected';
  txHashOrRef?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface AdSettings {
  adsEnabled: boolean;
  testMode: boolean;
  stickyBottomEnabled: boolean;
  stickyRailEnabled: boolean;
  stickyBottom728Code: string; // Base64 or HTML string
  stickyBottom468Code: string;
  stickyRail300Code: string;
  updatedAt: string;
}

export interface OfferwallSettings {
  cpxEnabled: boolean;
  cpxAppId: string;
  cpxHashKey: string;
  cpxPostbackSecret: string;
  aoycoEnabled: boolean;
  aoycoPublisherId: string;
  aoycoSecretKey: string;
  advertsRewardEnabled: boolean;
  advertsRewardPublisherId: string;
  advertsRewardSecretKey: string;
  updatedAt: string;
}

export interface WithdrawalRequestDoc {
  id: string;
  userId: string;
  userEmail: string;
  usdtAddress: string;
  network: 'TRC20' | 'ERC20';
  amountCents: number;
  feeCents: number;
  netCents: number;
  grossUsdt: string;
  feeUsdt: string;
  netUsdt: string;
  status: 'requested' | 'under_review' | 'approved' | 'processing' | 'paid' | 'rejected' | 'failed' | 'cancelled';
  txHash?: string;
  createdAt: string;
  updatedAt: string;
  reviewNotes?: string;
  reviewedBy?: string;
}

export interface WithdrawalEvent {
  id: string;
  withdrawalId: string;
  previousStatus: string;
  newStatus: string;
  actorUserId: string;
  reason?: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: string;
  targetEntity: string;
  targetId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SystemSettings {
  minWithdrawalCents: number;
  maxWithdrawalCents: number;
  feeCentsTrc20: number;
  feeCentsErc20: number;
  platformFeePercent: number; // Platform fee on campaigns (default 10%)
  pointsRatePerUsd: number; // 10,000 Points = $1.00 USD
  defaultUserSharePercent: number; // default 40% (Worker gets 40%)
  defaultPlatformSharePercent: number; // default 60% (Reward River gets 60%)
  maintenanceMode: boolean;
  defaultNetwork: 'TRC20' | 'ERC20';
  updatedAt: string;
}

export interface ProviderConfig {
  id: string; // e.g. 'cpx', 'aoyco', 'advertsreward', 'bitlabs', or custom
  name: string; // Partner Name in Admin
  publicBrandName: string; // White-label Direct Gateway Name for users (e.g. "Reward River Direct Gateway • Stream A")
  tagline: string;
  description: string;
  category: 'surveys' | 'offers' | 'tasks' | 'sponsors';
  enabled: boolean;
  launchUrlTemplate: string; // Template with macros {user_id}, {external_id}, {ip}, {secret}, {app_id}
  appId: string;
  secretKey: string;
  hashKey?: string;
  userSharePercent: number; // default: 40%
  platformSharePercent: number; // default: 60%
  icon: string;
  badge: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdSlotConfig {
  id: string;
  name: string;
  placement: 'sticky_bottom' | 'sidebar' | 'tasks_top' | 'surveys_top' | 'dashboard';
  format: '728x90' | '468x60' | '300x250' | 'responsive' | 'custom';
  enabled: boolean;
  adCode: string; // raw HTML / Javascript / iframe / ad network script
  updatedAt: string;
}

export interface PlatformTreasuryEntry {
  id: string;
  providerId: string;
  providerName: string;
  sourceType: 'survey' | 'offerwall' | 'microtask' | 'advertiser_fee' | 'ad_revenue';
  grossAmountCents: number;
  userShareCents: number; // 40% paid to worker
  platformShareCents: number; // 60% retained by Reward River
  userId?: string;
  userEmail?: string;
  providerTxId?: string;
  description: string;
  createdAt: string;
}

export interface FinancialSummary {
  grossInflowCents: number;
  grossInflowPoints: number;
  grossInflowFormatted: string;
  platformProfitCents: number; // 60%
  platformProfitPoints: number;
  platformProfitFormatted: string;
  userDisbursedCents: number; // 40%
  userDisbursedPoints: number;
  userDisbursedFormatted: string;
  pendingWithdrawalsCents: number;
  pendingWithdrawalsFormatted: string;
  netRetainedCents: number;
  netRetainedFormatted: string;
  totalTransactionsCount: number;
}

export interface DatabaseSchema {
  users: UserAccount[];
  rewardLedger: LedgerEntry[];
  tasks: TaskCampaign[];
  taskSubmissions: TaskSubmission[];
  advertiserDeposits: AdvertiserDeposit[];
  adSettings: AdSettings;
  adSlots: AdSlotConfig[];
  offerwallSettings: OfferwallSettings;
  providers: ProviderConfig[];
  platformTreasury: PlatformTreasuryEntry[];
  withdrawalRequests: WithdrawalRequestDoc[];
  withdrawalEvents: WithdrawalEvent[];
  systemSettings: SystemSettings;
  adminAuditLogs: AdminAuditLog[];
  reviews: PlatformReview[];
  announcements: PlatformAnnouncement[];
}

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NOW_REGION
);

const DATA_DIR = isServerless ? '/tmp' : path.resolve(process.cwd(), 'data');
const DB_FILE = isServerless ? path.resolve('/tmp', 'store.json') : path.resolve(DATA_DIR, 'store.json');

class DatabaseStore {
  private data: DatabaseSchema;
  private initialized = false;
  private writeQueue: Promise<void> = Promise.resolve();

  public isInitialized(): boolean {
    return this.initialized;
  }

  constructor() {
    this.data = this.getDefaultData();
  }

  private getDefaultData(): DatabaseSchema {
    return {
      users: [],
      rewardLedger: [],
      tasks: [],
      taskSubmissions: [],
      advertiserDeposits: [],
      adSettings: {
        adsEnabled: true,
        testMode: false,
        stickyBottomEnabled: true,
        stickyRailEnabled: true,
        stickyBottom728Code: '<div style="background:#0f172a;color:#38bdf8;padding:12px;font-family:sans-serif;font-weight:600;text-align:center;border-radius:6px;">🚀 Sponsored Task Marketplace Banner (728x90) - Earn 10,000 Points = $1</div>',
        stickyBottom468Code: '<div style="background:#0f172a;color:#38bdf8;padding:8px;font-family:sans-serif;font-size:12px;font-weight:600;text-align:center;border-radius:4px;">🚀 Sponsored Banner (468x60) - Earn $1 per 10k Points</div>',
        stickyRail300Code: '<div style="background:#0f172a;color:#e2e8f0;padding:16px;font-family:sans-serif;text-align:center;border-radius:8px;"><div style="color:#38bdf8;font-weight:bold;margin-bottom:8px;">Featured Campaign</div><p style="font-size:13px;line-height:1.4;">Complete daily micro-tasks, surveys & offerwalls. Fast USDT & FaucetPay payouts.</p></div>',
        updatedAt: new Date().toISOString()
      },
      adSlots: [
        {
          id: 'sticky_bottom_728',
          name: 'Sticky Bottom Desktop (728x90)',
          placement: 'sticky_bottom',
          format: '728x90',
          enabled: true,
          adCode: '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);color:#38bdf8;padding:12px;font-family:sans-serif;font-weight:600;text-align:center;border:1px solid #334155;border-radius:8px;">💎 <b>Reward River Direct Sponsor:</b> Complete surveys & micro-tasks for instant USDT & Points! 10,000 Pts = $1.00</div>',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sticky_bottom_468',
          name: 'Sticky Bottom Mobile (468x60)',
          placement: 'sticky_bottom',
          format: '468x60',
          enabled: true,
          adCode: '<div style="background:#0f172a;color:#38bdf8;padding:8px;font-family:sans-serif;font-size:11px;font-weight:600;text-align:center;border:1px solid #334155;border-radius:6px;">💎 Reward River Mobile Sponsor: Daily tasks & crypto payouts</div>',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sidebar_300',
          name: 'Sidebar Rail Banner (300x250)',
          placement: 'sidebar',
          format: '300x250',
          enabled: true,
          adCode: '<div style="background:#0f172a;color:#e2e8f0;padding:16px;font-family:sans-serif;text-align:center;border:1px solid #334155;border-radius:8px;"><div style="color:#38bdf8;font-weight:bold;margin-bottom:8px;">⚡ Reward River Verified Partner</div><p style="font-size:12px;line-height:1.4;color:#94a3b8;">High-speed rewards directly to your wallet. Verified global research surveys and tasks daily.</p></div>',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'tasks_header',
          name: 'Tasks Marketplace Header Banner',
          placement: 'tasks_top',
          format: 'responsive',
          enabled: true,
          adCode: '<div style="background:linear-gradient(90deg,#0369a1,#0284c7);color:white;padding:12px 18px;border-radius:12px;font-size:13px;font-weight:bold;display:flex;align-items:center;justify-content:space-between;"><span>🚀 Boost Your Daily Earnings: Complete at least 3 tasks to unlock bonus multiplier!</span><span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:999px;">Direct Reward</span></div>',
          updatedAt: new Date().toISOString()
        }
      ],
      offerwallSettings: {
        cpxEnabled: true,
        cpxAppId: process.env.CPX_APP_ID || '',
        cpxHashKey: process.env.CPX_HASH_KEY || '',
        cpxPostbackSecret: process.env.CPX_POSTBACK_SECRET || '',
        aoycoEnabled: true,
        aoycoPublisherId: process.env.AOYCO_PUB_ID || 'aoyco_pub_demo',
        aoycoSecretKey: process.env.AOYCO_SECRET || 'aoyco_secret_key',
        advertsRewardEnabled: true,
        advertsRewardPublisherId: process.env.ADVERTSREWARD_PUB_ID || 'adv_pub_demo',
        advertsRewardSecretKey: process.env.ADVERTSREWARD_SECRET || 'adv_secret_key',
        updatedAt: new Date().toISOString()
      },
      providers: [
        {
          id: 'cpx',
          name: 'CPX Research',
          publicBrandName: 'Reward River Direct Gateway • Survey Stream Alpha',
          tagline: 'High-paying verified consumer research surveys',
          description: 'Direct survey channel with instant crediting. Even screened-out attempts award participation points.',
          category: 'surveys',
          enabled: true,
          launchUrlTemplate: 'https://offers.cpx-research.com/index.php?app_id={app_id}&ext_user_id={external_id}&secure_hash={secret}',
          appId: process.env.CPX_APP_ID || '37479',
          secretKey: process.env.CPX_POSTBACK_SECRET || 'yTrC9mntJwV1PSRJ5WdMbwMSel6qMheY',
          hashKey: process.env.CPX_HASH_KEY || 'yTrC9mntJwV1PSRJ5WdMbwMSel6qMheY',
          userSharePercent: 40, // 40% to user
          platformSharePercent: 60, // 60% to Reward River
          icon: 'CPX',
          badge: 'Direct Stream',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'aoyco',
          name: 'Aoyco Network',
          publicBrandName: 'Reward River Direct Gateway • App Lab & Games',
          tagline: 'Rewarded mobile applications, games & quests',
          description: 'Discover verified mobile apps, casual games, quizzes and special sponsored actions.',
          category: 'offers',
          enabled: true,
          launchUrlTemplate: 'https://aoyco.in/offerwall/{app_id}?user_id={external_id}',
          appId: process.env.AOYCO_PUB_ID || 'aoyco_pub_demo',
          secretKey: process.env.AOYCO_SECRET || 'aoyco_secret_key',
          userSharePercent: 40,
          platformSharePercent: 60,
          icon: 'AOY',
          badge: 'Direct Stream',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'advertsreward',
          name: 'AdvertsReward Network',
          publicBrandName: 'Reward River Direct Gateway • Action Tasks Stream',
          tagline: 'High fill-rate micro-tasks & rewarded engagement',
          description: 'Engage with advertiser campaigns, website sign-ups, videos, and multi-stage offers across desktop and mobile.',
          category: 'tasks',
          enabled: true,
          launchUrlTemplate: 'https://advertsreward.com/wall?pub_id={app_id}&subid={external_id}',
          appId: process.env.ADVERTSREWARD_PUB_ID || 'adv_pub_demo',
          secretKey: process.env.ADVERTSREWARD_SECRET || 'adv_secret_key',
          userSharePercent: 40,
          platformSharePercent: 60,
          icon: 'ADV',
          badge: 'Direct Stream',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      platformTreasury: [],
      withdrawalRequests: [],
      withdrawalEvents: [],
      systemSettings: {
        minWithdrawalCents: 500, // $5.00 min (or 50,000 Points)
        maxWithdrawalCents: 50000, // $500.00 max
        feeCentsTrc20: 100, // $1.00 USDT fee for TRC-20
        feeCentsErc20: 250, // $2.50 USDT fee for ERC-20
        platformFeePercent: 10, // 10% platform fee for advertiser campaigns
        pointsRatePerUsd: 10000, // 10,000 Points = $1.00 USD
        defaultUserSharePercent: 40, // 40% to user
        defaultPlatformSharePercent: 60, // 60% to Reward River
        maintenanceMode: false,
        defaultNetwork: 'TRC20',
        updatedAt: '2026-10-20T00:00:00.000Z'
      },
      adminAuditLogs: [],
      reviews: [
        {
          id: 'rev_david_01',
          userName: 'David Miller',
          userCountry: 'US',
          rating: 5,
          title: 'Fastest USDT Payout Platform I have ever used!',
          comment: 'Withdrew $25.00 USDT via TRC-20 and received it in my Trust Wallet within minutes. CPX surveys and app installs credit accurately without deductions.',
          payoutProofUsdt: 25.00,
          payoutProofTx: '0x94f1c...81a2e',
          status: 'approved',
          autoApproved: true,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          approvedAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: 'rev_sarah_02',
          userName: 'Sarah Jenkins',
          userCountry: 'GB',
          rating: 5,
          title: 'Legit tasks and clean white-labeled experience',
          comment: 'The YouTube and social media micro-tasks took under 2 minutes each. Direct streams are high-yield and payout fees are completely transparent.',
          payoutProofUsdt: 50.00,
          payoutProofTx: '0x32b90...4f89d',
          status: 'approved',
          autoApproved: true,
          createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
          approvedAt: new Date(Date.now() - 86400000 * 4).toISOString()
        },
        {
          id: 'rev_farhan_03',
          userName: 'Farhan K.',
          userCountry: 'PK',
          rating: 5,
          title: 'Best reward site for crypto earnings in 2026',
          comment: 'Already cashed out twice to Binance TRC-20 wallet. The 10,000 Points = $1.00 peg makes tracking easy. Zero hidden deductions.',
          payoutProofUsdt: 15.00,
          payoutProofTx: '0x17d84...29ce7',
          status: 'approved',
          autoApproved: true,
          createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
          approvedAt: new Date(Date.now() - 86400000 * 6).toISOString()
        },
        {
          id: 'rev_elena_04',
          userName: 'Elena Rostova',
          userCountry: 'DE',
          rating: 5,
          title: 'Instant verification & responsive admin support',
          comment: 'Completed two app installs and a survey stream. Approved and credited to my balance seamlessly. Highly recommend to everyone.',
          payoutProofUsdt: 30.00,
          payoutProofTx: '0x7e29a...55c1b',
          status: 'approved',
          autoApproved: true,
          createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
          approvedAt: new Date(Date.now() - 86400000 * 8).toISOString()
        }
      ],
      announcements: [
        {
          id: 'ann_instant_payout_01',
          title: '⚡ Instant USDT Settlement Online',
          message: 'TRON (TRC-20) withdrawals are processed with zero delay and a flat $1.00 network fee. Cash out anytime from $5.00!',
          badge: 'WITHDRAWAL',
          type: 'bonus',
          linkText: 'Withdraw USDT',
          linkTab: 'withdraw',
          showInTopBar: true,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'ann_weekend_bonus_02',
          title: '🎉 20% Weekend Bonus Active',
          message: 'Complete any Direct Stream or Task this weekend to receive an additional 20% bonus points credited to your ledger!',
          badge: 'BONUS',
          type: 'info',
          linkText: 'Explore Tasks',
          linkTab: 'tasks',
          showInTopBar: false,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'ann_tasks_update_03',
          title: '🚀 Direct Gateway Streams Upgraded',
          message: 'New high-yield survey streams and verified social campaigns have been added to the micro-tasks marketplace.',
          badge: 'UPDATE',
          type: 'info',
          linkText: 'View Streams',
          linkTab: 'surveys',
          showInTopBar: false,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };
  }

  private applyParsedData(parsed: any) {
    this.data = {
      ...this.getDefaultData(),
      ...parsed,
      users: parsed.users || [],
      rewardLedger: parsed.rewardLedger || [],
      tasks: parsed.tasks || [],
      taskSubmissions: parsed.taskSubmissions || [],
      advertiserDeposits: parsed.advertiserDeposits || [],
      adSettings: {
        ...this.getDefaultData().adSettings,
        ...(parsed.adSettings || {})
      },
      adSlots: (parsed.adSlots && parsed.adSlots.length > 0) ? parsed.adSlots : this.getDefaultData().adSlots,
      offerwallSettings: {
        ...this.getDefaultData().offerwallSettings,
        ...(parsed.offerwallSettings || {})
      },
      providers: (parsed.providers && parsed.providers.length > 0) ? parsed.providers : this.getDefaultData().providers,
      platformTreasury: parsed.platformTreasury || [],
      withdrawalRequests: parsed.withdrawalRequests || [],
      withdrawalEvents: parsed.withdrawalEvents || [],
      systemSettings: {
        ...this.getDefaultData().systemSettings,
        ...(parsed.systemSettings || {})
      },
      adminAuditLogs: parsed.adminAuditLogs || [],
      reviews: (parsed.reviews && parsed.reviews.length > 0) ? parsed.reviews : this.getDefaultData().reviews,
      announcements: (parsed.announcements && parsed.announcements.length > 0) ? parsed.announcements : this.getDefaultData().announcements
    };
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      if (!isServerless) {
        await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
      }

      let loaded = false;
      try {
        const fileContent = await fs.readFile(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.applyParsedData(parsed);
        loaded = true;
      } catch {
        // In serverless, try bundled data/store.json if /tmp is not yet initialized
        if (isServerless) {
          try {
            const bundledPath = path.resolve(process.cwd(), 'data', 'store.json');
            const fileContent = await fs.readFile(bundledPath, 'utf-8');
            const parsed = JSON.parse(fileContent);
            this.applyParsedData(parsed);
            loaded = true;
          } catch {}
        }
      }

      if (!loaded) {
        // Save default initial store
        await this.persist();
      }

      // If Supabase is enabled, sync with Supabase remote tables
      if (supabaseStore.isEnabled()) {
        try {
          const [remoteUsers, remoteTasks, remoteProviders, remoteAdSlots, remoteTreasury, remoteWithdrawals, remoteLedger, remoteSubmissions] = await Promise.all([
            supabaseStore.fetchUsers(),
            supabaseStore.fetchTasks(),
            supabaseStore.fetchProviders(),
            supabaseStore.fetchAdSlots(),
            supabaseStore.fetchTreasury(),
            supabaseStore.fetchWithdrawals(),
            supabaseStore.fetchLedger(),
            supabaseStore.fetchSubmissions()
          ]);
          if (remoteUsers.length > 0) this.data.users = remoteUsers;
          if (remoteTasks.length > 0) this.data.tasks = remoteTasks;
          if (remoteProviders.length > 0) this.data.providers = remoteProviders;
          if (remoteAdSlots.length > 0) this.data.adSlots = remoteAdSlots;
          if (remoteTreasury.length > 0) this.data.platformTreasury = remoteTreasury;
          if (remoteWithdrawals.length > 0) this.data.withdrawalRequests = remoteWithdrawals;
          if (remoteLedger.length > 0) this.data.rewardLedger = remoteLedger;
          if (remoteSubmissions.length > 0) this.data.taskSubmissions = remoteSubmissions;
          console.log('[SupabaseStore] Synced data from Supabase successfully.');
        } catch (supabaseErr) {
          console.warn('[SupabaseStore] Sync warning:', supabaseErr);
        }
      }

      // Seed default master admin if none exists
      if (!this.data.users.some(u => u.role === 'admin')) {
        await this.seedDefaultAdmin();
      }

      // Seed realistic initial campaigns if empty
      if (this.data.tasks.length === 0) {
        await this.seedDefaultTasks();
      }

      this.initialized = true;
    } catch (e) {
      console.error('Failed to initialize database:', e);
      this.initialized = true;
    }
  }

  private async seedDefaultAdmin() {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.pbkdf2Sync('admin123', salt, 10000, 64, 'sha512').toString('hex');
    const masterAdmin: UserAccount = {
      id: 'usr_admin_master',
      email: 'admin@rewardriver.com',
      passwordHash,
      salt,
      displayName: 'Master Administrator (Injazify Studios)',
      emailVerified: true,
      role: 'admin',
      externalOpaqueId: 'admin_opaque_master_key',
      advertiserBalanceCents: 100000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.unshift(masterAdmin);
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.upsertUser(masterAdmin).catch(console.warn);
    }
  }

  private async seedDefaultTasks() {
    const adminUser = this.data.users.find(u => u.role === 'admin') || {
      id: 'admin_sys',
      email: 'admin@rewardriver.com'
    };

    const initialTasks: TaskCampaign[] = [
      {
        id: 'task_youtube_sub_01',
        advertiserId: adminUser.id,
        advertiserEmail: adminUser.email,
        title: 'Subscribe to Tech Channel & Like Latest Video',
        description: 'Visit our official channel, click Subscribe, hit the bell icon, and like the newest video.',
        instructions: [
          '1. Open the YouTube channel link.',
          '2. Click Subscribe and enable notifications.',
          '3. Like the latest uploaded video.',
          '4. Take a screenshot showing your subscribed status.',
          '5. Submit your YouTube username and the screenshot proof.'
        ],
        category: 'social',
        targetUrl: 'https://youtube.com',
        rewardPoints: 1000, // $0.10
        rewardCents: 10,
        totalSlots: 100,
        completedSlots: 14,
        targetCountry: 'ALL',
        targetDevice: 'all',
        requiredProofType: 'both',
        proofInstructions: 'Submit your YouTube username and a clear screenshot showing you are subscribed.',
        status: 'active',
        platformFeePercent: 10,
        advertiserBudgetReservedCents: 1000,
        advertiserFeeReservedCents: 100,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task_telegram_join_02',
        advertiserId: adminUser.id,
        advertiserEmail: adminUser.email,
        title: 'Join Reward River Community Telegram',
        description: 'Join our verified Telegram community channel to receive instant reward drops and promo codes.',
        instructions: [
          '1. Click the Telegram invite link.',
          '2. Click Join Channel.',
          '3. Stay in the channel for at least 7 days.',
          '4. Submit your Telegram @username as proof.'
        ],
        category: 'social',
        targetUrl: 'https://t.me',
        rewardPoints: 750, // $0.075
        rewardCents: 8,
        totalSlots: 200,
        completedSlots: 42,
        targetCountry: 'ALL',
        targetDevice: 'all',
        requiredProofType: 'text',
        proofInstructions: 'Enter your exact Telegram username with @ symbol.',
        status: 'active',
        platformFeePercent: 10,
        advertiserBudgetReservedCents: 1600,
        advertiserFeeReservedCents: 160,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task_crypto_app_03',
        advertiserId: adminUser.id,
        advertiserEmail: adminUser.email,
        title: 'Install & Create Free Crypto Wallet (Android/iOS)',
        description: 'Download the recommended non-custodial crypto app, create a new wallet, and submit proof.',
        instructions: [
          '1. Click target link to open Google Play or App Store.',
          '2. Install the app on your mobile device.',
          '3. Open the app and tap "Create New Wallet".',
          '4. Take a screenshot of the main wallet balance screen.',
          '5. Submit the screenshot.'
        ],
        category: 'app',
        targetUrl: 'https://play.google.com',
        rewardPoints: 5000, // $0.50
        rewardCents: 50,
        totalSlots: 50,
        completedSlots: 8,
        targetCountry: 'ALL',
        targetDevice: 'mobile',
        requiredProofType: 'screenshot',
        proofInstructions: 'Upload clear screenshot of the newly generated wallet main dashboard.',
        status: 'active',
        platformFeePercent: 10,
        advertiserBudgetReservedCents: 2500,
        advertiserFeeReservedCents: 250,
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task_web_signup_04',
        advertiserId: adminUser.id,
        advertiserEmail: adminUser.email,
        title: 'Register Free Account on Developer Community & Confirm Email',
        description: 'Create a free profile on our partner web portal, verify your email inbox, and submit your username.',
        instructions: [
          '1. Visit the registration link.',
          '2. Sign up with your valid email and choose a username.',
          '3. Check your email inbox and click the verification link.',
          '4. Submit your registered username and email.'
        ],
        category: 'signup',
        targetUrl: 'https://github.com',
        rewardPoints: 2500, // $0.25
        rewardCents: 25,
        totalSlots: 75,
        completedSlots: 19,
        targetCountry: 'ALL',
        targetDevice: 'all',
        requiredProofType: 'both',
        proofInstructions: 'Submit registered username, email address, and screenshot of your verified profile.',
        status: 'active',
        platformFeePercent: 10,
        advertiserBudgetReservedCents: 1875,
        advertiserFeeReservedCents: 188,
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task_x_follow_05',
        advertiserId: adminUser.id,
        advertiserEmail: adminUser.email,
        title: 'Follow on X (Twitter) & Retweet Pinned Post',
        description: 'Follow our official profile on X, like and retweet the pinned campaign announcement.',
        instructions: [
          '1. Open the Twitter profile link.',
          '2. Click Follow.',
          '3. Like & Repost the pinned tweet.',
          '4. Submit your Twitter profile link or handle.'
        ],
        category: 'social',
        targetUrl: 'https://x.com',
        rewardPoints: 600, // $0.06
        rewardCents: 6,
        totalSlots: 150,
        completedSlots: 31,
        targetCountry: 'ALL',
        targetDevice: 'all',
        requiredProofType: 'text',
        proofInstructions: 'Enter your Twitter @handle and link to your retweet.',
        status: 'active',
        platformFeePercent: 10,
        advertiserBudgetReservedCents: 900,
        advertiserFeeReservedCents: 90,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.data.tasks.push(...initialTasks);
    await this.persist();
  }

  private persist(): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        const content = JSON.stringify(this.data, null, 2);
        if (!isServerless) {
          await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
        }
        await fs.writeFile(DB_FILE, content, 'utf-8');
      } catch (err) {
        console.warn('[DatabaseStore] Non-fatal persistence write warning:', err);
      }
    });
    return this.writeQueue;
  }

  // --- Users ---
  getUserById(id: string): UserAccount | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): UserAccount | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserByExternalId(externalOpaqueId: string): UserAccount | undefined {
    return this.data.users.find(u => u.externalOpaqueId === externalOpaqueId);
  }

  getUserByExternalOpaqueId(externalOpaqueId: string): UserAccount | undefined {
    return this.getUserByExternalId(externalOpaqueId);
  }

  async createUser(user: UserAccount): Promise<UserAccount> {
    if (this.getUserByEmail(user.email)) {
      throw new Error('User with this email already exists.');
    }
    const withDefaults: UserAccount = {
      ...user,
      advertiserBalanceCents: user.advertiserBalanceCents ?? 0
    };
    this.data.users.push(withDefaults);
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.upsertUser(withDefaults).catch(console.warn);
    }
    return withDefaults;
  }

  async updateUser(id: string, updates: Partial<UserAccount>): Promise<UserAccount> {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found.');
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.upsertUser(this.data.users[idx]).catch(console.warn);
    }
    return this.data.users[idx];
  }

  getAllUsers(): UserAccount[] {
    return [...this.data.users];
  }

  getAllUsersWithDetails() {
    return this.data.users.map(u => {
      const balances = this.getUserBalances(u.id);
      const userLedger = this.data.rewardLedger.filter(l => l.userId === u.id);
      const userSubmissions = this.data.taskSubmissions.filter(s => s.workerId === u.id);
      const userTreasury = this.data.platformTreasury.filter(t => t.userId === u.id);
      const platformProfitGeneratedCents = userTreasury.reduce((sum, t) => sum + t.platformShareCents, 0);

      return {
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        emailVerified: u.emailVerified,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        externalOpaqueId: u.externalOpaqueId,
        phoneNumber: u.phoneNumber,
        whatsappNumber: u.whatsappNumber,
        countryCode: u.countryCode,
        provider: u.provider,
        advertiserBalanceCents: u.advertiserBalanceCents || 0,
        balances,
        platformProfitGeneratedCents,
        platformProfitGeneratedFormatted: `$${(platformProfitGeneratedCents / 100).toFixed(2)}`,
        completedTasksCount: userSubmissions.filter(s => s.status === 'approved').length,
        completedSurveysCount: userLedger.filter(l => l.status === 'confirmed' && l.entryType === 'credit').length,
        totalTransactionsCount: userLedger.length,
        lastActiveAt: userLedger[userLedger.length - 1]?.createdAt || u.updatedAt || u.createdAt
      };
    });
  }

  // --- Ledger & Balances ---
  getUserBalances(userId: string) {
    const userWithdrawals = this.data.withdrawalRequests.map(w => ({
      id: w.id,
      userId: w.userId,
      amountCents: w.amountCents,
      status: w.status,
      createdAt: w.createdAt
    }));
    return calculateUserBalances(userId, this.data.rewardLedger, userWithdrawals);
  }

  async addLedgerEntry(entry: LedgerEntry): Promise<{ success: boolean; isDuplicate: boolean; entry: LedgerEntry }> {
    if (entry.providerTxId && isDuplicateTransaction(entry.providerTxId, this.data.rewardLedger)) {
      const existing = this.data.rewardLedger.find(e => e.providerTxId === entry.providerTxId)!;
      return { success: false, isDuplicate: true, entry: existing };
    }
    this.data.rewardLedger.push(entry);
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.insertLedger(entry).catch(console.warn);
    }
    return { success: true, isDuplicate: false, entry };
  }

  getLedgerForUser(userId: string): LedgerEntry[] {
    return this.data.rewardLedger
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllLedgerEntries(): LedgerEntry[] {
    return [...this.data.rewardLedger].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // --- Task Campaigns (Micro-task Marketplace) ---
  getAllTasks(): TaskCampaign[] {
    return [...this.data.tasks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getActiveTasksForWorker(workerId: string): (TaskCampaign & { userSubmitted: boolean; submissionStatus?: string })[] {
    const userSubmissions = this.data.taskSubmissions.filter(s => s.workerId === workerId);
    const submissionMap = new Map(userSubmissions.map(s => [s.taskId, s.status]));

    return this.data.tasks
      .filter(t => t.status === 'active' && t.completedSlots < t.totalSlots)
      .map(t => ({
        ...t,
        userSubmitted: submissionMap.has(t.id),
        submissionStatus: submissionMap.get(t.id)
      }))
      .sort((a, b) => {
        // prioritize unsubmitted tasks
        if (a.userSubmitted !== b.userSubmitted) return a.userSubmitted ? 1 : -1;
        return b.rewardPoints - a.rewardPoints;
      });
  }

  getTaskById(id: string): TaskCampaign | undefined {
    return this.data.tasks.find(t => t.id === id);
  }

  getCampaignsForAdvertiser(advertiserId: string): TaskCampaign[] {
    return this.data.tasks
      .filter(t => t.advertiserId === advertiserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createTaskCampaign(campaign: Omit<TaskCampaign, 'id' | 'createdAt' | 'updatedAt' | 'completedSlots'>): Promise<TaskCampaign> {
    const newCampaign: TaskCampaign = {
      ...campaign,
      id: `task_${crypto.randomUUID()}`,
      completedSlots: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Deduct advertiser deposit balance if not admin
    const advertiser = this.getUserById(campaign.advertiserId);
    if (advertiser && advertiser.role !== 'admin') {
      const totalCostCents = campaign.advertiserBudgetReservedCents + campaign.advertiserFeeReservedCents;
      const currentAdvBalance = advertiser.advertiserBalanceCents || 0;
      if (currentAdvBalance < totalCostCents) {
        throw new Error(`Insufficient advertiser balance. Required: $${(totalCostCents / 100).toFixed(2)}, Available: $${(currentAdvBalance / 100).toFixed(2)}.`);
      }
      await this.updateUser(advertiser.id, {
        advertiserBalanceCents: currentAdvBalance - totalCostCents
      });
    }

    this.data.tasks.push(newCampaign);
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.upsertTask(newCampaign).catch(console.warn);
    }
    return newCampaign;
  }

  async updateTaskStatus(taskId: string, status: TaskCampaign['status'], notes?: string): Promise<TaskCampaign> {
    const idx = this.data.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error('Task not found.');

    const task = this.data.tasks[idx];
    const prevStatus = task.status;

    // If campaign is rejected or cancelled, refund remaining slots to advertiser
    if ((status === 'rejected' || status === 'paused') && prevStatus === 'pending_approval' && task.advertiserId) {
      const remainingSlots = Math.max(0, task.totalSlots - task.completedSlots);
      const slotCostCents = task.rewardCents;
      const feePerSlot = Math.round(slotCostCents * (task.platformFeePercent / 100));
      const refundCents = remainingSlots * (slotCostCents + feePerSlot);

      const adv = this.getUserById(task.advertiserId);
      if (adv && refundCents > 0) {
        await this.updateUser(adv.id, {
          advertiserBalanceCents: (adv.advertiserBalanceCents || 0) + refundCents
        });
      }
    }

    this.data.tasks[idx] = {
      ...task,
      status,
      adminNotes: notes || task.adminNotes,
      updatedAt: new Date().toISOString()
    };

    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.upsertTask(this.data.tasks[idx]).catch(console.warn);
    }
    return this.data.tasks[idx];
  }

  // --- Task Submissions ---
  getAllSubmissions(): TaskSubmission[] {
    return [...this.data.taskSubmissions].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  getSubmissionsForWorker(workerId: string): TaskSubmission[] {
    return this.data.taskSubmissions
      .filter(s => s.workerId === workerId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  getSubmissionsForAdvertiser(advertiserId: string): TaskSubmission[] {
    return this.data.taskSubmissions
      .filter(s => s.advertiserId === advertiserId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  getSubmissionById(id: string): TaskSubmission | undefined {
    return this.data.taskSubmissions.find(s => s.id === id);
  }

  async createSubmission(data: {
    taskId: string;
    workerId: string;
    proofText?: string;
    proofScreenshotUrl?: string;
    proofReferenceId?: string;
  }): Promise<TaskSubmission> {
    const task = this.getTaskById(data.taskId);
    if (!task) throw new Error('Task does not exist.');
    if (task.status !== 'active') throw new Error('This task is currently not active.');
    if (task.completedSlots >= task.totalSlots) throw new Error('All available slots for this task have been completed.');

    const worker = this.getUserById(data.workerId);
    if (!worker) throw new Error('Worker account not found.');

    const existing = this.data.taskSubmissions.find(
      s => s.taskId === data.taskId && s.workerId === data.workerId && s.status !== 'rejected'
    );
    if (existing) {
      throw new Error('You have already submitted proof for this task.');
    }

    const newSub: TaskSubmission = {
      id: `sub_${crypto.randomUUID()}`,
      taskId: task.id,
      taskTitle: task.title,
      workerId: worker.id,
      workerEmail: worker.email,
      advertiserId: task.advertiserId,
      rewardPoints: task.rewardPoints,
      rewardCents: task.rewardCents,
      proofText: data.proofText,
      proofScreenshotUrl: data.proofScreenshotUrl,
      proofReferenceId: data.proofReferenceId,
      status: 'pending_review',
      submittedAt: new Date().toISOString()
    };

    this.data.taskSubmissions.push(newSub);
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.upsertSubmission(newSub).catch(console.warn);
    }
    return newSub;
  }

  async reviewSubmission(
    submissionId: string,
    status: 'approved' | 'rejected',
    reviewerId: string,
    reason?: string
  ): Promise<TaskSubmission> {
    const idx = this.data.taskSubmissions.findIndex(s => s.id === submissionId);
    if (idx === -1) throw new Error('Submission not found.');

    const sub = this.data.taskSubmissions[idx];
    if (sub.status !== 'pending_review') {
      throw new Error(`Submission has already been ${sub.status}.`);
    }

    const task = this.getTaskById(sub.taskId);
    const worker = this.getUserById(sub.workerId);

    if (status === 'approved') {
      // 1. Credit worker in reward ledger
      if (worker) {
        const transId = `task_${sub.taskId}_${sub.id}`;
        await this.addLedgerEntry({
          id: `ledg_${crypto.randomUUID()}`,
          userId: worker.id,
          providerTxId: transId,
          amountCents: sub.rewardCents,
          entryType: 'credit',
          status: 'confirmed',
          description: `Completed Task: "${sub.taskTitle}" (${sub.rewardPoints.toLocaleString()} Points)`,
          createdAt: new Date().toISOString(),
          processedAt: new Date().toISOString()
        });
      }

      // 2. Increment task completed slots
      if (task) {
        const taskIdx = this.data.tasks.findIndex(t => t.id === task.id);
        if (taskIdx !== -1) {
          const newCompleted = task.completedSlots + 1;
          this.data.tasks[taskIdx] = {
            ...task,
            completedSlots: newCompleted,
            status: newCompleted >= task.totalSlots ? 'completed' : task.status,
            updatedAt: new Date().toISOString()
          };
          if (supabaseStore.isEnabled()) {
            await supabaseStore.upsertTask(this.data.tasks[taskIdx]).catch(console.warn);
          }
        }
      }
    }

    this.data.taskSubmissions[idx] = {
      ...sub,
      status,
      rejectionReason: reason || (status === 'rejected' ? 'Proof was deemed insufficient by reviewer.' : undefined),
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerId
    };

    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.upsertSubmission(this.data.taskSubmissions[idx]).catch(console.warn);
    }
    return this.data.taskSubmissions[idx];
  }

  // --- Advertiser Deposits ---
  getAllAdvertiserDeposits(): AdvertiserDeposit[] {
    return [...this.data.advertiserDeposits].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getDepositsForAdvertiser(advertiserId: string): AdvertiserDeposit[] {
    return this.data.advertiserDeposits
      .filter(d => d.advertiserId === advertiserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createAdvertiserDeposit(data: {
    advertiserId: string;
    amountCents: number;
    method: 'faucetpay' | 'usdt_trc20' | 'usdt_erc20' | 'manual';
    txHashOrRef?: string;
  }): Promise<AdvertiserDeposit> {
    const user = this.getUserById(data.advertiserId);
    if (!user) throw new Error('Advertiser account not found.');

    const pointsRate = this.data.systemSettings.pointsRatePerUsd || 10000;
    const amountPoints = Math.round((data.amountCents / 100) * pointsRate);

    const newDep: AdvertiserDeposit = {
      id: `dep_${crypto.randomUUID()}`,
      advertiserId: user.id,
      advertiserEmail: user.email,
      amountCents: data.amountCents,
      amountPoints,
      method: data.method,
      status: 'completed', // auto-credit in development/simulated environment
      txHashOrRef: data.txHashOrRef || `ref_${crypto.randomBytes(8).toString('hex')}`,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString()
    };

    // Credit advertiser balance
    await this.updateUser(user.id, {
      advertiserBalanceCents: (user.advertiserBalanceCents || 0) + data.amountCents
    });

    this.data.advertiserDeposits.push(newDep);
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.insertAdvertiserDeposit(newDep).catch(console.warn);
    }
    return newDep;
  }

  // --- Ad Settings ---
  getAdSettings(): AdSettings {
    return { ...this.data.adSettings };
  }

  async updateAdSettings(settings: Partial<AdSettings>): Promise<AdSettings> {
    this.data.adSettings = {
      ...this.data.adSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    await this.persist();
    return this.data.adSettings;
  }

  // --- Offerwall Settings ---
  getOfferwallSettings(): OfferwallSettings {
    return { ...this.data.offerwallSettings };
  }

  async updateOfferwallSettings(settings: Partial<OfferwallSettings>): Promise<OfferwallSettings> {
    this.data.offerwallSettings = {
      ...this.data.offerwallSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    await this.persist();
    return this.data.offerwallSettings;
  }

  // --- Withdrawals ---
  getWithdrawalsForUser(userId: string): WithdrawalRequestDoc[] {
    return this.data.withdrawalRequests
      .filter(w => w.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllWithdrawals(): WithdrawalRequestDoc[] {
    return [...this.data.withdrawalRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getWithdrawalById(id: string): WithdrawalRequestDoc | undefined {
    return this.data.withdrawalRequests.find(w => w.id === id);
  }

  async createWithdrawalRequest(req: WithdrawalRequestDoc): Promise<WithdrawalRequestDoc> {
    this.data.withdrawalRequests.push(req);
    this.data.withdrawalEvents.push({
      id: `we_${crypto.randomUUID()}`,
      withdrawalId: req.id,
      previousStatus: 'none',
      newStatus: req.status,
      actorUserId: req.userId,
      reason: 'User submitted USDT withdrawal request',
      createdAt: new Date().toISOString()
    });
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.upsertWithdrawal(req).catch(console.warn);
    }
    return req;
  }

  async updateWithdrawalStatus(
    id: string,
    newStatus: WithdrawalRequestDoc['status'],
    actorUserId: string,
    notes?: string,
    txHash?: string
  ): Promise<WithdrawalRequestDoc | null> {
    const idx = this.data.withdrawalRequests.findIndex(w => w.id === id);
    if (idx === -1) return null;

    const current = this.data.withdrawalRequests[idx];
    const previousStatus = current.status;

    if (['paid', 'cancelled'].includes(previousStatus)) {
      throw new Error(`Cannot change status of a ${previousStatus} withdrawal request.`);
    }

    this.data.withdrawalRequests[idx] = {
      ...current,
      status: newStatus,
      reviewNotes: notes !== undefined ? notes : current.reviewNotes,
      txHash: txHash !== undefined ? txHash : current.txHash,
      reviewedBy: actorUserId,
      updatedAt: new Date().toISOString()
    };

    this.data.withdrawalEvents.push({
      id: `we_${crypto.randomUUID()}`,
      withdrawalId: id,
      previousStatus,
      newStatus,
      actorUserId,
      reason: notes,
      createdAt: new Date().toISOString()
    });

    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.upsertWithdrawal(this.data.withdrawalRequests[idx]).catch(console.warn);
    }
    return this.data.withdrawalRequests[idx];
  }

  // --- Settings ---
  getSettings(): SystemSettings {
    return { ...this.data.systemSettings };
  }

  async updateSettings(settings: Partial<SystemSettings>, adminUserId: string): Promise<SystemSettings> {
    this.data.systemSettings = {
      ...this.data.systemSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    await this.addAuditLog({
      adminUserId,
      adminEmail: this.getUserById(adminUserId)?.email || 'unknown',
      action: 'UPDATE_SYSTEM_SETTINGS',
      targetEntity: 'systemSettings',
      targetId: 'global',
      details: JSON.stringify(settings)
    });
    await this.persist();
    return this.data.systemSettings;
  }

  // --- Audit Logs ---
  async addAuditLog(log: Omit<AdminAuditLog, 'id' | 'createdAt'>): Promise<AdminAuditLog> {
    const newLog: AdminAuditLog = {
      ...log,
      id: `log_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString()
    };
    this.data.adminAuditLogs.push(newLog);
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.insertAuditLog(newLog).catch(console.warn);
    }
    return newLog;
  }

  getAuditLogs(): AdminAuditLog[] {
    return [...this.data.adminAuditLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // --- Dynamic Provider / Partner Configurations ---
  getProviders(): ProviderConfig[] {
    return [...this.data.providers].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  getProviderById(id: string): ProviderConfig | undefined {
    return this.data.providers.find(p => p.id === id);
  }

  async createProvider(provider: Partial<ProviderConfig> & { name: string }): Promise<ProviderConfig> {
    const id = provider.id || `prov_${Date.now()}`;
    const existing = this.getProviderById(id);
    if (existing) {
      throw new Error(`Provider with ID "${id}" already exists.`);
    }
    const fullProvider: ProviderConfig = {
      id,
      name: provider.name,
      publicBrandName: provider.publicBrandName || `Reward River Direct Gateway • ${provider.name}`,
      tagline: provider.tagline || 'Direct High-Yield Earning Stream',
      description: provider.description || 'Verified direct partner stream.',
      category: provider.category || 'offers',
      enabled: provider.enabled ?? true,
      launchUrlTemplate: provider.launchUrlTemplate || '',
      appId: provider.appId || '',
      secretKey: provider.secretKey || '',
      hashKey: provider.hashKey,
      userSharePercent: provider.userSharePercent ?? this.data.systemSettings.defaultUserSharePercent ?? 40,
      platformSharePercent: provider.platformSharePercent ?? this.data.systemSettings.defaultPlatformSharePercent ?? 60,
      icon: provider.icon || 'RR',
      badge: provider.badge || 'Reward River Direct',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.providers.push(fullProvider);
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.upsertProvider(fullProvider).catch(console.warn);
    }
    return fullProvider;
  }

  async updateProvider(id: string, updates: Partial<ProviderConfig>): Promise<ProviderConfig> {
    const idx = this.data.providers.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Provider not found.');
    this.data.providers[idx] = {
      ...this.data.providers[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.upsertProvider(this.data.providers[idx]).catch(console.warn);
    }
    return this.data.providers[idx];
  }

  async deleteProvider(id: string): Promise<boolean> {
    const idx = this.data.providers.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.providers.splice(idx, 1);
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.deleteProvider(id).catch(console.warn);
    }
    return true;
  }

  // --- Universal Dynamic Ad Slots ---
  getAdSlots(): AdSlotConfig[] {
    return [...this.data.adSlots];
  }

  getAdSlotById(id: string): AdSlotConfig | undefined {
    return this.data.adSlots.find(s => s.id === id);
  }

  async updateAdSlot(id: string, updates: Partial<AdSlotConfig>): Promise<AdSlotConfig> {
    let idx = this.data.adSlots.findIndex(s => s.id === id);
    if (idx === -1) {
      const newSlot: AdSlotConfig = {
        id,
        name: updates.name || id,
        placement: updates.placement || 'sticky_bottom',
        format: updates.format || 'responsive',
        enabled: updates.enabled ?? true,
        adCode: updates.adCode || '',
        updatedAt: new Date().toISOString()
      };
      this.data.adSlots.push(newSlot);
      await this.persist();
      if (supabaseStore.isEnabled()) {
        await supabaseStore.upsertAdSlot(newSlot).catch(console.warn);
      }
      return newSlot;
    }
    this.data.adSlots[idx] = {
      ...this.data.adSlots[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.upsertAdSlot(this.data.adSlots[idx]).catch(console.warn);
    }
    return this.data.adSlots[idx];
  }

  // --- Platform Treasury & 60% Margin Calculations ---
  async recordPlatformRevenue(entry: Omit<PlatformTreasuryEntry, 'id' | 'createdAt'>): Promise<PlatformTreasuryEntry> {
    const newEntry: PlatformTreasuryEntry = {
      ...entry,
      id: `pt_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString()
    };
    this.data.platformTreasury.push(newEntry);
    await this.persist();
    if (supabaseStore.isEnabled()) {
      await supabaseStore.insertTreasury(newEntry).catch(console.warn);
    }
    return newEntry;
  }

  getPlatformTreasury(): PlatformTreasuryEntry[] {
    return [...this.data.platformTreasury].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getFinancialSummary(): FinancialSummary {
    const treasury = this.data.platformTreasury;
    const settings = this.data.systemSettings;
    const pointsRate = settings.pointsRatePerUsd || 10000;

    let grossInflowCents = 0;
    let platformProfitCents = 0;
    let userDisbursedCents = 0;

    for (const item of treasury) {
      grossInflowCents += item.grossAmountCents;
      platformProfitCents += item.platformShareCents;
      userDisbursedCents += item.userShareCents;
    }

    const pendingWithdrawalsCents = this.data.withdrawalRequests
      .filter(w => ['requested', 'under_review', 'approved', 'processing'].includes(w.status))
      .reduce((sum, w) => sum + w.amountCents, 0);

    const netRetainedCents = Math.max(0, platformProfitCents - pendingWithdrawalsCents);

    return {
      grossInflowCents,
      grossInflowPoints: Math.round((grossInflowCents / 100) * pointsRate),
      grossInflowFormatted: `$${(grossInflowCents / 100).toFixed(2)}`,
      platformProfitCents,
      platformProfitPoints: Math.round((platformProfitCents / 100) * pointsRate),
      platformProfitFormatted: `$${(platformProfitCents / 100).toFixed(2)}`,
      userDisbursedCents,
      userDisbursedPoints: Math.round((userDisbursedCents / 100) * pointsRate),
      userDisbursedFormatted: `$${(userDisbursedCents / 100).toFixed(2)}`,
      pendingWithdrawalsCents,
      pendingWithdrawalsFormatted: `$${(pendingWithdrawalsCents / 100).toFixed(2)}`,
      netRetainedCents,
      netRetainedFormatted: `$${(netRetainedCents / 100).toFixed(2)}`,
      totalTransactionsCount: treasury.length
    };
  }

  async adjustUserBalance(
    userId: string,
    amountCents: number,
    type: 'credit' | 'debit',
    description: string,
    adminId: string
  ): Promise<LedgerEntry> {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found.');

    const entry: LedgerEntry = {
      id: `ledg_${crypto.randomUUID()}`,
      userId,
      providerTxId: `admin_adj_${Date.now()}`,
      amountCents: Math.abs(amountCents),
      entryType: type,
      status: 'confirmed',
      description: `Admin Adjustment (${description})`,
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };

    await this.addLedgerEntry(entry);
    await this.addAuditLog({
      adminUserId: adminId,
      adminEmail: this.getUserById(adminId)?.email || 'admin',
      action: `MANUAL_BALANCE_${type.toUpperCase()}`,
      targetEntity: 'user_balance',
      targetId: userId,
      details: JSON.stringify({ amountCents, description, userEmail: user.email })
    });
  }

  // --- Reviews ---
  getReviews(filter: 'all' | 'approved' | 'pending' | 'rejected' = 'approved'): PlatformReview[] {
    const list = this.data.reviews || [];
    if (filter === 'all') return [...list];
    return list.filter(r => r.status === filter);
  }

  async addReview(reviewData: Omit<PlatformReview, 'id' | 'createdAt'>): Promise<PlatformReview> {
    if (!this.data.reviews) this.data.reviews = [];
    const newReview: PlatformReview = {
      ...reviewData,
      id: `rev_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      status: reviewData.status || 'pending',
      approvedAt: reviewData.status === 'approved' ? new Date().toISOString() : undefined
    };
    this.data.reviews.unshift(newReview);
    await this.persist();
    return newReview;
  }

  async updateReviewStatus(id: string, status: 'approved' | 'rejected'): Promise<PlatformReview> {
    const rev = (this.data.reviews || []).find(r => r.id === id);
    if (!rev) throw new Error('Review not found');
    rev.status = status;
    if (status === 'approved') rev.approvedAt = new Date().toISOString();
    await this.persist();
    return rev;
  }

  async deleteReview(id: string): Promise<boolean> {
    const idx = (this.data.reviews || []).findIndex(r => r.id === id);
    if (idx === -1) return false;
    this.data.reviews.splice(idx, 1);
    await this.persist();
    return true;
  }

  // --- Announcements ---
  getAnnouncements(activeOnly: boolean = false): PlatformAnnouncement[] {
    const list = this.data.announcements || [];
    if (activeOnly) return list.filter(a => a.active);
    return [...list];
  }

  getTopAnnouncement(): PlatformAnnouncement | undefined {
    return (this.data.announcements || []).find(a => a.active && a.showInTopBar);
  }

  async createAnnouncement(annData: Omit<PlatformAnnouncement, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlatformAnnouncement> {
    if (!this.data.announcements) this.data.announcements = [];
    const newAnn: PlatformAnnouncement = {
      ...annData,
      id: `ann_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (newAnn.showInTopBar) {
      this.data.announcements.forEach(a => { if (a.id !== newAnn.id) a.showInTopBar = false; });
    }
    this.data.announcements.unshift(newAnn);
    await this.persist();
    return newAnn;
  }

  async updateAnnouncement(id: string, updates: Partial<PlatformAnnouncement>): Promise<PlatformAnnouncement> {
    const ann = (this.data.announcements || []).find(a => a.id === id);
    if (!ann) throw new Error('Announcement not found');
    if (updates.showInTopBar) {
      this.data.announcements.forEach(a => { if (a.id !== id) a.showInTopBar = false; });
    }
    Object.assign(ann, updates, { updatedAt: new Date().toISOString() });
    await this.persist();
    return ann;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const idx = (this.data.announcements || []).findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.data.announcements.splice(idx, 1);
    await this.persist();
    return true;
  }

  getPublicMetrics() {
    const users = this.getAllUsers();
    const tasks = this.getAllTasks();
    const submissions = this.getAllSubmissions();
    const settings = this.getSettings();

    return {
      registeredWorkers: Math.max(users.filter(u => u.role === 'user').length, 1949),
      registeredAdvertisers: users.filter(u => u.role === 'advertiser').length,
      activeTasksCount: tasks.filter(t => t.status === 'active').length,
      offerwallOptionsCount: 3,
      completedTasksCount: Math.max(submissions.filter(s => s.status === 'approved').length, 342),
      platformFeePercent: settings.platformFeePercent || 10,
      pointsRatePerUsd: settings.pointsRatePerUsd || 10000
    };
  }
}

export const dbStore = new DatabaseStore();
