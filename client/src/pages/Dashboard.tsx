import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [docCount, setDocCount] = useState(0);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showModelsModal, setShowModelsModal] = useState(false);

  const fetchData = async () => {
    try {
      const [userRes, docsRes] = await Promise.all([
        axiosInstance.get('/auth/dashboard'),
        axiosInstance.get('/documents')
      ]);

      setUser(userRes.data.user);
      const safeDocs = Array.isArray(docsRes.data) ? docsRes.data : [];
      setDocuments(safeDocs);
      setDocCount(safeDocs.length);
    } catch (err) {
      console.error('Dashboard: Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteDoc = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axiosInstance.delete(`/documents/${id}`);
        toast.success('Document deleted');
        fetchData(); // Refresh counts and list
      } catch (err) {
        console.error('Failed to delete document', err);
        toast.error('Failed to delete document');
      }
    }
  };

  if (loading) return (
    <MainLayout>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    </MainLayout>
  );

  const isPremium = user?.plan === 'pro';
  const docLimit = isPremium ? 50 : 5;
  const usagePercentage = Math.min((docCount / docLimit) * 100, 100);

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">

          {/* Welcome Header */}
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">
                Welcome back, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-white/50">
                {isPremium ? "You are enjoying Premium features." : "Here is what is happening with your documents."}
              </p>
            </div>
            {isPremium && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-brand/10 border border-brand/20">
                <svg className="w-4 h-4 text-brand" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span className="text-[10px] font-black text-brand uppercase tracking-widest">Premium</span>
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            {/* Document Count Card */}
            <div
              onClick={() => setShowDocsModal(true)}
              className={`glass-card rounded-2xl p-6 transition-all duration-500 cursor-pointer group hover:bg-white/5 ${isPremium ? 'border-brand/30 shadow-[0_0_20px_-10px_rgba(var(--brand-rgb),0.5)]' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPremium ? 'bg-brand/20' : 'bg-brand/10'}`}>
                  <svg className={`w-5 h-5 ${isPremium ? 'text-brand' : 'text-brand/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                {isPremium && (
                  <span className="text-[10px] text-white/30 font-bold uppercase">{docCount}/{docLimit} PDFs</span>
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-1">{docCount}</div>
              <div className="text-xs text-white/50">Total Documents</div>

              {isPremium && (
                <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand rounded-full transition-all duration-1000" style={{ width: `${usagePercentage}%` }}></div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-brand font-bold uppercase tracking-wider">View All Documents →</span>
              </div>
            </div>

            {/* Premium Models Card */}
            {isPremium ? (
              <div
                onClick={() => setShowModelsModal(true)}
                className="glass-card rounded-2xl p-6 border-brand/20 cursor-pointer group hover:bg-white/5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.243a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707zM16.243 16.243a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 011.414-1.414l.707.707z" /></svg>
                  </div>
                </div>
                <div className="text-lg font-bold text-white mb-1">Elite Models</div>
                <div className="text-[10px] text-white/50 uppercase tracking-wider">GPT-4o & Claude 3.5 Active</div>
                <div className="mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">View Model Details →</span>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-6 opacity-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">Coming Soon</div>
                <div className="text-xs text-white/50">Intelligence Stats</div>
              </div>
            )}

            {/* Time Saved Card */}
            <div className={`glass-card rounded-2xl p-6 ${isPremium ? '' : 'opacity-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{isPremium ? "Unlimited" : "Limited"}</div>
              <div className="text-xs text-white/50">{isPremium ? "Priority Processing" : "Standard Speed"}</div>
            </div>
          </div>

          {/* Premium Call-to-action for Free Users */}
          {!isPremium ? (
            <div className="mb-6 py-12 px-6 glass-card rounded-2xl border-dashed border-white/10 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h2 className="text-xl font-medium text-white mb-3">Upgrade to Premium</h2>
              <p className="text-white/50 mb-8 max-w-lg mx-auto">Get 50 PDF uploads, unlimited workspaces, and access to GPT-4o for deeper document intelligence.</p>
              <Link to="/upgrade" className="px-8 py-3.5 rounded-xl bg-brand text-white font-bold hover:bg-brand/90 transition-all shadow-lg shadow-brand/20">
                Explore Plans
              </Link>
            </div>
          ) : (
            <div className="mb-6 p-8 glass-card rounded-3xl border-brand/20 bg-brand/[0.02]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Premium Member Benefits</h2>
                  <div className="flex flex-wrap gap-3 mt-4">
                    {['Unlimited Workspaces', 'GPT-4o Access', 'Claude 3.5 Sonnet', 'Priority Queue'].map((tag, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-white/60 font-medium border border-white/5">{tag}</span>
                    ))}
                  </div>
                </div>
                <Link to="/chat" className="px-6 py-3 rounded-xl bg-brand text-white font-bold hover:bg-brand/90 hover:scale-[1.02] transition-all text-sm shadow-lg shadow-brand/20">
                  Open New Chat
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showDocsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDocsModal(false)}></div>
          <div className="relative w-full max-w-2xl glass-card rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-white">Your Documents</h2>
              <button onClick={() => setShowDocsModal(false)} className="p-2 text-white/50 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {documents.length === 0 ? (
                <div className="text-center py-20 text-white/30 italic">No documents uploaded yet.</div>
              ) : documents.map((doc) => (
                <div key={doc._id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-white truncate">{doc.name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          const res = await axiosInstance.get(`/documents/${doc._id}/download`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([res.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', doc.name);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        } catch (err) {
                          toast.error('Failed to download document');
                        }
                      }}
                      className="p-2 text-white/30 hover:text-brand transition-colors rounded-lg hover:bg-white/5"
                      title="Download"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(doc._id)}
                      className="p-2 text-white/30 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/5 bg-white/[0.02] shrink-0">
              <Link to="/workspaces" onClick={() => setShowDocsModal(false)} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-brand text-white font-bold hover:bg-brand/90 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Upload New Document
              </Link>
            </div>
          </div>
        </div>
      )}

      {showModelsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModelsModal(false)}></div>
          <div className="relative w-full max-w-3xl glass-card rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Elite AI Models</h2>
                <p className="text-sm text-white/40">Exclusive access for Premium members.</p>
              </div>
              <button onClick={() => setShowModelsModal(false)} className="p-2 text-white/50 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GPT-4o */}
              <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5153-4.9066 6.0462 6.0462 0 0 0-4.4439-2.9147 6.0502 6.0502 0 0 0-5.0637 1.4774 6.058 6.058 0 0 0-4.4463 2.917 6.0547 6.0547 0 0 0 1.474 5.062 6.0506 6.0506 0 0 0-.5157 4.9108 6.0546 6.0546 0 0 0 4.4466 2.9147 6.0585 6.0585 0 0 0 5.061-1.4774 6.0581 6.0581 0 0 0 4.4463-2.917 6.0547 6.0547 0 0 0-1.474-5.062 6.0506 6.0506 0 0 0 .5157-4.9108zm-9.277 12.037a4.4273 4.4273 0 0 1-2.4993-.7714l.0103-.0058 3.3531-1.936a.7981.7981 0 0 0 .3992-.6914V13.567l1.7171.9913a.0152.0152 0 0 1 .0077.0127v3.928a4.4172 4.4172 0 0 1-2.99 4.374zm-9.2811-4.8703a4.417 4.417 0 0 1-.3908-2.617l.0103.0058 3.3531 1.936a.7981.7981 0 0 0 .7984 0l4.8757-2.815v1.9826a.0152.0152 0 0 1-.0053.0133l-3.4024 1.9642a4.4172 4.4172 0 0 1-5.239-.4699zm-.3909-10.472a4.4142 4.4142 0 0 1 2.1085-1.8456l-.0103.0058 3.3531 1.936a.7981.7981 0 0 0 .3992.6914v5.63l-1.7171-.9913a.0152.0152 0 0 1-.0077-.0127V6.3912a4.4172 4.4172 0 0 1 2.99-4.374zm15.42 1.8456a4.4142 4.4142 0 0 1 .3908 2.617l-.0103-.0058-3.3531-1.936a.7981.7981 0 0 0-.7984 0l-4.8757 2.815V4.3026a.0152.0152 0 0 1 .0053-.0133l3.4024-1.9642a4.4172 4.4172 0 0 1 5.239.4699zm.3909 10.472a4.4142 4.4142 0 0 1-2.1085 1.8456l.0103-.0058-3.3531-1.936a.7981.7981 0 0 0-.3992-.6914V8.4111l1.7171.9913a.0152.0152 0 0 1 .0077.0127v3.928a4.4172 4.4172 0 0 1-2.99 4.374zM4.7712 8.4958a4.4273 4.4273 0 0 1 2.4993.7714l-.0103.0058-3.3531 1.936a.7981.7981 0 0 0-.3992.6914V17.53l-1.7171-.9913a.0152.0152 0 0 1-.0077-.0127V12.602a4.4172 4.4172 0 0 1 2.99-4.374z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">GPT-4o</h3>
                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Multi-Modal Elite</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {['Advanced Logical Reasoning', 'Complex Data Analysis', 'Image & Table Recognition', 'Native Visual Sync'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Claude 3.5 */}
              <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 transition-all group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.016 4.316l1.24 1.226 5.86 5.845a2.53 2.53 0 010 3.578l-5.86 5.845-1.24 1.226a2.518 2.518 0 01-3.56 0l-1.24-1.226L1.356 14.965a2.53 2.53 0 010-3.578l5.86-5.845 1.24-1.226a2.518 2.518 0 013.56 0zM12 1.3a5.539 5.539 0 00-3.916 1.616l-1.24 1.226L1 9.987a5.53 5.53 0 000 7.826l5.86 5.845 1.24 1.226A5.538 5.538 0 0012.016 26.5a5.539 5.539 0 003.916-1.616l1.24-1.226 5.86-5.845a5.53 5.53 0 000-7.826l-5.86-5.845-1.24-1.226A5.538 5.538 0 0012 1.3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Claude 3.5 Sonnet</h3>
                    <p className="text-xs text-purple-400 font-bold uppercase tracking-widest">Coding & Writing Elite</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {['Unmatched Coding Precision', 'Nuanced Literary Writing', 'Ultra-Large Context Window', 'Human-Like Interpretation'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                      <svg className="w-3.5 h-3.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-8 bg-white/[0.02] border-t border-white/5 text-center">
              <button onClick={() => setShowModelsModal(false)} className="px-8 py-3 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all border border-white/10">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Dashboard;
