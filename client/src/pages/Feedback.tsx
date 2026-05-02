import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

interface FeedbackItem {
  _id: string;
  user: string;
  userName: string;
  rating: number;
  type: string;
  comment: string;
  createdAt: string;
}

const FeedbackPage: React.FC = () => {
  const [rating, setRating] = useState(5);
  const [type, setType] = useState('recommendation');
  const [comment, setComment] = useState('');
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Get current user ID from token
  const token = localStorage.getItem('token');
  const currentUser = token ? (jwtDecode(token) as any) : null;
  const currentUserId = currentUser?.id;

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/feedback');
      const data = Array.isArray(res.data) ? res.data : (res.data?.feedbacks || []);
      setFeedbacks(data);
    } catch (err) {
      console.error('Failed to fetch feedback', err);
      setFeedbacks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingId) {
        await axiosInstance.patch(`/feedback/${editingId}`, { rating, type, comment });
        toast.success('Feedback updated successfully!');
      } else {
        await axiosInstance.post('/feedback', { rating, type, comment });
        toast.success('Thank you for your feedback!');
      }
      setComment('');
      setRating(5);
      setEditingId(null);
      setTimeout(fetchFeedbacks, 500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await axiosInstance.delete(`/feedback/${id}`);
      toast.success('Feedback deleted');
      fetchFeedbacks();
    } catch (err: any) {
      toast.error('Failed to delete feedback');
    }
  };

  const startEdit = (f: FeedbackItem) => {
    setEditingId(f._id);
    setRating(f.rating);
    setType(f.type);
    setComment(f.comment);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-[#08060E] py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-white mb-2">User Feedback</h1>
            <p className="text-white/40">Help us improve DataPilot AI by sharing your experience.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form Section */}
            <div className="space-y-8">
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 sticky top-8">
                <h3 className="text-xl font-semibold text-white mb-6">
                  {editingId ? 'Edit Your Feedback' : 'Submit Feedback'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-3">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            rating >= star ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white/5 text-white/30 hover:bg-white/10'
                          }`}
                        >
                          <svg className="w-5 h-5" fill={rating >= star ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Type */}
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-3">Feedback Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['recommendation', 'issue'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                            type === t ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-white/30 hover:border-white/10'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-3">Your Message</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us what's on your mind..."
                      rows={5}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 outline-none focus:border-brand/50 transition-colors resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => { setEditingId(null); setComment(''); setRating(5); }}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      disabled={isSubmitting}
                      className="flex-[2] py-4 bg-brand hover:bg-brand/90 text-white rounded-2xl font-bold shadow-lg shadow-brand/20 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Processing...' : editingId ? 'Update Feedback' : 'Submit Feedback'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* List Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-white">Recent Reviews</h3>
                <span className="text-[10px] text-white/20 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                  {feedbacks.length} Total
                </span>
              </div>
              
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 border border-white/5 rounded-3xl bg-white/[0.01]">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-white/30 text-sm">Loading reviews...</p>
                  </div>
                ) : feedbacks.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/5 rounded-3xl text-white/20">
                    No feedback yet. Be the first to share!
                  </div>
                ) : (
                  feedbacks.map((f) => {
                    const isOwn = currentUserId === f.user;
                    return (
                      <div key={f._id} className={`bg-white/[0.02] border rounded-3xl p-6 transition-all ${isOwn ? 'border-brand/30 shadow-[0_0_20px_-10px_rgba(var(--brand-rgb),0.2)]' : 'border-white/5'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-xs uppercase">
                              {String(f.userName || 'A').charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white">{f.userName || 'Anonymous'}</p>
                                {isOwn && <span className="text-[9px] bg-brand/10 text-brand px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">You</span>}
                              </div>
                              <p className="text-[10px] text-white/30 uppercase tracking-tighter">
                                {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Just now'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg 
                                key={star} 
                                className={`w-3 h-3 ${f.rating >= star ? 'text-yellow-400' : 'text-white/10'}`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <div className="mb-3">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            f.type === 'issue' ? 'border-red-400/30 text-red-400 bg-red-400/5' : 'border-green-400/30 text-green-400 bg-green-400/5'
                          }`}>
                            {f.type}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed italic mb-4">
                          "{f.comment}"
                        </p>
                        
                        {isOwn && (
                          <div className="flex gap-4 border-t border-white/5 pt-4 mt-4">
                            <button 
                              onClick={() => startEdit(f)}
                              className="text-[11px] font-bold text-white/40 hover:text-white flex items-center gap-1.5 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              Edit Review
                            </button>
                            <button 
                              onClick={() => handleDelete(f._id)}
                              className="text-[11px] font-bold text-red-400/50 hover:text-red-400 flex items-center gap-1.5 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FeedbackPage;
