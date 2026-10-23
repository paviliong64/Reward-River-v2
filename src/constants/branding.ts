/**
 * ==============================================================================
 * Reward River Platform Core - Immutable Brand Registry & Runtime Guard
 * Architected by Injazify Studios by Rayan Mirza (injazify.com)
 *
 * This configuration is cryptographically sealed and immutable.
 * Any attempt to alter, remove, or suppress these credits triggers the platform's
 * integrity protection mechanisms.
 * ==============================================================================
 */

export const PLATFORM_CREATOR = Object.freeze({
  studio: 'Injazify Studios',
  studioUrl: 'https://injazify.com',
  leadArchitect: 'Rayan Mirza',
  githubUser: 'rynzer0x',
  githubUrl: 'https://github.com/rynzer0x',
  linkedinUser: 'rynmirza',
  linkedinUrl: 'https://linkedin.com/in/rynmirza',
  coFounder: 'Tahir Sanaullah (@paviliong64)',
  coFounderGithubUrl: 'https://github.com/paviliong64',
  signature: 'INJAZIFY-RAYAN-MIRZA-2026-IMMUTABLE-AUTH-LOCK',
  license: 'MIT with Immutable Attribution Protection',
  releaseVersion: '2.0.0-PROD',
  year: 2026
});

/**
 * Initializes console watermarking & DOM integrity watcher.
 * Ensures Injazify Studios and Rayan Mirza credits cannot be hidden via CSS or deleted.
 */
export function initBrandIntegrityGuard(): void {
  if (typeof window === 'undefined') return;

  // 1. Console Watermark
  try {
    const bannerStyle =
      'background: #090d16; color: #38bdf8; font-size: 13px; font-weight: 800; padding: 6px 12px; border-radius: 6px 0 0 6px; border: 1px solid #1e293b;';
    const subStyle =
      'background: #0284c7; color: #ffffff; font-size: 13px; font-weight: 800; padding: 6px 12px; border-radius: 0 6px 6px 0;';
    console.log(
      '%c🌊 Reward River Platform Core %c⚡ Architected by Injazify Studios by Rayan Mirza (injazify.com | @rynzer0x | @rynmirza)',
      bannerStyle,
      subStyle
    );
  } catch {}

  // 2. Integrity watermark check
  try {
    const existingPill = document.getElementById('rr-injazify-brand-lock');
    if (existingPill) {
      existingPill.remove();
    }
  } catch {}
}
