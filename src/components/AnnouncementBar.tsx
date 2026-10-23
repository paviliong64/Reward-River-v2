import React, { useState } from 'react';
import { PlatformAnnouncement } from '../types';
import {
  Sparkles,
  X,
  Bell,
  ArrowRight,
  ChevronRight,
  Info,
  Zap,
  Gift
} from 'lucide-react';

interface AnnouncementBarProps {
  announcement: PlatformAnnouncement | null;
  allAnnouncements: PlatformAnnouncement[];
  onNavigateTab: (tab: string) => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  announcement,
  allAnnouncements,
  onNavigateTab
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (!announcement || dismissed) return null;

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'bonus':
        return 'bg-amber-400 text-slate-950 border-amber-300';
      case 'alert':
        return 'bg-rose-500 text-white border-rose-400';
      case 'warning':
        return 'bg-orange-500 text-white border-orange-400';
      default:
        return 'bg-cyan-400 text-slate-950 border-cyan-300';
    }
  };

  return (
    <>
      {/* Top Banner */}
      <div className="relative z-50 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white text-xs px-3 sm:px-4 py-2 border-b border-sky-900/40 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-xs ${getBadgeStyle(
                announcement.type
              )}`}
            >
              {announcement.badge || 'UPDATE'}
            </span>
            <span className="font-extrabold text-white truncate hidden sm:inline">
              {announcement.title}:
            </span>
            <span className="text-slate-300 truncate text-[11px] sm:text-xs">
              {announcement.message}
            </span>
            {announcement.linkText && (
              <button
                onClick={() => {
                  if (announcement.linkTab) onNavigateTab(announcement.linkTab);
                }}
                className="shrink-0 text-cyan-300 hover:text-white font-bold flex items-center gap-0.5 underline transition"
              >
                <span>{announcement.linkText}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {allAnnouncements.length > 1 && (
              <button
                onClick={() => setModalOpen(true)}
                className="hidden md:flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 rounded-lg border border-slate-700 transition"
                title="View All Announcements"
              >
                <Bell className="w-3 h-3 text-cyan-400" />
                <span>News ({allAnnouncements.length})</span>
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Dismiss announcement bar"
              aria-label="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Announcements Center Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Platform Announcements</h3>
                  <p className="text-xs text-slate-500">Live platform news, bonus drops & updates</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-3 flex-1 divide-y divide-slate-100">
              {allAnnouncements.map((ann) => (
                <div key={ann.id} className="pt-3 first:pt-0 text-left">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getBadgeStyle(
                        ann.type
                      )}`}
                    >
                      {ann.badge || 'INFO'}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{ann.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{ann.message}</p>
                  {ann.linkText && (
                    <button
                      onClick={() => {
                        setModalOpen(false);
                        if (ann.linkTab) onNavigateTab(ann.linkTab);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 mt-2"
                    >
                      <span>{ann.linkText}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
