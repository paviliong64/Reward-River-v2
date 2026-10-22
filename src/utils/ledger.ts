/**
 * Reward River - Ledger & Accounting State Utilities
 * Strict double-entry style ledger calculation and idempotency validation.
 */

export interface LedgerEntry {
  id: string;
  userId: string;
  providerTxId: string;
  amountCents: number; // integer minor units (USD cents)
  entryType: 'credit' | 'debit' | 'reversal';
  status: 'pending' | 'confirmed' | 'reversed';
  createdAt: string;
  processedAt?: string;
  reversalRef?: string;
  description?: string;
  cpxOfferId?: string;
}

export interface WithdrawalRecord {
  id: string;
  userId: string;
  amountCents: number;
  status: 'requested' | 'under_review' | 'approved' | 'processing' | 'paid' | 'rejected' | 'failed' | 'cancelled';
  createdAt: string;
}

export interface UserBalanceSummary {
  availableCents: number;
  pendingCents: number;
  totalEarnedCents: number;
  totalWithdrawnCents: number;
  reservedWithdrawalCents: number;
}

/**
 * Calculates accurate account balances from immutable ledger entries and withdrawal states.
 * Guarantees zero floating-point discrepancies.
 */
export function calculateUserBalances(
  userId: string,
  entries: LedgerEntry[],
  withdrawals: WithdrawalRecord[]
): UserBalanceSummary {
  let totalConfirmedCredits = 0;
  let totalDebitsAndReversals = 0;
  let pendingCents = 0;
  let totalEarnedCents = 0;

  for (const entry of entries) {
    if (entry.userId !== userId) continue;

    if (entry.status === 'confirmed') {
      if (entry.entryType === 'credit') {
        totalConfirmedCredits += entry.amountCents;
        totalEarnedCents += entry.amountCents;
      } else if (entry.entryType === 'reversal' || entry.entryType === 'debit') {
        totalDebitsAndReversals += Math.abs(entry.amountCents);
      }
    } else if (entry.status === 'pending' && entry.entryType === 'credit') {
      pendingCents += entry.amountCents;
    }
  }

  // Active reserved withdrawals (requested, under_review, approved, processing)
  let reservedWithdrawalCents = 0;
  let totalWithdrawnCents = 0;

  for (const w of withdrawals) {
    if (w.userId !== userId) continue;

    if (w.status === 'paid') {
      totalWithdrawnCents += w.amountCents;
      reservedWithdrawalCents += w.amountCents;
    } else if (['requested', 'under_review', 'approved', 'processing'].includes(w.status)) {
      reservedWithdrawalCents += w.amountCents;
    }
    // 'rejected', 'failed', 'cancelled' release the reservation
  }

  const netConfirmedEarnings = totalConfirmedCredits - totalDebitsAndReversals;
  const availableCents = Math.max(0, netConfirmedEarnings - reservedWithdrawalCents);

  return {
    availableCents,
    pendingCents,
    totalEarnedCents,
    totalWithdrawnCents,
    reservedWithdrawalCents
  };
}

/**
 * Checks if a provider transaction ID has already been recorded in the ledger.
 */
export function isDuplicateTransaction(providerTxId: string, entries: LedgerEntry[]): boolean {
  if (!providerTxId) return false;
  return entries.some(e => e.providerTxId === providerTxId);
}

/**
 * Validates whether a withdrawal can be submitted given current balance and limits.
 */
export function canSubmitWithdrawal(params: {
  amountCents: number;
  availableCents: number;
  emailVerified: boolean;
  minCents: number;
  maxCents: number;
}): { allowed: boolean; reason?: string } {
  const { amountCents, availableCents, minCents, maxCents } = params;

  if (amountCents < minCents) {
    return { allowed: false, reason: `Minimum withdrawal is $${(minCents / 100).toFixed(2)} USD.` };
  }

  if (amountCents > maxCents) {
    return { allowed: false, reason: `Maximum single withdrawal is $${(maxCents / 100).toFixed(2)} USD.` };
  }

  if (amountCents > availableCents) {
    return { allowed: false, reason: `Insufficient withdrawable balance. Available: $${(availableCents / 100).toFixed(2)}.` };
  }

  return { allowed: true };
}
