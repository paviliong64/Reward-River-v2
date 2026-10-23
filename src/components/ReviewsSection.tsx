import React, { useState, useEffect } from 'react';
import { PlatformReview, User } from '../types';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  MessageSquarePlus,
  X,
  Send,
  Sparkles,
  DollarSign,
  Award,
  ThumbsUp
} from 'lucide-react';

interface ReviewsSectionProps {
  currentUser?: User | null;
  onOpenAuth?: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  currentUser,
  onOpenAuth
}) => {
  const [reviews, setReviews] = useState<PlatformReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userName, setUserName] = useState(currentUser?.displayName || '');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [payoutProofUsdt, setPayoutProofUsdt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/public/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.warn('Failed to load reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (currentUser?.displayName && !userName) {
      setUserName(currentUser.displayName);
    }
  }, [currentUser, userName]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!userName.trim()) {
      setSubmitError('Please provide your name or nickname.');
      return;
    }
    if (!comment.trim() || comment.trim().length < 10) {
      setSubmitError('Review comment must be at least 10 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('rr_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userName: userName.trim(),
          rating,
          title: title.trim() || 'Verified Experience',
          comment: comment.trim(),
          payoutProofUsdt: payoutProofUsdt ? parseFloat(payoutProofUsdt) : undefined,
          userCountry: currentUser?.countryCode || 'GLOBAL'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit review.');
      } else {
        setSubmitSuccess(
          data.review?.status === 'approved'
            ? '🎉 Your review has been verified and published immediately!'
            : '✅ Thank you! Your review has been submitted for moderation.'
        );
        setTitle('');
        setComment('');
        setPayoutProofUsdt('');
        // Refresh reviews
        fetchReviews();
        setTimeout(() => {
          setModalOpen(false);
          setSubmitSuccess(null);
        }, 2000);
      }
    } catch {
      setSubmitError('Network error while submitting review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'all') return true;
    return r.rating === filterRating;
  });

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const verifiedPayoutsCount = reviews.filter((r) => (r.payoutProofUsdt ?? 0) > 0).length;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-700/60 mb-8 sm:mb-12 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>COMMUNITY TRUST & VERIFIED REVIEWS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              What Real Users Say About Reward River
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Transparent feedback from members who earn, complete micro-tasks, and withdraw real USDT
              daily to TRC-20 and ERC-20 wallets.
            </p>
          </div>

          {/* Aggregate Rating Block & Action */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4 shrink-0">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
              <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono">
                {avgRating}
              </div>
              <div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="text-[11px] text-slate-300 font-medium mt-0.5">
                  Based on <strong>{reviews.length} verified reviews</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!currentUser && onOpenAuth) {
                  onOpenAuth();
                } else {
                  setModalOpen(true);
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/25 transition-all"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Share Your Review</span>
            </button>
          </div>
        </div>

        {/* Mini Trust Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-700/60 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">100% Genuine Reviews</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">{verifiedPayoutsCount} Verified Payout Proofs</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300">Fast USDT Settlement</span>
          </div>
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-slate-300">98% Satisfaction Rating</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 mb-6 overflow-x-auto pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Filter:
          </span>
          <button
            onClick={() => setFilterRating('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterRating === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          {[5, 4, 3].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRating(r)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterRating === r
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{r}</span>
              <Star className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (!currentUser && onOpenAuth) {
              onOpenAuth();
            } else {
              setModalOpen(true);
            }
          }}
          className="text-xs font-bold text-sky-600 hover:text-sky-700 underline flex items-center gap-1 shrink-0"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading member reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-600">
          <p className="font-semibold text-sm">No reviews found for this filter.</p>
          <button
            onClick={() => setFilterRating('all')}
            className="mt-2 text-xs text-sky-600 font-bold underline"
          >
            View all reviews
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: User & Rating */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
                      {rev.userName ? rev.userName[0] : 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {rev.userName}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        {rev.userCountry && (
                          <span className="font-semibold text-slate-500">{rev.userCountry}</span>
                        )}
                        <span>•</span>
                        <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 fill-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Title & Comment */}
                {rev.title && (
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-1.5">
                    {rev.title}
                  </h4>
                )}
                <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed mb-4">
                  "{rev.comment}"
                </p>
              </div>

              {/* Footer: Verified Payout Tag */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                {rev.payoutProofUsdt ? (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>${rev.payoutProofUsdt.toFixed(2)} USDT Payout Verified</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-slate-400 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-sky-500" />
                    <span>Verified Member</span>
                  </div>
                )}
                <span className="text-slate-400 font-mono text-[10px]">RewardRiver</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Submission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              aria-label="Close review modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>WRITE A REVIEW</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Share Your Reward River Experience
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Help fellow users discover authentic earning opportunities.
              </p>
            </div>

            {submitSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-medium text-sm">
                {submitSuccess}
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {submitError}
                  </div>
                )}

                {/* Star Rating Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 text-slate-300 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (hoverRating ?? rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-600 ml-2">
                      {rating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name or Nickname
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Alex M."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Review Headline (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Fast USDT TRC20 payout received in 20 minutes!"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Review Details
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you liked: task payouts, surveys, withdrawal speed..."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Payout Proof (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmed USDT Payout Amount (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={payoutProofUsdt}
                      onChange={(e) => setPayoutProofUsdt(e.target.value)}
                      placeholder="e.g. 25.00"
                      className="w-full pl-7 pr-16 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-semibold">
                      USDT
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Adding your withdrawal amount earns you a "Verified USDT Payout" badge.
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
