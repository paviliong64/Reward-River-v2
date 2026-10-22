import React from 'react';
import { Logo } from './Logo';
import { Shield, HelpCircle, FileText, Lock, RefreshCw, Linkedin, Github } from 'lucide-react';

interface FooterProps {
  onOpenLegal: (page: string) => void;
  onSelectTab?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, onSelectTab }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <Logo size="md" inverted={true} />
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              Reward River is a modern rewards platform where verified survey participation flows directly into USDT payouts. Clean, transparent, and built for privacy.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Zero-seed-phrase security. We never ask for your crypto private keys.</span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Platform & Rewards
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onOpenLegal('withdrawal-rules')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  USDT Withdrawal Rules
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('responsible-guidelines')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  Responsible Participation
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('contact')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Support & Contact
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab ? onSelectTab('admin') : (window.location.hash = '#admin')}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-slate-400"
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  Command Center (Admin)
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Pages */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Legal & Compliance
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onOpenLegal('terms')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('privacy')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Privacy Policy
                </button>
              </li>
              <li>
                <span className="text-xs text-slate-500 block pt-1">
                  Settlement: Tether USD (USDT) TRC-20 & ERC-20
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Third-Party Provider & Financial Disclaimers */}
        <div className="pt-8 border-t border-slate-800 space-y-3 text-xs text-slate-400 leading-relaxed">
          <p>
            <strong className="text-slate-300">Market Research Participation Notice:</strong> Market research surveys displayed on Reward River are powered by verified global research networks. Survey inventory, qualifications, and rewards are determined dynamically by research sponsors based on demographic criteria.
          </p>
          <p>
            <strong className="text-slate-300">Tether (USDT) Stablecoin Disclosures:</strong> Payouts are made in Tether USD (USDT), a cryptocurrency pegged 1:1 to the US dollar. Network transfer fees apply based on your selected blockchain network (TRC-20 or ERC-20). Reward River does not offer investment advice or speculate on crypto markets.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-800/60 text-slate-400 gap-3 text-xs">
            <div id="rr-injazify-brand-lock" className="flex items-center gap-2 flex-wrap">
              <span>© {new Date().getFullYear()} Reward River. All rights reserved.</span>
              <span className="text-slate-600">•</span>
              <span>Architected & Built with precision by <a href="https://injazify.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline transition-colors">Injazify Studios</a> by <strong className="text-white">Rayan Mirza</strong> (<a href="https://injazify.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white hover:underline">injazify.com</a>)</span>
              <a
                href="https://linkedin.com/in/rynmirza"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 border border-[#0A66C2]/40 text-sky-300 hover:text-white transition-all text-[11px] font-semibold"
                title="Rayan Mirza LinkedIn Profile (@rynmirza)"
              >
                <Linkedin className="w-3 h-3 text-[#0A66C2]" />
                <span>LinkedIn (@rynmirza)</span>
              </a>
              <a
                href="https://github.com/rynzer0x"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all text-[11px] font-semibold"
                title="Rayan Mirza GitHub Profile (@rynzer0x)"
              >
                <Github className="w-3 h-3 text-slate-300" />
                <span>GitHub (@rynzer0x)</span>
              </a>
            </div>
            <span className="text-slate-500">Earn Rewards. Flow Forward.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
