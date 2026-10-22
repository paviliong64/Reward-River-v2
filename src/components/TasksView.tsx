import React, { useState } from 'react';
import { TaskCampaign, TaskSubmission, UsdtQuote } from '../types';
import {
  CheckCircle,
  Clock,
  ExternalLink,
  Filter,
  Layers,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Monitor,
  Globe,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  XCircle,
  Sparkles
} from 'lucide-react';

interface TasksViewProps {
  tasks: TaskCampaign[];
  submissions: TaskSubmission[];
  loading: boolean;
  onRefresh: () => void;
  onSubmitProof: (taskId: string, proof: { proofText?: string; proofScreenshotUrl?: string; proofReferenceId?: string }) => Promise<{ success: boolean; error?: string }>;
  usdtQuote: UsdtQuote | null;
}

export function TasksView({
  tasks,
  submissions,
  loading,
  onRefresh,
  onSubmitProof,
  usdtQuote
}: TasksViewProps) {
  const [activeTab, setActiveTab] = useState<'available' | 'submissions'>('available');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskCampaign | null>(null);

  // Proof submission modal form state
  const [proofText, setProofText] = useState('');
  const [proofScreenshotUrl, setProofScreenshotUrl] = useState('');
  const [proofReferenceId, setProofReferenceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const categories = [
    { id: 'all', label: 'All Tasks' },
    { id: 'social', label: 'Social Media' },
    { id: 'signup', label: 'Sign-ups' },
    { id: 'app', label: 'App Installs' },
    { id: 'review', label: 'Reviews' },
    { id: 'website', label: 'Visits' }
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenTask = (task: TaskCampaign) => {
    setSelectedTask(task);
    setProofText('');
    setProofScreenshotUrl('');
    setProofReferenceId('');
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (['text', 'both'].includes(selectedTask.requiredProofType) && !proofText.trim()) {
      setSubmitError('Please enter your required text or username proof.');
      return;
    }
    if (['screenshot', 'both'].includes(selectedTask.requiredProofType) && !proofScreenshotUrl.trim()) {
      setSubmitError('Please provide a valid image screenshot link.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await onSubmitProof(selectedTask.id, {
      proofText: proofText.trim() || undefined,
      proofScreenshotUrl: proofScreenshotUrl.trim() || undefined,
      proofReferenceId: proofReferenceId.trim() || undefined
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmitSuccess(true);
      setTimeout(() => {
        handleCloseModal();
        onRefresh();
        setActiveTab('submissions');
      }, 1500);
    } else {
      setSubmitError(result.error || 'Failed to submit proof. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Marketplace Header */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Verified Micro-Task Marketplace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Complete Micro-Tasks & Get Rewarded
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Browse verified advertiser campaigns. Complete simple instructions, submit structured proof, and receive instant points credited upon review.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs sm:text-sm text-sky-200">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> 10,000 Points = $1.00 USDT
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Structured Proof Verification
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Instant Available Balance
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Available vs Submissions) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'available'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Available Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'submissions'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            My Submissions ({submissions.length})
          </button>
        </div>

        {activeTab === 'available' && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 placeholder-slate-400"
              />
            </div>
            <button
              onClick={onRefresh}
              className="p-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition"
              title="Refresh Tasks"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* AVAILABLE TASKS VIEW */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {/* Categories Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Tasks Grid */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No active tasks found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                There are no active campaigns matching your filter right now. New advertiser tasks appear throughout the day.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map(task => {
                const isCompleted = task.userSubmitted;
                const slotsRemaining = task.slotsRemaining ?? Math.max(0, task.totalSlots - task.completedSlots);
                const progressPct = Math.min(100, Math.round((task.completedSlots / task.totalSlots) * 100));

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 relative overflow-hidden ${
                      isCompleted
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-slate-200 hover:border-sky-300 hover:shadow-lg shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Badge Row */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {task.category}
                        </span>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          {task.targetDevice === 'mobile' && (
                            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                              <Smartphone className="w-3 h-3" /> Mobile
                            </span>
                          )}
                          {task.targetDevice === 'desktop' && (
                            <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                              <Monitor className="w-3 h-3" /> Desktop
                            </span>
                          )}
                          {task.targetDevice === 'all' && (
                            <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              <Globe className="w-3 h-3" /> All Devices
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-bold text-slate-900 text-base line-clamp-2 leading-snug">
                        {task.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                        {task.description}
                      </p>

                      {/* Slots Progress Bar */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-slate-500">Worker slots</span>
                          <span className="font-semibold text-slate-700">
                            {task.completedSlots} / {task.totalSlots} filled
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              progressPct >= 90 ? 'bg-amber-500' : 'bg-sky-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reward & Action Footer */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-base font-extrabold text-sky-600">
                          {task.rewardPoints.toLocaleString()} <span className="text-xs font-semibold text-slate-500">Pts</span>
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          ≈ ${(task.rewardCents / 100).toFixed(2)} USDT
                        </div>
                      </div>

                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {task.submissionStatus === 'approved' ? 'Approved' : 'Submitted'}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenTask(task)}
                          className="px-4 py-2 bg-slate-900 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          Start Task <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MY SUBMISSIONS VIEW */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Task Submissions Ledger</h2>
              <p className="text-xs text-slate-500 mt-0.5">Track approvals, review feedback, and credited rewards.</p>
            </div>
            <button
              onClick={onRefresh}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
            >
              Refresh Status
            </button>
          </div>

          {submissions.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No submissions yet</h3>
              <p className="text-xs text-slate-500 mt-1">Start a task from the Available Tasks tab to earn your first reward.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Reward</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reviewer Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {submissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {sub.taskTitle}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-sky-600">{sub.rewardPoints.toLocaleString()} Pts</span>
                        <span className="text-xs text-slate-400 block">${(sub.rewardCents / 100).toFixed(2)} USDT</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {sub.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {sub.status === 'pending_review' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> Under Review
                          </span>
                        )}
                        {sub.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                        {sub.rejectionReason ? (
                          <span className="text-rose-600 font-medium">{sub.rejectionReason}</span>
                        ) : sub.status === 'approved' ? (
                          <span className="text-emerald-600 font-medium">Reward confirmed & credited to wallet balance.</span>
                        ) : (
                          <span className="text-slate-400 italic">Awaiting advertiser verification.</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TASK DETAIL & PROOF SUBMISSION MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={handleCloseModal}
                className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {selectedTask.category}
                </span>
                <span className="text-xs text-slate-400">
                  Campaign ID: {selectedTask.id.slice(0, 12)}...
                </span>
              </div>
              <h2 className="text-xl font-bold pr-8">{selectedTask.title}</h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-lg font-extrabold text-sky-400">
                  {selectedTask.rewardPoints.toLocaleString()} Points
                </span>
                <span className="text-xs font-medium text-slate-300 bg-white/10 px-2 py-0.5 rounded">
                  ≈ ${(selectedTask.rewardCents / 100).toFixed(2)} USDT
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Task Instructions */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Task Instructions
                </h4>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-sm text-slate-700">
                  {selectedTask.instructions.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-sky-100 text-sky-700 font-bold text-xs rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Link Call to Action */}
              <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-sky-950">Ready to start?</div>
                  <div className="text-xs text-sky-800">Open the advertiser’s campaign page to perform the work.</div>
                </div>
                <a
                  href={selectedTask.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition shrink-0 shadow-sm"
                >
                  Open Campaign URL <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Proof Requirements */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Required Proof
                </h4>
                <p className="text-xs text-slate-600 mb-4">
                  {selectedTask.proofInstructions}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {['text', 'both'].includes(selectedTask.requiredProofType) && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Text / Username / Email Proof <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={proofText}
                        onChange={e => setProofText(e.target.value)}
                        placeholder="e.g. Registered username, profile link, or submission details..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                      />
                    </div>
                  )}

                  {['screenshot', 'both'].includes(selectedTask.requiredProofType) && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Screenshot Image URL <span className="text-rose-500">*</span></span>
                        <span className="text-slate-400 font-normal">Imgur, PostImage, or public image URL</span>
                      </label>
                      <div className="relative">
                        <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          required
                          value={proofScreenshotUrl}
                          onChange={e => setProofScreenshotUrl(e.target.value)}
                          placeholder="https://i.imgur.com/example.png"
                          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Reference / Transaction ID <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={proofReferenceId}
                      onChange={e => setProofReferenceId(e.target.value)}
                      placeholder="e.g. Order #, Transaction Hash, or Unique Ref"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                    />
                  </div>

                  {submitError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-semibold">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Proof submitted! Queued for review.</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || submitSuccess}
                      className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Task Proof'}
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
