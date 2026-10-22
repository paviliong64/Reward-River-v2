import crypto from 'node:crypto';
import { dbStore, ProviderConfig } from './db';

export interface OfferwallDefinition {
  id: string;
  name: string;
  publicBrandName: string;
  tagline: string;
  description: string;
  pills: string[];
  category: 'Surveys' | 'Offers & Apps' | 'Micro-Tasks' | 'Sponsors';
  icon: string;
  badge: string;
  enabled: boolean;
  requiresExternalId: boolean;
  launchUrl: string;
  userSharePercent: number;
}

export class OfferwallService {
  /**
   * Returns all active direct providers configured in the system,
   * wrapped with white-label Reward River Direct Gateway branding.
   */
  getAvailableOfferwalls(userOpaqueId: string, userIp?: string): OfferwallDefinition[] {
    const providers = dbStore.getProviders().filter(p => p.enabled);
    const results: OfferwallDefinition[] = [];

    for (const p of providers) {
      const launchUrl = this.buildLaunchUrl(p, userOpaqueId, userIp);
      
      let categoryLabel: 'Surveys' | 'Offers & Apps' | 'Micro-Tasks' | 'Sponsors' = 'Offers & Apps';
      let pills = ['Instant Credit', 'Verified S2S', 'High Approval'];
      if (p.category === 'surveys') {
        categoryLabel = 'Surveys';
        pills = ['Daily Surveys', 'Direct Stream', 'Top Payouts'];
      } else if (p.category === 'tasks') {
        categoryLabel = 'Micro-Tasks';
        pills = ['Fast Approval', 'Desktop & Mobile', 'High Fill Rate'];
      } else if (p.category === 'sponsors') {
        categoryLabel = 'Sponsors';
        pills = ['Featured Partner', 'Direct Reward', 'Bonus Multiplier'];
      }

      results.push({
        id: p.id,
        name: p.name,
        publicBrandName: p.publicBrandName || `Reward River Direct Gateway • ${p.name}`,
        tagline: p.tagline || 'Direct High-Yield Earning Stream',
        description: p.description || 'Verified direct earning gateway with instant crediting to your Reward River balance.',
        pills,
        category: categoryLabel,
        icon: p.icon || 'RR',
        badge: p.badge || 'Direct Gateway',
        enabled: p.enabled,
        requiresExternalId: true,
        launchUrl,
        userSharePercent: p.userSharePercent || 40
      });
    }

    return results;
  }

  /**
   * Smart URL Builder substituting macros:
   * {user_id}, {external_id}, {app_id}, {secret}, {ip}, {subid}
   */
  buildLaunchUrl(provider: ProviderConfig, userOpaqueId: string, userIp?: string): string {
    let url = provider.launchUrlTemplate;

    // Macro replacements
    url = url.replace(/\{external_id\}/g, encodeURIComponent(userOpaqueId));
    url = url.replace(/\{user_id\}/g, encodeURIComponent(userOpaqueId));
    url = url.replace(/\{subid\}/g, encodeURIComponent(userOpaqueId));
    url = url.replace(/\{app_id\}/g, encodeURIComponent(provider.appId || ''));
    url = url.replace(/\{ip\}/g, encodeURIComponent(userIp || '127.0.0.1'));

    if (provider.id === 'cpx') {
      const hashKey = provider.hashKey || provider.secretKey || '';
      const secret = this.generateCpxHash(userOpaqueId, hashKey);
      url = url.replace(/\{secret\}/g, secret);
    } else {
      url = url.replace(/\{secret\}/g, encodeURIComponent(provider.secretKey || ''));
    }

    return url;
  }

  generateCpxHash(extUserId: string, hashKey: string): string {
    if (!hashKey) return 'demo_hash';
    return crypto.createHash('md5').update(`${extUserId}-${hashKey}`).digest('hex');
  }

  // --- Aoyco Postback Verification ---
  verifyAoycoPostback(params: {
    userId: string;
    transId: string;
    amount: string | number;
    signature?: string;
  }): boolean {
    const provider = dbStore.getProviderById('aoyco');
    const secret = provider?.secretKey || 'aoyco_secret_key';
    if (!secret || secret === 'aoyco_secret_key') {
      return true; // allow in test/demo mode
    }
    if (!params.signature) return false;
    const expected = crypto
      .createHash('sha256')
      .update(`${params.transId}:${params.userId}:${params.amount}:${secret}`)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.signature));
  }

  // --- AdvertsReward Postback Verification ---
  verifyAdvertsRewardPostback(params: {
    userId: string;
    transId: string;
    signature?: string;
  }): boolean {
    const provider = dbStore.getProviderById('advertsreward');
    const secret = provider?.secretKey || 'adv_secret_key';
    if (!secret || secret === 'adv_secret_key') {
      return true; // allow in test/demo mode
    }
    if (!params.signature) return false;
    const expected = crypto
      .createHash('md5')
      .update(`${params.transId}_${params.userId}_${secret}`)
      .digest('hex');
    return expected.toLowerCase() === params.signature.toLowerCase();
  }

  /**
   * Universal Postback Processor enforcing the 60% Reward River Profit / 40% User Share split.
   * User sees and receives only their 40% share in points & cents.
   * Reward River automatically logs the 60% gross profit in platform treasury.
   */
  async processUniversalPostback(params: {
    providerId: string;
    rawUserId?: string;
    userId?: string;
    transId?: string;
    transactionId?: string;
    rawAmount?: number | string; // in points or USD
    amount?: number | string;
    grossAmountUsd?: number | string;
    isPoints?: boolean;
    status?: string | number;
    offerId?: string;
    signature?: string;
  }): Promise<{ success: boolean; message: string; userPointsAdded?: number; platformProfitCents?: number }> {
    const { providerId, status = 1, offerId } = params;
    const lookupUserId = params.rawUserId || params.userId || '';
    const transId = params.transId || params.transactionId || `tx_${Date.now()}`;
    const rawAmount = params.rawAmount !== undefined ? params.rawAmount : (params.grossAmountUsd !== undefined ? params.grossAmountUsd : (params.amount !== undefined ? params.amount : 0));

    const user = dbStore.getUserByExternalOpaqueId(lookupUserId) || dbStore.getUserById(lookupUserId);
    if (!user) {
      return { success: false, message: 'User not found in Reward River database' };
    }

    const provider = dbStore.getProviderById(providerId) || {
      id: providerId,
      name: providerId.toUpperCase(),
      publicBrandName: `Reward River Direct Gateway • ${providerId.toUpperCase()}`,
      category: 'offers' as const,
      userSharePercent: 40,
      platformSharePercent: 60
    };

    const numAmount = Number(rawAmount) || 0;
    // Determine gross cents & gross points
    let grossPoints = 0;
    let grossCents = 0;

    if (params.isPoints || numAmount >= 50) {
      grossPoints = Math.round(numAmount);
      grossCents = Math.round(grossPoints / 100);
    } else {
      grossCents = Math.round(numAmount * 100);
      grossPoints = Math.round(numAmount * 10000);
    }

    if (grossCents <= 0) grossCents = 10;
    if (grossPoints <= 0) grossPoints = 1000;

    // Apply the 60% / 40% commission split
    const userSharePercent = provider.userSharePercent ?? 40;
    const platformSharePercent = provider.platformSharePercent ?? (100 - userSharePercent);

    const userCents = Math.max(1, Math.round((grossCents * userSharePercent) / 100));
    const userPoints = Math.max(10, Math.round((grossPoints * userSharePercent) / 100));

    const platformCents = Math.max(1, grossCents - userCents);

    const isReversal = Number(status) === 2 || Number(status) === 3;
    const entryType = isReversal ? 'reversal' : 'credit';

    // 1. Credit / Reverse User Ledger (User sees ONLY their 40% share)
    const ledgerResult = await dbStore.addLedgerEntry({
      id: `ledg_${crypto.randomUUID()}`,
      userId: user.id,
      providerTxId: isReversal ? `${providerId}_${transId}_rev` : `${providerId}_${transId}`,
      amountCents: userCents,
      entryType,
      status: 'confirmed',
      description: `${provider.publicBrandName}: Completed Reward (${userPoints.toLocaleString()} Points)`,
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    });

    // 2. Record Platform Treasury Revenue (The 60% platform share)
    if (!isReversal && ledgerResult.success) {
      await dbStore.recordPlatformRevenue({
        providerId: provider.id,
        providerName: provider.name,
        sourceType: provider.category === 'surveys' ? 'survey' : 'offerwall',
        grossAmountCents: grossCents,
        userShareCents: userCents,
        platformShareCents: platformCents,
        userId: user.id,
        userEmail: user.email,
        providerTxId: transId,
        description: `Reward River Platform 60% Margin from ${provider.name} (Tx: ${transId})`
      });
    }

    return {
      success: ledgerResult.success || ledgerResult.isDuplicate,
      message: ledgerResult.isDuplicate
        ? 'Duplicate transaction acknowledged'
        : `Reward credited: +${userPoints} Points to user, +$${(platformCents / 100).toFixed(2)} retained platform profit`,
      userPointsAdded: isReversal ? 0 : userPoints,
      platformProfitCents: isReversal ? 0 : platformCents
    };
  }

  // Backwards compatible wrapper for Aoyco
  async processAoycoPostback(params: {
    user_id?: string;
    ext_user_id?: string;
    subid?: string;
    amount?: string | number;
    points?: string | number;
    tx_id?: string;
    trans_id?: string;
    status?: string;
    signature?: string;
  }) {
    const rawUserId = params.user_id || params.ext_user_id || params.subid || '';
    const txId = params.tx_id || params.trans_id || `aoyco_${Date.now()}`;
    const rawAmount = params.amount || params.points || 0;

    return this.processUniversalPostback({
      providerId: 'aoyco',
      rawUserId,
      transId: txId,
      rawAmount,
      status: params.status || 1
    });
  }

  // Backwards compatible wrapper for AdvertsReward
  async processAdvertsRewardPostback(params: {
    subid?: string;
    user_id?: string;
    amount?: string | number;
    reward?: string | number;
    trans_id?: string;
    tx_id?: string;
    status?: string;
    signature?: string;
  }) {
    const rawUserId = params.subid || params.user_id || '';
    const txId = params.trans_id || params.tx_id || `advrew_${Date.now()}`;
    const rawAmount = params.amount || params.reward || 0;

    return this.processUniversalPostback({
      providerId: 'advertsreward',
      rawUserId,
      transId: txId,
      rawAmount,
      status: params.status || 1
    });
  }
}

export const offerwallService = new OfferwallService();
