import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import axiosInstance from '../utils/axiosInstance';
import type { Document } from '../types';

const Dashboard: React.FC = () => {
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await axiosInstance.get('/documents');
        const safeDocs = Array.isArray(res.data) ? res.data : [];
        setDocCount(safeDocs.length);
      } catch (err) {
        console.error('Failed to fetch document count:', err);
      }
    };
    fetchDocs();
  }, []);

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-medium text-white mb-2">Welcome back</h1>
            <p className="text-white/50">Here is what is happening with your documents</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{docCount}</div>
              <div className="text-xs text-white/50">Total Documents</div>
            </div>

            <div className="glass-card rounded-2xl p-6 opacity-50">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">Coming Soon</div>
              <div className="text-xs text-white/50">Questions Asked</div>
            </div>

            <div className="glass-card rounded-2xl p-6 opacity-50">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">0h</div>
              <div className="text-xs text-white/50">Time Saved</div>
            </div>
          </div>

          <div className="mb-6 text-center py-10 glass-card rounded-2xl border-dashed border-white/10">
            <h2 className="text-lg font-medium text-white mb-2">Get Started</h2>
            <p className="text-white/50 mb-6">Upload a document to start chatting with your AI assistant.</p>
            <Link to="/workspaces" className="px-6 py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand/90 transition-all">
              Upload Your First Document
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
