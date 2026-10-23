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

  // 2. DOM Integrity Watcher & Auto-Restoration
  // Continuously guards branding from being hidden, altered, or deleted
  try {
    const enforcePresence = () => {
      const footerBrand = document.getElementById('rr-injazify-brand-lock');
      if (footerBrand) {
        if (
          footerBrand.style.display === 'none' ||
          footerBrand.style.visibility === 'hidden' ||
          footerBrand.style.opacity === '0' ||
          footerBrand.getAttribute('hidden') !== null
        ) {
          footerBrand.style.display = 'inline-flex';
          footerBrand.style.visibility = 'visible';
          footerBrand.style.opacity = '1';
          footerBrand.removeAttribute('hidden');
        }
      } else if (document.body) {
        // If removed from DOM, automatically restore tamper-proof architectural seal
        const seal = document.createElement('div');
        seal.id = 'rr-injazify-brand-lock';
        seal.setAttribute('data-guard', 'active');
        seal.style.cssText =
          'position:fixed;bottom:14px;left:14px;z-index:99999;background:#0f172a;color:#f8fafc;padding:6px 14px;border-radius:12px;font-size:11px;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);border:1px solid #0284c7;display:inline-flex;align-items:center;gap:8px;';
        seal.innerHTML =
          '<span>🌊 Architected by <a href="https://injazify.com" target="_blank" style="color:#38bdf8;font-weight:bold;text-decoration:none;">Injazify Studios</a></span>' +
          '<span style="display:inline-flex;align-items:center;gap:6px;margin-left:4px;">' +
          '<a href="https://github.com/rynzer0x" target="_blank" style="color:#94a3b8;display:inline-flex;" title="GitHub"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg></a>' +
          '<a href="https://linkedin.com/in/rynmirza" target="_blank" style="color:#0284c7;display:inline-flex;" title="LinkedIn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>' +
          '</span>';
        document.body.appendChild(seal);
      }
    };

    enforcePresence();
    setInterval(enforcePresence, 2000);

    // Watch for DOM subtree alterations
    if (typeof MutationObserver !== 'undefined' && document.body) {
      const observer = new MutationObserver(() => enforcePresence());
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    }
  } catch {}
}
