/**
 * Reward River - Dedicated CPX Research Service
 * Official API documentation: https://www.cpx-research.com/main/en/doc.php
 * Endpoint: https://live-api.cpx-research.com/api/get-surveys.php
 */

import {
  generateCpxSecureHash,
  verifyCpxPostbackSignature,
  normalizeCpxSurveyList,
  buildCpxSurveyUrl,
  NormalizedSurvey
} from '../src/utils/cpx';
import { dbStore } from './db';

export interface CpxConfigStatus {
  isConfigured: boolean;
  appIdConfigured: boolean;
  hashKeyConfigured: boolean;
  postbackSecretConfigured: boolean;
  mode: 'live' | 'unconfigured';
}

export interface FetchSurveysResult {
  success: boolean;
  surveys: NormalizedSurvey[];
  totalAvailable: number;
  message?: string;
  source: 'cpx_api' | 'none';
}

export interface UserProfilingInfo {
  birthday_day?: number | string;
  birthday_month?: number | string;
  birthday_year?: number | string;
  gender?: 'm' | 'f';
  user_country_code?: string;
  zip_code?: string;
}

export class CpxResearchService {
  private get cpxProvider() {
    return dbStore.getProviderById('cpx');
  }

  private get appId(): string {
    return this.cpxProvider?.appId || process.env.CPX_APP_ID || '37479';
  }

  private get hashKey(): string {
    return this.cpxProvider?.hashKey || this.cpxProvider?.secretKey || process.env.CPX_HASH_KEY || 'yTrC9mntJwV1PSRJ5WdMbwMSel6qMheY';
  }

  private get postbackSecret(): string {
    return this.cpxProvider?.secretKey || process.env.CPX_POSTBACK_SECRET || 'yTrC9mntJwV1PSRJ5WdMbwMSel6qMheY';
  }

  /**
   * Returns current integration configuration status.
   */
  getConfigStatus(): CpxConfigStatus {
    const appIdConfigured = Boolean(this.appId && this.appId !== 'YOUR_CPX_APP_ID');
    const hashKeyConfigured = Boolean(this.hashKey && this.hashKey !== 'YOUR_CPX_SECURE_HASH_KEY');
    const postbackSecretConfigured = Boolean(this.postbackSecret && this.postbackSecret !== 'YOUR_CPX_POSTBACK_SECRET');

    const isConfigured = appIdConfigured && hashKeyConfigured;
    return {
      isConfigured,
      appIdConfigured,
      hashKeyConfigured,
      postbackSecretConfigured,
      mode: isConfigured ? 'live' : 'unconfigured'
    };
  }

  /**
   * Retrieves live surveys using the official live CPX endpoint:
   * https://live-api.cpx-research.com/api/get-surveys.php
   */
  async fetchEligibleSurveys(params: {
    externalUserId: string;
    ipAddress?: string;
    userAgent?: string;
    subid1?: string;
    subid2?: string;
    profiling?: UserProfilingInfo;
  }): Promise<FetchSurveysResult> {
    const { externalUserId, ipAddress = '127.0.0.1', userAgent = '', subid1 = '', subid2 = '', profiling } = params;
    const config = this.getConfigStatus();

    // If CPX publisher credentials are not yet set up, return honest status
    if (!config.isConfigured) {
      return {
        success: true,
        surveys: [],
        totalAvailable: 0,
        message: 'CPX Research publisher credentials (CPX_APP_ID and CPX_HASH_KEY) need to be configured in your publisher dashboard or environment.',
        source: 'none'
      };
    }

    try {
      const secureHash = generateCpxSecureHash(externalUserId, this.hashKey);

      const url = new URL('https://live-api.cpx-research.com/api/get-surveys.php');
      url.searchParams.set('app_id', this.appId);
      url.searchParams.set('ext_user_id', externalUserId);
      url.searchParams.set('subid_1', subid1);
      url.searchParams.set('subid_2', subid2);
      url.searchParams.set('output_method', 'api');
      url.searchParams.set('ip_user', ipAddress);
      url.searchParams.set('limit', '12');
      url.searchParams.set('secure_hash', secureHash);
      if (userAgent) {
        url.searchParams.set('user_agent', userAgent);
      }

      // Add profiling parameters if available
      if (profiling) {
        url.searchParams.set('main_info', 'true');
        if (profiling.birthday_day) url.searchParams.set('birthday_day', String(profiling.birthday_day));
        if (profiling.birthday_month) url.searchParams.set('birthday_month', String(profiling.birthday_month));
        if (profiling.birthday_year) url.searchParams.set('birthday_year', String(profiling.birthday_year));
        if (profiling.gender) url.searchParams.set('gender', profiling.gender);
        if (profiling.user_country_code) url.searchParams.set('user_country_code', profiling.user_country_code);
        if (profiling.zip_code) url.searchParams.set('zip_code', profiling.zip_code);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RewardRiver-Server/1.0'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`CPX API HTTP response: status=${response.status}`);
        return {
          success: false,
          surveys: [],
          totalAvailable: 0,
          message: `CPX Research API returned status ${response.status}.`,
          source: 'none'
        };
      }

      const json = await response.json();
      if (json.status === 'success') {
        const userShare = this.cpxProvider?.userSharePercent ?? dbStore.getSettings().defaultUserSharePercent ?? 40;
        const normalized = normalizeCpxSurveyList(json, this.appId, externalUserId, this.hashKey, userShare);
        return {
          success: true,
          surveys: normalized,
          totalAvailable: json.count_available_surveys || normalized.length,
          message: normalized.length === 0 ? 'At this moment no surveys available for your profile' : undefined,
          source: 'cpx_api'
        };
      } else {
        return {
          success: true,
          surveys: [],
          totalAvailable: 0,
          message: 'At this moment no surveys available for your profile',
          source: 'cpx_api'
        };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('CPX Research Service live call exception:', errorMsg);
      return {
        success: false,
        surveys: [],
        totalAvailable: 0,
        message: 'Could not connect to CPX Research server. Please check network connectivity or try again.',
        source: 'none'
      };
    }
  }

  /**
   * Generates official CPX survey start URL for a specific survey or survey wall.
   */
  generateSurveyStartUrl(externalUserId: string, surveyId?: string): string {
    const config = this.getConfigStatus();
    if (!config.isConfigured) {
      return `https://oul.cpx-research.com/index.php?app_id=${this.appId || '10'}&ext_user_id=${encodeURIComponent(externalUserId)}`;
    }

    return buildCpxSurveyUrl({
      appId: this.appId,
      extUserId: externalUserId,
      hashKey: this.hashKey,
      surveyId,
      mainColor: '0284c7'
    });
  }

  /**
   * Verifies incoming server-to-server postback signature.
   */
  verifyPostback(transId: string, extUserId: string, secureHash?: string): boolean {
    const effectiveSecret = this.hashKey || this.postbackSecret;
    if (!effectiveSecret || !secureHash) {
      return false;
    }
    return verifyCpxPostbackSignature(transId, extUserId, secureHash, effectiveSecret);
  }
}

export const cpxResearchService = new CpxResearchService();
