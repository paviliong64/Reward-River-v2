import React, { useState } from 'react';
import { TaskCampaign, TaskSubmission, AdvertiserOverview, AdvertiserDeposit, User } from '../types';
import {
  PlusCircle,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  CreditCard,
  Eye,
  Pause,
  Play,
  Send,
  HelpCircle,
  Wallet
} from 'lucide-react';

interface AdvertiserViewProps {
  user: User;
  overview: AdvertiserOverview | null;
  campaigns: TaskCampaign[];
  submissions: TaskSubmission[];
  deposits: AdvertiserDeposit[];
  onRefresh: () => void;
  onCreateCampaign: (campaign: any) => Promise<{ success: boolean; error?: string }>;
  onUpdateCampaignStatus: (taskId: string, status: string) => Promise<{ success: boolean; error?: string }>;
  onReviewSubmission: (submissionId: string, action: 'approved' | 'rejected', reason?: string) => Promise<{ success: boolean; error?: string }>;
  onDepositFunds: (amountUsd: number, method: string) => Promise<{ success: boolean; error?: string }>;
}

export function AdvertiserView({
  user,
  overview,
  campaigns,
  submissions,
  deposits,
  onRefresh,
  onCreateCampaign,
  onUpdateCampaignStatus,
  onReviewSubmission,
  onDepositFunds
}: AdvertiserViewProps) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'create' | 'submissions' | 'billing'>('campaigns');

  // Create Campaign Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState<'signup' | 'app' | 'social' | 'review' | 'website' | 'other'>('signup');
  const [targetUrl, setTargetUrl] = useState('');
  const [rewardPoints, setRewardPoints] = useState<number>(1000);
  const [slots, setSlots] = useState<number>(50);
  const [targetCountry, setTargetCountry] = useState('ALL');
  const [targetDevice, setTargetDevice] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [requiredProofType, setRequiredProofType] = useState<'text' | 'screenshot' | 'reference_id' | 'both'>('both');
  const [proofInstructions, setProofInstructions] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Rejection modal state
  const [rejectingSub, setRejectingSub] = useState<TaskSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Screenshot preview modal state
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);

  // Deposit Form State
  const [depositAmountUsd, setDepositAmountUsd] = useState<number>(10);
  const [depositMethod, setDepositMethod] = useState<'faucetpay' | 'usdt_trc20' | 'manual'>('faucetpay');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState<string | null>(null);

  // Exact JobsWorkTech Campaign Cost Math:
  const pointsRate = overview?.pointsRatePerUsd || 10000; // 10,000 Points = $1
  const feePercent = overview?.platformFeePercent || 10; // 10%
  const userRewardBudgetPoints = Math.max(0, rewardPoints * slots);
  const platformFeePoints = Math.max(0, Math.round(userRewardBudgetPoints * (feePercent / 100)));
  const totalCostPoints = userRewardBudgetPoints + platformFeePoints;
  const totalCostUsd = totalCostPoints / pointsRate;

  // Deposit preview points
  const depositPointsPreview = Math.round(depositAmountUsd * pointsRate);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    const stepArray = instructions
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const res = await onCreateCampaign({
      title,
      description,
      instructions: stepArray.length ? stepArray : [instructions],
      category,
      targetUrl,
      rewardPoints,
      totalSlots: slots,
      targetCountry,
      targetDevice,
      requiredProofType,
      proofInstructions
    });

    setCreateLoading(false);
    if (res.success) {
      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setActiveTab('campaigns');
        onRefresh();
        // Reset form
        setTitle('');
        setDescription('');
        setInstructions('');
        setTargetUrl('');
        setProofInstructions('');
      }, 1500);
    } else {
      setCreateError(res.error || 'Failed to create campaign.');
    }
  };

  const handleApproveSub = async (sub: TaskSubmission) => {
    setReviewLoading(true);
    await onReviewSubmission(sub.id, 'approved');
    setReviewLoading(false);
    onRefresh();
  };

  const handleConfirmReject = async () => {
    if (!rejectingSub) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejecting the submission.');
      return;
    }
    setReviewLoading(true);
    await onReviewSubmission(rejectingSub.id, 'rejected', rejectionReason.trim());
    setReviewLoading(false);
    setRejectingSub(null);
    setRejectionReason('');
    onRefresh();
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositLoading(true);
    setDepositMsg(null);
    const res = await onDepositFunds(depositAmountUsd, depositMethod);
    setDepositLoading(false);
    if (res.success) {
      setDepositMsg(`Successfully added $${depositAmountUsd.toFixed(2)} to advertiser balance!`);
      onRefresh();
      setTimeout(() => setDepositMsg(null), 3000);
    } else {
      setDepositMsg(res.error || 'Deposit failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold mb-3">
              <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
              Advertiser Campaign Manager
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Grow Your Audience with Verified Micro-Tasks
            </h1>
            <p className="mt-2 text-slate-300 text-sm max-w-xl">
              Launch targeted campaigns for app installs, sign-ups, and engagement. Set your reward, review structured proof, and pay only for approved completions.
            </p>
          </div>

          {/* Advertiser Balance Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shrink-0 w-full md:w-72">
            <div className="text-xs text-sky-300 font-semibold uppercase tracking-wider">Advertiser Balance</div>
            <div className="text-2xl font-black mt-1 text-white">
              {overview?.advertiserBalanceFormatted || '$0.00 USDT'}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              ≈ {(overview?.advertiserBalancePoints || 0).toLocaleString()} Points
            </div>
            <button
              onClick={() => setActiveTab('billing')}
              className="mt-3 w-full py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5" /> Deposit Funds
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-400 font-medium">Active Campaigns</span>
          <div className="text-xl font-extrabold text-slate-800 mt-1">
            {overview?.activeCampaignsCount || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-400 font-medium">Pending Proofs</span>
          <div className="text-xl font-extrabold text-amber-600 mt-1">
            {overview?.pendingProofsCount || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-400 font-medium">Approved Completions</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">
            {overview?.totalApprovedWorkerProofs || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-400 font-medium">Platform Fee</span>
          <div className="text-xl font-extrabold text-slate-800 mt-1">
            {overview?.platformFeePercent || 10}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'campaigns'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          My Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'create'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" /> Create Campaign
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap relative ${
            activeTab === 'submissions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Review Proofs ({submissions.filter(s => s.status === 'pending_review').length})
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'billing'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Finance & Billing
        </button>
      </div>

      {/* TAB 1: MY CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No campaigns created yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Ready to promote your project, social channel, or mobile app? Create your first campaign with custom worker slots.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-4 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-md inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> Create First Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map(camp => {
                const slotsRemaining = Math.max(0, camp.totalSlots - camp.completedSlots);
                const progressPct = Math.min(100, Math.round((camp.completedSlots / camp.totalSlots) * 100));

                return (
                  <div key={camp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700">
                        {camp.category}
                      </span>
                      {camp.status === 'active' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Live
                        </span>
                      )}
                      {camp.status === 'pending_approval' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Awaiting Admin Approval
                        </span>
                      )}
                      {camp.status === 'paused' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 flex items-center gap-1">
                          <Pause className="w-3 h-3" /> Paused
                        </span>
                      )}
                      {camp.status === 'completed' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{camp.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{camp.description}</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Slots filled</span>
                        <span className="font-bold">{camp.completedSlots} / {camp.totalSlots}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block">Reward per worker</span>
                        <span className="font-bold text-slate-900">
                          {camp.rewardPoints.toLocaleString()} Points (${(camp.rewardCents / 100).toFixed(2)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {camp.status === 'active' && (
                          <button
                            onClick={() => onUpdateCampaignStatus(camp.id, 'paused')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1"
                          >
                            <Pause className="w-3 h-3" /> Pause
                          </button>
                        )}
                        {camp.status === 'paused' && (
                          <button
                            onClick={() => onUpdateCampaignStatus(camp.id, 'active')}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" /> Resume
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE CAMPAIGN */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Create Campaign</h2>
            <p className="text-xs text-slate-500 mb-6">
              Worker budget is reserved safely upon campaign submission.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campaign Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Subscribe to Tech Channel & Like Video"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  >
                    <option value="signup">Sign-up / Registration</option>
                    <option value="app">Mobile App Download</option>
                    <option value="social">Social Media (YouTube, X, TG)</option>
                    <option value="review">Reviews & Ratings</option>
                    <option value="website">Website Visit & Engagement</option>
                    <option value="other">Custom Task</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target URL / Landing Page <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    placeholder="https://example.com/signup"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief summary of what the worker needs to do"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Step-by-Step Instructions (one per line) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="1. Click target link&#10;2. Create free account&#10;3. Verify email address&#10;4. Submit username as proof"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reward Points per Worker <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    required
                    value={rewardPoints}
                    onChange={e => setRewardPoints(Math.max(100, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    ≈ ${(rewardPoints / pointsRate).toFixed(2)} USDT value per worker
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Workers (Slots) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    required
                    value={slots}
                    onChange={e => setSlots(Math.max(5, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Device Targeting</label>
                  <select
                    value={targetDevice}
                    onChange={e => setTargetDevice(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  >
                    <option value="all">All Devices (Desktop & Mobile)</option>
                    <option value="mobile">Mobile Devices Only</option>
                    <option value="desktop">Desktop Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Required Proof Type</label>
                  <select
                    value={requiredProofType}
                    onChange={e => setRequiredProofType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  >
                    <option value="both">Both Text & Screenshot Proof</option>
                    <option value="text">Text / Username Proof Only</option>
                    <option value="screenshot">Screenshot Only</option>
                    <option value="reference_id">Reference / Transaction ID</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Proof Instructions</label>
                <input
                  type="text"
                  required
                  value={proofInstructions}
                  onChange={e => setProofInstructions(e.target.value)}
                  placeholder="e.g. Upload screenshot of your profile page and enter username"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                />
              </div>

              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-semibold">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Campaign created successfully!</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createLoading || createSuccess}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createLoading ? 'Calculating and Reserving Budget...' : 'Confirm & Launch Campaign'}
                </button>
              </div>
            </form>
          </div>

          {/* Live Campaign Cost Preview Card (JobsWorkTech Layout) */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                Campaign Cost Preview
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Transparent advertiser billing in Global Points.
              </p>

              <div className="space-y-3 text-xs border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reward per worker</span>
                  <span className="font-bold">{rewardPoints.toLocaleString()} Points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Workers</span>
                  <span className="font-bold">{slots}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">User reward budget</span>
                  <span className="font-bold">{userRewardBudgetPoints.toLocaleString()} Points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Platform fee ({feePercent}%)</span>
                  <span className="font-bold">{platformFeePoints.toLocaleString()} Points</span>
                </div>

                <div className="pt-3 border-t border-slate-700/80 flex justify-between items-baseline">
                  <span className="text-slate-200 font-bold">Total Advertiser Cost</span>
                  <div className="text-right">
                    <span className="text-lg font-black text-sky-400">
                      {totalCostPoints.toLocaleString()} Points
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      ≈ ${totalCostUsd.toFixed(2)} USDT
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                <div>✓ User receives full advertised reward</div>
                <div>✓ Platform fee added separately at {feePercent}%</div>
                <div>✓ Unused worker budget can be safely released</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEW SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Worker Proof Submissions</h2>
              <p className="text-xs text-slate-500">Review submitted work. Approved rewards credit worker instantly.</p>
            </div>
            <button onClick={onRefresh} className="text-xs text-sky-600 font-semibold hover:underline">
              Refresh
            </button>
          </div>

          {submissions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No worker submissions currently pending review.
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map(sub => (
                <div key={sub.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-slate-900">{sub.taskTitle}</span>
                      <span className="text-xs text-slate-400 block">Worker: {sub.workerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-sky-600">
                        {sub.rewardPoints.toLocaleString()} Points (${(sub.rewardCents / 100).toFixed(2)})
                      </span>
                      {sub.status === 'pending_review' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Pending
                        </span>
                      ) : sub.status === 'approved' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block font-medium">Text Proof:</span>
                      <span className="text-slate-700 font-medium">{sub.proofText || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Reference ID:</span>
                      <span className="text-slate-700 font-medium">{sub.proofReferenceId || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Screenshot:</span>
                      {sub.proofScreenshotUrl ? (
                        <button
                          onClick={() => setPreviewScreenshotUrl(sub.proofScreenshotUrl!)}
                          className="text-sky-600 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Image Proof
                        </button>
                      ) : (
                        <span className="text-slate-400">None attached</span>
                      )}
                    </div>
                  </div>

                  {sub.status === 'pending_review' && (
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          setRejectingSub(sub);
                          setRejectionReason('');
                        }}
                        disabled={reviewLoading}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition"
                      >
                        Reject with Reason
                      </button>
                      <button
                        onClick={() => handleApproveSub(sub)}
                        disabled={reviewLoading}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                      >
                        Approve & Credit Reward
                      </button>
                    </div>
                  )}

                  {sub.rejectionReason && (
                    <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg font-medium">
                      Rejection Reason: {sub.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FINANCE & BILLING */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Deposit Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-500" />
              Deposit Funds
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Add budget to launch new worker campaigns. External payments credit automatically in Points.
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deposit Amount (USD / USDT)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={depositAmountUsd}
                    onChange={e => setDepositAmountUsd(Math.max(1, Number(e.target.value)))}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* Deposit Points Preview */}
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900">
                <span className="font-semibold block">Verified Credit Preview:</span>
                <span className="font-extrabold text-sky-700 text-sm">
                  {depositPointsPreview.toLocaleString()} Points
                </span>
                <span className="text-sky-600 block mt-0.5">
                  Rate: 10,000 Points = $1.00 USD
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={depositMethod}
                  onChange={e => setDepositMethod(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                >
                  <option value="faucetpay">FaucetPay Instant Checkout</option>
                  <option value="usdt_trc20">USDT TRC-20 Transfer</option>
                  <option value="manual">Manual Admin Review Deposit</option>
                </select>
              </div>

              {depositMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                  {depositMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={depositLoading}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                {depositLoading ? 'Processing Deposit...' : `Confirm Deposit of $${depositAmountUsd.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Deposits History */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Advertiser Deposit History</h2>
            <p className="text-xs text-slate-500 mb-4">All processed external payments and credited balances.</p>

            {deposits.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No deposit history recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Points Credited</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {deposits.map(d => (
                      <tr key={d.id}>
                        <td className="py-2.5 px-3">{new Date(d.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 uppercase font-medium">{d.method}</td>
                        <td className="py-2.5 px-3 font-bold">${(d.amountCents / 100).toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-semibold text-sky-600">+{d.amountPoints.toLocaleString()} Pts</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            Confirmed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reject Worker Submission</h3>
            <p className="text-xs text-slate-500">
              Provide a clear reason explaining why the submitted proof was insufficient so the worker can correct it.
            </p>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Screenshot does not show completed registration or username does not match."
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingSub(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={reviewLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md transition disabled:opacity-50"
              >
                {reviewLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREENSHOT PREVIEW MODAL */}
      {previewScreenshotUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 shadow-2xl relative">
            <button
              onClick={() => setPreviewScreenshotUrl(null)}
              className="absolute right-4 top-4 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition"
            >
              ✕
            </button>
            <h4 className="text-sm font-bold text-slate-800 mb-3">Submitted Screenshot Proof</h4>
            <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 max-h-[70vh] flex items-center justify-center">
              <img
                src={previewScreenshotUrl}
                alt="Worker Proof"
                className="max-h-[68vh] object-contain"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                  alert('Unable to load image directly. Opening in new tab.');
                  window.open(previewScreenshotUrl, '_blank');
                  setPreviewScreenshotUrl(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
