/**
 * Reward River - CPX Research API Utility & Security Layer
 * Official documentation: https://www.cpx-research.com/main/en/doc.php
 */

import { createHash } from 'node:crypto';

export interface CpxRawSurvey {
  id: string | number;
  loi?: number; // length of interview in minutes
  payout?: number | string; // payout amount
  cpi?: number | string; // cost per interview
  conversion_rate?: number;
  statistics_rating_avg?: number;
  statistics_rating_count?: number;
  top?: number;
  href?: string;
  type?: string;
  [key: string]: unknown;
}

export interface NormalizedSurvey {
  id: string;
  loiMinutes: number;
  rewardCents: number; // in USD cents (integer minor units)
  rewardUsdFormatted: string; // e.g. "$1.20"
  cpi: number;
  ratingAvg: number;
  ratingCount: number;
  isTop: boolean;
  directUrl: string;
}

export interface CpxPostbackPayload {
  status: string | number; // 1 = completion, 2 = screenout, 3 = chargeback/reversal
  trans_id: string;
  user_id?: string;
  ext_user_id?: string;
  amount_local?: string | number;
  amount_usd?: string | number;
  offer_id?: string;
  ip_click?: string;
  secure_hash?: string;
  hash?: string;
  sub_id?: string;
  sub_id_2?: string;
}

/**
 * Computes MD5 hash according to CPX documentation: md5(ext_user_id + '-' + hash_key)
 */
export function generateCpxSecureHash(extUserId: string, hashKey: string): string {
  if (!extUserId || !hashKey) return '';
  return createHash('md5').update(`${extUserId}-${hashKey}`).digest('hex');
}

/**
 * Computes transaction hash for postback verification: md5(transId + '-' + hashKey)
 */
export function generateCpxTransactionHash(transId: string, hashKey: string): string {
  if (!transId || !hashKey) return '';
  return createHash('md5').update(`${transId}-${hashKey}`).digest('hex');
}

/**
 * Verifies CPX postback signature against provided hash key.
 * Checks both transaction-based hash and user-based hash formats supported by CPX.
 */
export function verifyCpxPostbackSignature(
  transId: string,
  extUserId: string,
  receivedHash: string,
  hashKey: string
): boolean {
  if (!receivedHash || !hashKey) return false;
  
  const provided = receivedHash.trim().toLowerCase();
  const candidates = [
    generateCpxTransactionHash(transId, hashKey).toLowerCase(),
    generateCpxSecureHash(extUserId, hashKey).toLowerCase(),
    createHash('md5').update(`${transId}${hashKey}`).digest('hex').toLowerCase(),
    createHash('md5').update(`${extUserId}${hashKey}`).digest('hex').toLowerCase(),
    createHash('md5').update(`${transId}-${extUserId}-${hashKey}`).digest('hex').toLowerCase(),
    createHash('md5').update(`${hashKey}`).digest('hex').toLowerCase(),
    hashKey.toLowerCase()
  ];

  return candidates.includes(provided);
}

/**
 * Builds compliant CPX Survey URL.
 */
export function buildCpxSurveyUrl(params: {
  appId: string;
  extUserId: string;
  hashKey?: string;
  surveyId?: string;
  subId1?: string;
  subId2?: string;
  mainColor?: string;
}): string {
  const { appId, extUserId, hashKey, surveyId, subId1, subId2, mainColor = '0284c7' } = params;
  const baseUrl = 'https://oul.cpx-research.com/index.php';
  
  const query = new URLSearchParams();
  query.set('app_id', appId);
  query.set('ext_user_id', extUserId);
  query.set('main_color', mainColor); // River blue branding

  if (hashKey) {
    query.set('secure_hash', generateCpxSecureHash(extUserId, hashKey));
  }
  if (surveyId) {
    query.set('survey_id', surveyId);
  }
  if (subId1) {
    query.set('subid_1', subId1);
  }
  if (subId2) {
    query.set('subid_2', subId2);
  }

  return `${baseUrl}?${query.toString()}`;
}

/**
 * Normalizes CPX API response to standard application format.
 * Guards against unexpected nulls or malformed properties.
 */
export function normalizeCpxSurveyList(
  rawData: unknown,
  appId: string,
  extUserId: string,
  hashKey?: string,
  userSharePercent: number = 40
): NormalizedSurvey[] {
  if (!rawData || typeof rawData !== 'object') {
    return [];
  }

  const payload = rawData as { surveys?: unknown; status?: string };
  if (!Array.isArray(payload.surveys)) {
    return [];
  }

  const results: NormalizedSurvey[] = [];

  for (const item of payload.surveys) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as CpxRawSurvey;

    const id = String(raw.id || '').trim();
    if (!id) continue;

    const loiMinutes = Math.max(1, Math.min(60, Number(raw.loi) || 10));
    
    // Parse payout: CPX returns gross payout. Apply user's 40% share (Reward River retains 60%)
    const rawPayout = Number(raw.payout || raw.cpi) || 0;
    const grossCents = Math.round(rawPayout * 100);
    const rewardCents = Math.max(10, Math.round((grossCents * userSharePercent) / 100));
    const rewardUsdFormatted = `$${(rewardCents / 100).toFixed(2)}`;

    const cpi = Number(raw.cpi) || 0;
    const ratingAvg = Math.max(0, Math.min(5, Number(raw.statistics_rating_avg) || 4.5));
    const ratingCount = Math.max(0, Number(raw.statistics_rating_count) || 0);
    const isTop = Boolean(raw.top && raw.top > 0);

    // Direct survey URL or generated secure URL
    const directUrl = raw.href && typeof raw.href === 'string' && raw.href.startsWith('https://')
      ? raw.href
      : buildCpxSurveyUrl({ appId, extUserId, hashKey, surveyId: id });

    results.push({
      id,
      loiMinutes,
      rewardCents,
      rewardUsdFormatted,
      cpi,
      ratingAvg,
      ratingCount,
      isTop,
      directUrl
    });
  }

  return results;
}
