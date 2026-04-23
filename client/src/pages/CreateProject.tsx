import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateProject: React.FC = () => {
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    navigate('/chat');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/chat');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10 relative overflow-hidden">
      <div className="bg-scene"></div>
      <div className="grid-lines"></div>
      <div className="orb orb-a"></div>
      <div className="orb orb-b"></div>

      <div className="w-full max-w-2xl card-enter relative z-10">
        <div className="glass-card rounded-3xl overflow-hidden" style={{ minHeight: '500px' }}>
          <div className="p-8 lg:p-10">
            <div className="mb-8">
              <h1 className="font-display font-bold text-2xl text-white mb-1.5">Create New Project</h1>
              <p className="text-[#7A6B8A] text-sm font-body">Set up your project and upload documents</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs text-white/60 mb-2 font-body uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="w-full bg-transparent border-b border-[#352B44] py-3 text-base text-white outline-none focus:border-[#7C4FD4] transition-colors placeholder-[#352B44]"
                />
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-2 font-body uppercase tracking-wider">Project Description</label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Describe what this project is about..."
                  rows={4}
                  className="w-full bg-transparent border-b border-[#352B44] py-3 text-base text-white outline-none focus:border-[#7C4FD4] transition-colors placeholder-[#352B44] resize-none"
                />
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-brand bg-brand/10' : 'border-[#352B44] hover:border-[rgba(124,79,212,0.5)]'
                }`}
              >
                <svg className="w-10 h-10 mx-auto mb-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="text-sm text-white/60 mb-1">Drag & drop files here</p>
                <p className="text-xs text-white/30">or click to browse</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 px-4 py-3 rounded-xl border border-[rgba(124,79,212,0.18)] text-[#6B5F80] text-sm hover:border-[rgba(124,79,212,0.38)] hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#6B3FA0] to-[#4F72E0] text-white font-display font-semibold text-sm shadow-[0_0_26px_rgba(107,63,160,0.35)] hover:shadow-[0_0_40px_rgba(107,63,160,0.5)] hover:-translate-y-px transition-all"
                >
                  Create & Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
