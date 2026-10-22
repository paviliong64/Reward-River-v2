/**
 * Reward River - Supabase PostgreSQL Store
 * Real-time Database Operations for Supabase
 */

import { serverSupabase, isServerSupabaseConfigured } from './supabase';
import { LedgerEntry } from '../src/utils/ledger';
import {
  UserAccount,
  TaskCampaign,
  TaskSubmission,
  AdvertiserDeposit,
  ProviderConfig,
  AdSlotConfig,
  AdSettings,
  PlatformTreasuryEntry,
  WithdrawalRequestDoc,
  SystemSettings,
  AdminAuditLog
} from './db';

export class SupabaseStore {
  /**
   * Check if Supabase connection is active
   */
  isEnabled(): boolean {
    return isServerSupabaseConfigured && serverSupabase !== null;
  }

  // --- Users ---
  async fetchUsers(): Promise<UserAccount[]> {
    if (!serverSupabase) return [];
    try {
      const { data, error } = await serverSupabase.from('users').select('*');
      if (error || !data) return [];
      return data.map(u => ({
        id: u.id,
        email: u.email,
        passwordHash: u.password_hash || '',
        salt: u.salt || '',
        displayName: u.display_name || '',
        emailVerified: u.email_verified || false,
        role: u.role || 'user',
        externalOpaqueId: u.external_opaque_id,
        phoneNumber: u.phone_number,
        whatsappNumber: u.whatsapp_number,
        countryCode: u.country_code || 'US',
        provider: u.provider || 'supabase',
        advertiserBalanceCents: u.advertiser_balance_cents || 0,
        hasPromptedPhone: u.has_prompted_phone || false,
        createdAt: u.created_at,
        updatedAt: u.updated_at
      }));
    } catch {
      return [];
    }
  }

  async upsertUser(user: UserAccount): Promise<void> {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('users').upsert({
        id: user.id,
        email: user.email,
        password_hash: user.passwordHash,
        salt: user.salt,
        display_name: user.displayName,
        email_verified: user.emailVerified,
        role: user.role,
        external_opaque_id: user.externalOpaqueId,
        phone_number: user.phoneNumber,
        whatsapp_number: user.whatsappNumber,
        country_code: user.countryCode,
        provider: user.provider || 'supabase',
        advertiser_balance_cents: user.advertiserBalanceCents || 0,
        has_prompted_phone: user.hasPromptedPhone || false,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Supabase upsertUser warning:', err);
    }
  }

  // --- Reward Ledger ---
  async fetchLedger(): Promise<LedgerEntry[]> {
    if (!serverSupabase) return [];
    try {
      const { data, error } = await serverSupabase.from('reward_ledger').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map(l => ({
        id: l.id,
        userId: l.user_id,
        providerTxId: l.provider_tx_id || '',
        amountCents: l.amount_cents,
        entryType: l.entry_type,
        status: l.status,
        description: l.description,
        createdAt: l.created_at
      }));
    } catch {
      return [];
    }
  }

  async insertLedger(entry: LedgerEntry): Promise<void> {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('reward_ledger').upsert({
        id: entry.id,
        user_id: entry.userId,
        provider_tx_id: entry.providerTxId,
        amount_cents: entry.amountCents,
        entry_type: entry.entryType,
        status: entry.status,
        description: entry.description,
        created_at: entry.createdAt
      });
    } catch (err) {
      console.warn('Supabase insertLedger warning:', err);
    }
  }

  // --- Tasks ---
  async fetchTasks(): Promise<TaskCampaign[]> {
    if (!serverSupabase) return [];
    try {
      const { data, error } = await serverSupabase.from('tasks').select('*');
      if (error || !data) return [];
      return data.map(t => ({
        id: t.id,
        advertiserId: t.advertiser_id,
        advertiserEmail: t.advertiser_email,
        title: t.title,
        description: t.description,
        instructions: t.instructions || [],
        category: t.category,
        targetUrl: t.target_url,
        rewardPoints: t.reward_points,
        rewardCents: t.reward_cents,
        totalSlots: t.total_slots,
        completedSlots: t.completed_slots || 0,
        targetCountry: t.target_country || 'ALL',
        targetDevice: t.target_device || 'all',
        requiredProofType: t.required_proof_type || 'text',
        proofInstructions: t.proof_instructions || '',
        status: t.status,
        platformFeePercent: t.platform_fee_percent || 10,
        advertiserBudgetReservedCents: t.advertiser_budget_reserved_cents || 0,
        advertiserFeeReservedCents: t.advertiser_fee_reserved_cents || 0,
        adminNotes: t.admin_notes,
        createdAt: t.created_at,
        updatedAt: t.updated_at
      }));
    } catch {
      return [];
    }
  }

  async upsertTask(task: TaskCampaign): Promise<void> {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('tasks').upsert({
        id: task.id,
        advertiser_id: task.advertiserId,
        advertiser_email: task.advertiserEmail,
        title: task.title,
        description: task.description,
        instructions: task.instructions,
        category: task.category,
        target_url: task.targetUrl,
        reward_points: task.rewardPoints,
        reward_cents: task.rewardCents,
        total_slots: task.totalSlots,
        completed_slots: task.completedSlots,
        target_country: task.targetCountry,
        target_device: task.targetDevice,
        required_proof_type: task.requiredProofType,
        proof_instructions: task.proofInstructions,
        status: task.status,
        platform_fee_percent: task.platformFeePercent,
        advertiser_budget_reserved_cents: task.advertiserBudgetReservedCents,
        advertiser_fee_reserved_cents: task.advertiserFeeReservedCents,
        admin_notes: task.adminNotes,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Supabase upsertTask warning:', err);
    }
  }

  // --- Task Submissions ---
  async fetchSubmissions(): Promise<TaskSubmission[]> {
    if (!serverSupabase) return [];
    try {
      const { data, error } = await serverSupabase.from('task_submissions').select('*');
      if (error || !data) return [];
      return data.map(s => ({
        id: s.id,
        taskId: s.task_id,
        taskTitle: s.task_title,
        workerId: s.worker_id,
        workerEmail: s.worker_email,
        advertiserId: s.advertiser_id,
        rewardPoints: s.reward_points,
        rewardCents: s.reward_cents,
        proofText: s.proof_text,
        proofScreenshotUrl: s.proof_screenshot_url,
        proofReferenceId: s.proof_reference_id,
        status: s.status,
        rejectionReason: s.rejection_reason,
        reviewedBy: s.reviewed_by,
        reviewedAt: s.reviewed_at,
        submittedAt: s.submitted_at || s.created_at || new Date().toISOString(),
        createdAt: s.created_at,
        updatedAt: s.updated_at
      }));
    } catch {
      return [];
    }
  }

  async upsertSubmission(sub: TaskSubmission): Promise<void> {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('task_submissions').upsert({
        id: sub.id,
        task_id: sub.taskId,
        task_title: sub.taskTitle,
        worker_id: sub.workerId,
        worker_email: sub.workerEmail,
        advertiser_id: sub.advertiserId,
        reward_points: sub.rewardPoints,
        reward_cents: sub.rewardCents,
        proof_text: sub.proofText,
        proof_screenshot_url: sub.proofScreenshotUrl,
        proof_reference_id: sub.proofReferenceId,
        status: sub.status,
        rejection_reason: sub.rejectionReason,
        reviewed_by: sub.reviewedBy,
        reviewed_at: sub.reviewedAt,
        submitted_at: sub.submittedAt,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Supabase upsertSubmission warning:', err);
    }
  }

  // --- Providers ---
  async fetchProviders(): Promise<ProviderConfig[]> {
    if (!serverSupabase) return [];
    try {
      const { data, error } = await serverSupabase.from('providers').select('*');
      if (error || !data) return [];
      return data.map(p => ({
        id: p.id,
        name: p.name,
        publicBrandName: p.public_brand_name,
        tagline: p.tagline,
        description: p.description,
        category: p.category,
        enabled: p.enabled,
        launchUrlTemplate: p.launch_url_template,
        appId: p.app_id,
        secretKey: p.secret_key,
        hashKey: p.hash_key,
        userSharePercent: p.user_share_percent,
        platformSharePercent: p.platform_share_percent,
        icon: p.icon,
        badge: p.badge,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    } catch {
      return [];
    }
  }

  async upsertProvider(p: ProviderConfig): Promise<void> {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('providers').upsert({
        id: p.id,
        name: p.name,
        public_brand_name: p.publicBrandName,
        tagline: p.tagline,
        description: p.description,
        category: p.category,
        enabled: p.enabled,
        launch_url_template: p.launchUrlTemplate,
        app_id: p.appId,
        secret_key: p.secretKey,
        hash_key: p.hashKey,
        user_share_percent: p.userSharePercent,
        platform_share_percent: p.platformSharePercent,
        icon: p.icon,
        badge: p.badge,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Supabase upsertProvider warning:', err);
    }
  }

  async deleteProvider(id: string): Promise<void> {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('providers').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteProvider warning:', err);
    }
  }

  // --- Universal Dynamic Ad Slots ---
  async fetchAdSlots(): Promise<AdSlotConfig[]> {
    if (!serverSupabase) return [];
    try {
      const { data, error } = await serverSupabase.from('ad_slots').select('*');
      if (error || !data) return [];
      return data.map(s => ({
        id: s.id,
        name: s.name,
        placement: s.placement,
        format: s.format,
        enabled: s.enabled,
        adCode: s.ad_code,
        updatedAt: s.updated_at
      }));
    } catch {
      return [];
    }
  }

  async upsertAdSlot(slot: AdSlotConfig): Promise<void> {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('ad_slots').upsert({
        id: slot.id,
        name: slot.name,
        placement: slot.placement,
        format: slot.format,
        enabled: slot.enabled,
        ad_code: slot.adCode,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Supabase upsertAdSlot warning:', err);
    }
  }

  // --- Platform Treasury (60% Retained Platform Margin) ---
  async fetchTreasury(): Promise<PlatformTreasuryEntry[]> {
    if (!serverSupabase) return [];
    try {
      const { data, error } = await serverSupabase.from('platform_treasury').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map(t => ({
        id: t.id,
        providerId: t.provider_id,
        providerName: t.provider_name,
        sourceType: t.source_type,
        grossAmountCents: t.gross_amount_cents,
        userShareCents: t.user_share_cents,
        platformShareCents: t.platform_share_cents,
        userId: t.user_id,
        userEmail: t.user_email,
        providerTxId: t.provider_tx_id,
        description: t.description,
        createdAt: t.created_at
      }));
    } catch {
      return [];
    }
  }

  async insertTreasury(entry: PlatformTreasuryEntry): Promise<void> {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('platform_treasury').upsert({
        id: entry.id,
        provider_id: entry.providerId,
        provider_name: entry.providerName,
        source_type: entry.sourceType,
        gross_amount_cents: entry.grossAmountCents,
        user_share_cents: entry.userShareCents,
        platform_share_cents: entry.platformShareCents,
        user_id: entry.userId,
        user_email: entry.userEmail,
        provider_tx_id: entry.providerTxId,
        description: entry.description,
        created_at: entry.createdAt
      });
    } catch (err) {
      console.warn('Supabase insertTreasury warning:', err);
    }
  }

  // --- Withdrawals ---
  async fetchWithdrawals(): Promise<WithdrawalRequestDoc[]> {
    if (!serverSupabase) return [];
    try {
      const { data, error } = await serverSupabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map(w => ({
        id: w.id,
        userId: w.user_id,
        userEmail: w.user_email,
        usdtAddress: w.usdt_address,
        network: w.network,
        amountCents: w.amount_cents,
        feeCents: w.fee_cents,
        netCents: w.net_cents,
        grossUsdt: w.gross_usdt,
        feeUsdt: w.fee_usdt,
        netUsdt: w.net_usdt,
        status: w.status,
        txHash: w.tx_hash,
        reviewNotes: w.review_notes,
        reviewedBy: w.reviewed_by,
        createdAt: w.created_at,
        updatedAt: w.updated_at
      }));
    } catch {
      return [];
    }
  }

  async upsertWithdrawal(w: WithdrawalRequestDoc): Promise<void> {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('withdrawal_requests').upsert({
        id: w.id,
        user_id: w.userId,
        user_email: w.userEmail,
        usdt_address: w.usdtAddress,
        network: w.network,
        amount_cents: w.amountCents,
        fee_cents: w.feeCents,
        net_cents: w.netCents,
        gross_usdt: w.grossUsdt,
        fee_usdt: w.feeUsdt,
        net_usdt: w.netUsdt,
        status: w.status,
        tx_hash: w.txHash,
        review_notes: w.reviewNotes,
        reviewed_by: w.reviewedBy,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Supabase upsertWithdrawal warning:', err);
    }
  }

  // --- Advertiser Deposits ---
  async fetchAdvertiserDeposits(): Promise<AdvertiserDeposit[]> {
    if (!serverSupabase) return [];
    try {
      const { data, error } = await serverSupabase.from('advertiser_deposits').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map(d => ({
        id: d.id,
        advertiserId: d.advertiser_id,
        advertiserEmail: d.advertiser_email,
        amountCents: d.amount_cents,
        amountPoints: Math.round((d.amount_cents / 100) * 10000),
        method: d.method || 'manual',
        status: d.status || 'completed',
        txHashOrRef: d.tx_hash,
        createdAt: d.created_at,
        confirmedAt: d.updated_at || d.created_at
      }));
    } catch {
      return [];
    }
  }

  async insertAdvertiserDeposit(dep: AdvertiserDeposit): Promise<void> {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('advertiser_deposits').upsert({
        id: dep.id,
        advertiser_id: dep.advertiserId,
        advertiser_email: dep.advertiserEmail,
        amount_cents: dep.amountCents,
        method: dep.method,
        status: dep.status,
        tx_hash: dep.txHashOrRef,
        created_at: dep.createdAt,
        updated_at: dep.confirmedAt || dep.createdAt
      });
    } catch (err) {
      console.warn('Supabase insertAdvertiserDeposit warning:', err);
    }
  }

  // --- Admin Audit Logs ---
  async insertAuditLog(log: AdminAuditLog): Promise<void> {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('admin_audit_logs').upsert({
        id: log.id,
        admin_user_id: log.adminUserId,
        admin_email: log.adminEmail,
        action: log.action,
        target_entity: log.targetEntity,
        target_id: log.targetId,
        details: log.details,
        ip_address: log.ipAddress,
        created_at: log.createdAt
      });
    } catch (err) {
      console.warn('Supabase insertAuditLog warning:', err);
    }
  }
}

export const supabaseStore = new SupabaseStore();

