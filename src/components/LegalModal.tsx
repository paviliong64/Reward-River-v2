import React from 'react';
import { X, FileText, Mail, Globe, ExternalLink, Linkedin } from 'lucide-react';

interface LegalModalProps {
  page: string | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ page, onClose }) => {
  if (!page) return null;

  const titles: Record<string, string> = {
    'terms': 'Terms of Service',
    'privacy': 'Privacy Policy',
    'withdrawal-rules': 'Tether (USDT) Withdrawal Rules & Policies',
    'responsible-guidelines': 'Responsible Survey Participation Guidelines',
    'contact': 'Support & Contact'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              {titles[page] || 'Platform Documentation'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto text-xs text-slate-600 leading-relaxed space-y-4">
          {page === 'terms' && (
            <>
              <h4 className="text-sm font-bold text-slate-900">1. Acceptance of Terms</h4>
              <p>
                By creating an account or accessing Reward River, you agree to comply with and be bound by these Terms of Service. If you do not agree, you must discontinue using the platform immediately.
              </p>

              <h4 className="text-sm font-bold text-slate-900">2. Research Network Partners</h4>
              <p>
                Market research surveys are facilitated through verified market research exchanges and sponsors. Survey availability, criteria, demographic requirements, and reward confirmation are governed by the respective research sponsors. Reward River is an independent rewards platform providing real-time USDT settlements upon verified completion.
              </p>

              <h4 className="text-sm font-bold text-slate-900">3. Reward Crediting & Reversals</h4>
              <p>
                Rewards are credited to your account only upon receipt of an authenticated cryptographic completion callback (postback) from the survey provider. If a sponsor determines that responses were fraudulent, inconsistent, or completed via automated means, rewards are subject to reversal.
              </p>

              <h4 className="text-sm font-bold text-slate-900">4. Prohibited Conduct</h4>
              <p>
                Users are strictly forbidden from creating multiple accounts, using VPNs, proxies, Tor, bot scripts, or submitting fabricated responses. Any breach will result in immediate permanent account termination and forfeiture of all pending and reserved balances.
              </p>
            </>
          )}

          {page === 'privacy' && (
            <>
              <h4 className="text-sm font-bold text-slate-900">1. Information We Collect</h4>
              <p>
                We collect minimal personal information necessary to deliver service: your email address, display name, password hash (salted and hashed via PBKDF2; plaintext passwords are never stored), and your public USDT payout addresses.
              </p>

              <h4 className="text-sm font-bold text-slate-900">2. External User Identification</h4>
              <p>
                To protect your privacy with third-party survey networks, Reward River generates a unique opaque external identifier (e.g. <code>rr_cpx_...</code>). Your email address is never disclosed to survey networks or research sponsors.
              </p>

              <h4 className="text-sm font-bold text-slate-900">3. Custody & Private Key Safeguards</h4>
              <p>
                Reward River is a non-custodial rewards processor. We never generate, store, or ask for your crypto private keys or wallet seed phrases.
              </p>
            </>
          )}

          {page === 'withdrawal-rules' && (
            <>
              <h4 className="text-sm font-bold text-slate-900">1. USDT-Only Payout Policy</h4>
              <p>
                Tether USD (USDT) is the exclusive payout asset supported on Reward River. We do not support fiat transfers, PayPal, gift cards, or alternative cryptocurrencies.
              </p>

              <h4 className="text-sm font-bold text-slate-900">2. Supported USDT Networks</h4>
              <p>
                Withdrawals are dispatched on either the TRON network (TRC-20, addresses starting with T) or Ethereum / EVM network (ERC-20, addresses starting with 0x). TRC-20 is recommended for lowest transfer fees ($1.00 flat fee). Users are strictly responsible for verifying the accuracy and network compatibility of their destination address before submission.
              </p>

              <h4 className="text-sm font-bold text-slate-900">3. Minimums & Transfer Fees</h4>
              <p>
                The minimum withdrawal request is $25.00 USDT. Applicable on-chain transfer fees ($1.00 for TRC-20 or $2.50 for ERC-20) are subtracted from the gross amount to determine the net payout received by your wallet.
              </p>

              <h4 className="text-sm font-bold text-slate-900">4. Review & Settlement</h4>
              <p>
                To maintain platform security, withdrawal requests are verified against confirmed provider ledger entries. Settled payouts will display the corresponding on-chain transaction hash (TxID).
              </p>
            </>
          )}

          {page === 'responsible-guidelines' && (
            <>
              <h4 className="text-sm font-bold text-slate-900">Guidelines for Quality Participation</h4>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Take your time: Read each question thoroughly. Speeding through surveys triggers automated quality red flags.</li>
                <li>Be truthful: Consistent answers across demographics ensure continuous access to high-value research surveys.</li>
                <li>Disable VPNs/Proxies: Survey exchanges automatically disqualify traffic originating from commercial VPN IP ranges.</li>
                <li>Respect quotas: When a researcher's demographic quota is full, polite early screenouts allow you to quickly move to another study.</li>
              </ul>
            </>
          )}

          {page === 'contact' && (
            <>
              <h4 className="text-sm font-bold text-slate-900">Support & Contact Inquiries</h4>
              <p>
                Reward River is developed and supported exclusively by <strong>www.injazify.com</strong>. For any technical support, account inquiries, or withdrawal assistance, visit our official portal:
              </p>
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-3 mt-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Official Support & Platform Architects:</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href="https://www.injazify.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                  >
                    <span>www.injazify.com</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://linkedin.com/in/rynmirza"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>Rayan Mirza (@rynmirza)</span>
                  </a>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  All platform architecture, enterprise integrations, and support are managed by <strong>Injazify Studios by Rayan Mirza</strong> (<a href="https://linkedin.com/in/rynmirza" target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:underline font-bold">LinkedIn: @rynmirza</a>).
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
};
