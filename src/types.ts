export interface User {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  role: 'user' | 'advertiser' | 'admin';
  createdAt: string;
  externalOpaqueId?: string;
  updatedAt?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  photoURL?: string;
  countryCode?: string;
  hasPromptedPhone?: boolean;
  provider?: 'google.com' | 'password' | string;
  advertiserBalanceCents?: number;
}

export interface AdminUserDetail extends User {
  balances: UserBalances;
  completedTasksCount?: number;
  completedSurveysCount: number;
  totalTransactionsCount: number;
  lastActiveAt?: string;
  platformProfitGeneratedCents?: number;
  platformProfitGeneratedFormatted?: string;
}

export interface UserBalances {
  availableCents: number;
  pendingCents: number;
  totalEarnedCents: number;
  totalWithdrawnCents: number;
  reservedWithdrawalCents: number;
}

export interface UsdtQuote {
  priceUsd: number;
  formattedPrice: string;
  pegStatus: string;
  source: string;
  timestamp: string;
  expiresAt: string;
  isStale: boolean;
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
  rewardPoints: number; // e.g. 1000
  rewardCents: number; // e.g. 10
  rewardPointsFormatted?: string;
  rewardUsdtFormatted?: string;
  totalSlots: number;
  completedSlots: number;
  slotsRemaining?: number;
  slotsProgress?: string;
  targetCountry: string;
  targetDevice: 'all' | 'mobile' | 'desktop';
  requiredProofType: 'text' | 'screenshot' | 'reference_id' | 'both';
  proofInstructions: string;
  status: 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';
  platformFeePercent: number;
  advertiserBudgetReservedCents: number;
  advertiserFeeReservedCents: number;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  userSubmitted?: boolean;
  submissionStatus?: string;
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

export interface OfferwallItem {
  id: 'cpx' | 'aoyco' | 'advertsreward';
  name: string;
  tagline: string;
  description: string;
  pills: string[];
  category: 'Surveys' | 'Offers & Apps' | 'Micro-Tasks';
  icon: string;
  badge: string;
  enabled: boolean;
  launchUrl: string;
}

export interface AdvertiserOverview {
  advertiserBalanceCents: number;
  advertiserBalanceFormatted: string;
  advertiserBalancePoints: number;
  activeCampaignsCount: number;
  pendingProofsCount: number;
  totalApprovedWorkerProofs: number;
  totalWorkerSpendCents: number;
  platformFeePercent: number;
  pointsRatePerUsd: number;
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
  stickyBottom728Code: string;
  stickyBottom468Code: string;
  stickyRail300Code: string;
}

export interface PublicMetrics {
  registeredWorkers: number;
  registeredAdvertisers: number;
  activeTasksCount: number;
  offerwallOptionsCount: number;
  completedTasksCount: number;
  platformFeePercent: number;
  pointsRatePerUsd: number;
}

export interface Survey {
  id: string;
  loiMinutes: number;
  rewardCents: number;
  rewardUsdFormatted: string;
  rewardUsdtFormatted: string;
  rewardPointsFormatted?: string;
  cpi: number;
  ratingAvg: number;
  ratingCount: number;
  isTop: boolean;
  directUrl: string;
}

export interface Withdrawal {
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
}

export interface LedgerEntry {
  id: string;
  userId: string;
  providerTxId: string;
  amountCents: number;
  entryType: 'credit' | 'debit' | 'reversal';
  status: 'pending' | 'confirmed' | 'reversed';
  createdAt: string;
  description?: string;
  cpxOfferId?: string;
}

export interface SystemSettings {
  minWithdrawalCents: number;
  maxWithdrawalCents: number;
  feeCentsTrc20: number;
  feeCentsErc20: number;
  platformFeePercent: number;
  pointsRatePerUsd: number;
  defaultUserSharePercent: number; // 40% to user
  defaultPlatformSharePercent: number; // 60% to Reward River
  maintenanceMode: boolean;
  defaultNetwork: 'TRC20' | 'ERC20';
  updatedAt: string;
}

export interface ProviderConfig {
  id: string; // e.g. 'cpx', 'aoyco', 'advertsreward', 'bitlabs', or custom
  name: string; // Partner Name in Admin
  publicBrandName: string; // Direct Reward River Brand Name (e.g. "Reward River Direct Gateway • Stream A")
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

export interface CpxConfigStatus {
  isConfigured: boolean;
  appIdConfigured: boolean;
  hashKeyConfigured: boolean;
  postbackSecretConfigured: boolean;
  mode: 'live' | 'demo';
}

