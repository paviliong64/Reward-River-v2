import React, { useState, useEffect } from 'react';
import { AdSettings, AdSlotConfig } from '../types';
import { X, Sparkles, ExternalLink } from 'lucide-react';

interface AdBannersProps {
  adSettings: AdSettings | null;
}

export function AdBanners({ adSettings }: AdBannersProps) {
  const [bottomDismissed, setBottomDismissed] = useState(false);
  const [railDismissed, setRailDismissed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [dynamicSlots, setDynamicSlots] = useState<AdSlotConfig[]>([]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('rr_sticky_bottom_dismissed') === '1') setBottomDismissed(true);
      if (sessionStorage.getItem('rr_sticky_rail_dismissed') === '1') setRailDismissed(true);
    } catch {}

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    // Fetch dynamic ad slots from admin portal API
    fetch('/api/public/ad-slots')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) setDynamicSlots(data);
      })
      .catch(() => {});

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDismissBottom = () => {
    setBottomDismissed(true);
    try {
      sessionStorage.setItem('rr_sticky_bottom_dismissed', '1');
    } catch {}
  };

  const handleDismissRail = () => {
    setRailDismissed(true);
    try {
      sessionStorage.setItem('rr_sticky_rail_dismissed', '1');
    } catch {}
  };

  // Find dynamic slots configured by admin
  const dynamicStickyBottom = dynamicSlots.find(s => s.placement === 'sticky_bottom' && s.enabled);
  const dynamicStickyRail = dynamicSlots.find(s => s.placement === 'sidebar' && s.enabled);

  // Fallback to adSettings legacy codes if dynamic slots are not set
  const bottomCode = dynamicStickyBottom?.adCode || (
    adSettings?.adsEnabled && adSettings?.stickyBottomEnabled ? (
      windowWidth >= 900 ? adSettings.stickyBottom728Code : adSettings.stickyBottom468Code
    ) : null
  );

  const railCode = dynamicStickyRail?.adCode || (
    adSettings?.adsEnabled && adSettings?.stickyRailEnabled ? adSettings.stickyRail300Code : null
  );

  const bottomHeight = windowWidth >= 900 ? '90px' : '60px';
  const bottomWidth = windowWidth >= 900 ? '728px' : '468px';

  return (
    <>
      {/* Sticky Right Rail Ad (Desktop Wide Screens) */}
      {!railDismissed && windowWidth >= 1400 && railCode && (
        <div className="fixed right-4 bottom-24 z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-2.5 flex flex-col items-center animate-in slide-in-from-right duration-300">
          <div className="w-full flex items-center justify-between pb-2 px-1">
            <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Reward River Sponsor
            </span>
            <button
              onClick={handleDismissRail}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              title="Close Ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <iframe
            title="Sponsored Rail"
            srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;}body{display:flex;align-items:center;justify-content:center;min-height:100vh;}img,iframe{max-width:100%;}</style></head><body>${railCode}</body></html>`}
            style={{ width: '300px', height: '250px' }}
            className="rounded-xl border-0 overflow-hidden"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      )}

      {/* Sticky Bottom Banner Ad (Responsive 728x90 or 468x60) */}
      {!bottomDismissed && windowWidth >= 560 && bottomCode && (
        <div className="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none pb-2 animate-in slide-in-from-bottom duration-300">
          <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 p-1.5 flex flex-col items-center max-w-[95vw]">
            <div className="w-full flex items-center justify-between px-2 pb-1">
              <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Reward River Direct Partner
              </span>
              <button
                onClick={handleDismissBottom}
                className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                title="Dismiss Ad"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <iframe
              title="Sponsored Banner"
              srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;}body{display:flex;align-items:center;justify-content:center;min-height:100vh;}img,iframe{max-width:100%;}</style></head><body>${bottomCode}</body></html>`}
              style={{ width: bottomWidth, height: bottomHeight, maxWidth: '100%' }}
              className="rounded-lg border-0 overflow-hidden"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Universal Inline Ad Slot Component
 * Renders any placement (e.g. header_leaderboard, in_feed_banner) directly into the page
 */
export function DynamicAdSlot({ placement, className = '' }: { placement: string; className?: string }) {
  const [slot, setSlot] = useState<AdSlotConfig | null>(null);

  useEffect(() => {
    fetch('/api/public/ad-slots')
      .then(r => r.ok ? r.json() : [])
      .then((slots: AdSlotConfig[]) => {
        if (Array.isArray(slots)) {
          const match = slots.find(s => s.placement === placement && s.enabled);
          if (match) setSlot(match);
        }
      })
      .catch(() => {});
  }, [placement]);

  if (!slot || !slot.adCode) return null;

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm ${className}`}>
      <div className="flex items-center justify-between px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span>{slot.name}</span>
        <span className="text-sky-600 font-semibold">Reward River Direct</span>
      </div>
      <iframe
        title={slot.name}
        srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;}body{display:flex;align-items:center;justify-content:center;}img,iframe{max-width:100%;}</style></head><body>${slot.adCode}</body></html>`}
        className="w-full border-0 rounded-xl"
        style={{ height: slot.format === '728x90' ? '90px' : slot.format === '300x250' ? '250px' : '80px' }}
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}

