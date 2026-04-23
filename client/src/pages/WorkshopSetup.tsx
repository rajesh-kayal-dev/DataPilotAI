import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';

const WorkshopSetup: React.FC = () => {
  const [step, setStep] = useState(1);
  const [workshopName, setWorkshopName] = useState('');
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      if (step === 3) {
        simulateProcessing();
      } else {
        setStep(step + 1);
      }
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const simulateProcessing = () => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 2;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep(5), 500);
      }
    }, 50);
  };

  const applyChip = (name: string) => {
    setWorkshopName(name);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-panel visible">
            <div className="card-body p-8 md:p-10">
              <div className="step-meta mb-7">
                <div className="step-pill">Step 1 of 5</div>
              </div>
              <h2 className="font-display font-bold text-2xl text-white mb-2">Name your workshop</h2>
              <p className="text-[#6B5F80] text-sm mb-8">Pick something that represents this collection of documents.</p>

              <input
                type="text"
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
                placeholder="My Workshop"
                maxLength={48}
                className="w-full bg-transparent border-b border-[#352B44] py-3 text-2xl font-display font-semibold text-white outline-none focus:border-[#7C4FD4] transition-colors placeholder-[#352B44]"
              />

              <div className="mt-8">
                <div className="text-xs text-[#352B44] uppercase tracking-wider mb-3">Quick start with</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Finance Analysis', icon: '' },
                    { name: 'Legal Docs', icon: '' },
                    { name: 'Research Papers', icon: '' },
                    { name: 'Product Docs', icon: '' },
                    { name: 'HR & People', icon: '' },
                  ].map((chip) => (
                    <button
                      key={chip.name}
                      onClick={() => applyChip(chip.name)}
                      className="px-4 py-2 rounded-full bg-white/5 border border-[rgba(124,79,212,0.13)] text-[#6B5F80] text-sm hover:border-[rgba(124,79,212,0.45)] hover:text-white hover:bg-[rgba(124,79,212,0.1)] transition-all"
                    >
                      {chip.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-panel visible">
            <div className="card-body p-8 md:p-10">
              <div className="step-meta mb-7">
                <div className="step-pill">Step 2 of 5</div>
              </div>
              <h2 className="font-display font-bold text-2xl text-white mb-2">Add your documents</h2>
              <p className="text-[#6B5F80] text-sm mb-6">Drop any PDFs, Word docs, or text files. You can always add more later.</p>

              <div className="drop-zone border border-dashed border-[#352B44] rounded-2xl p-10 text-center cursor-pointer hover:border-[rgba(124,79,212,0.55)] hover:bg-[rgba(124,79,212,0.05)] transition-all bg-black/15">
                <div className="w-13 h-13 rounded-xl mx-auto mb-3 bg-[rgba(124,79,212,0.1)] border border-[rgba(124,79,212,0.2)] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#9B6FCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                </div>
                <div className="text-[#6B5F80] text-sm mb-1 font-medium">Drop files here</div>
                <div className="text-[#352B44] text-xs">PDF, DOCX, TXT - up to 50MB</div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-panel visible">
            <div className="card-body p-8 md:p-10">
              <div className="step-meta mb-7">
                <div className="step-pill">Step 3 of 5</div>
              </div>
              <h2 className="font-display font-bold text-2xl text-white mb-2">How should we read it?</h2>
              <p className="text-[#6B5F80] text-sm mb-6">Choose how deeply the AI analyses your documents.</p>

              <div className="space-y-3">
                {[
                  { mode: 'fast', icon: '', name: 'Fast', desc: 'Quick overview - great for most documents. Ready in seconds.', tag: 'Recommended' },
                  { mode: 'balanced', icon: '', name: 'Balanced', desc: 'Solid accuracy with reasonable speed. Works for all use cases.', tag: 'Default', selected: true },
                  { mode: 'deep', icon: '', name: 'Deep Analysis', desc: 'Maximum precision - best for complex legal or technical content.', tag: null },
                ].map((m) => (
                  <div
                    key={m.mode}
                    className={`flex items-center gap-4 p-4 rounded-xl bg-white/5 border cursor-pointer transition-all ${
                      m.selected ? 'border-[rgba(124,79,212,0.6)] bg-[rgba(124,79,212,0.1)] shadow-[0_0_0_1px_rgba(124,79,212,0.15),0_8px_24px_rgba(124,79,212,0.12)]' : 'border-[rgba(124,79,212,0.13)] hover:border-[rgba(124,79,212,0.4)]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${m.selected ? 'bg-[rgba(124,79,212,0.2)] border border-[rgba(124,79,212,0.4)]' : 'bg-white/5 border border-[rgba(124,79,212,0.13)]'}`}>
                      {m.mode === 'fast' ? '' : m.mode === 'balanced' ? '' : ''}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-bold text-white">{m.name}</span>
                        {m.tag && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-body uppercase tracking-wider ${
                            m.tag === 'Recommended' ? 'bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.25)] text-[#FBBF24]' : 'bg-[rgba(124,79,212,0.15)] border border-[rgba(124,79,212,0.3)] text-[#C084FC]'
                          }`}>{m.tag}</span>
                        )}
                      </div>
                      <div className="text-xs text-[#6B5F80]">{m.desc}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${m.selected ? 'border-[#7C4FD4] bg-[#7C4FD4] shadow-[0_0_10px_rgba(124,79,212,0.5)]' : 'border-[#352B44]'}`}>
                      {m.selected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-panel visible">
            <div className="card-body p-8 md:p-10">
              <div className="step-meta mb-7">
                <div className="step-pill">Step 4 of 5</div>
              </div>
              <h2 className="font-display font-bold text-2xl text-white mb-2">Building your workshop...</h2>
              <p className="text-[#6B5F80] text-sm mb-8">Sit tight - your documents are being indexed.</p>

              <div className="space-y-4">
                {['Uploading files', 'Chunking text', 'Generating embeddings', 'Indexing vectors'].map((label, i) => {
                  const isDone = progress > (i + 1) * 25;
                  const isRunning = progress > i * 25 && !isDone;
                  return (
                    <div key={label} className="flex items-center gap-3 py-3 border-b border-[rgba(53,43,68,0.4)] last:border-0">
                      <div className={`w-2.5 h-2.5 rounded-full transition-all ${isDone ? 'bg-[#34D399] shadow-[0_0_10px_rgba(52,211,153,0.4)]' : isRunning ? 'bg-[#7C4FD4] shadow-[0_0_0_4px_rgba(124,79,212,0.18),0_0_12px_rgba(124,79,212,0.5)] animate-pulse' : 'bg-[#352B44]'}`}></div>
                      <span className={`flex-1 text-sm ${isDone || isRunning ? 'text-white' : 'text-[#352B44]'}`}>{label}</span>
                      {(isDone || isRunning) && (
                        <span className={`text-xs ${isDone ? 'text-[#34D399]' : 'text-[#7C4FD4]'}`}>
                          {isDone ? '100%' : `${Math.min(Math.round((progress - i * 25) * 4), 100)}%`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6">
                <div className="h-0.75 bg-[rgba(124,79,212,0.12)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C4FD4] via-[#4F8EF7] to-[#C084FC] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs text-[#C084FC] font-display font-bold mt-2">{progress}%</div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-panel visible">
            <div className="card-body p-10 text-center relative overflow-hidden">
              <div className="success-orb w-20 h-20 rounded-full mx-auto mb-7 bg-gradient-to-br from-[rgba(124,79,212,0.35)] to-[rgba(79,142,247,0.25)] border border-[rgba(124,79,212,0.45)] flex items-center justify-center shadow-[0_0_0_14px_rgba(124,79,212,0.06),0_0_50px_rgba(124,79,212,0.2)]">
                <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
                  <path d="M14 26l9 9 16-18" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.25)] rounded-full px-3.5 py-1 mb-4">
                <span className="text-[11px] text-[#34D399] font-semibold tracking-wider uppercase">Workshop Ready</span>
              </div>

              <h2 className="font-display font-extrabold text-3xl text-white mb-3 tracking-tight">Your workspace is live</h2>
              <p className="text-[#6B5F80] max-w-md mx-auto text-sm leading-relaxed mb-6">
                Start asking questions from your documents - your AI is ready to answer.
              </p>

              <div className="flex justify-center gap-3 mb-8">
                <div className="px-4 py-2 rounded-full bg-white/5 border border-[rgba(124,79,212,0.13)] text-sm text-[#6B5F80]">
                  <span className="text-white font-semibold">{workshopName || 'Workshop'}</span> created
                </div>
                <div className="px-4 py-2 rounded-full bg-white/5 border border-[rgba(124,79,212,0.13)] text-sm text-[#6B5F80]">
                  Documents <span className="text-white font-semibold">indexed</span>
                </div>
                <div className="px-4 py-2 rounded-full bg-white/5 border border-[rgba(124,79,212,0.13)] text-sm text-[#6B5F80]">
                  AI <span className="text-white font-semibold">ready</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => navigate('/chat')}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#6B3FA0] to-[#4F72E0] text-white font-display font-bold shadow-[0_0_32px_rgba(107,63,160,0.4)] hover:shadow-[0_0_50px_rgba(107,63,160,0.55)] hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                  Go to Chat
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 rounded-xl bg-transparent border border-[rgba(124,79,212,0.13)] text-[#6B5F80] hover:text-white hover:border-[rgba(124,79,212,0.28)] transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 px-8 py-5 border-b border-[rgba(124,79,212,0.09)] bg-[#08060E]/60 backdrop-blur-lg flex items-center justify-between">
        <Link to="/" className="w-fit">
          <Logo size="lg" />
        </Link>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-xs text-[#352B44] hover:text-[#6B5F80] transition-colors underline underline-offset-2">
            Exit setup
          </button>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6B3FA0] to-[#4F8EF7] flex items-center justify-center font-display font-bold text-xs text-white">R</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-5 pt-12 pb-20">
        <div className="text-center mb-12">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white tracking-tight mb-2">
            Setup Your <span className="text-gradient">Workshop</span>
          </h1>
          <p className="text-[#6B5F80] text-sm">A guided space for your AI-powered document intelligence</p>
        </div>

        <div className="w-full max-w-lg mb-11">
          <div className="relative flex items-start justify-between">
            <div className="absolute top-1.5 left-0 right-0 h-px bg-[rgba(124,79,212,0.13)]"></div>
            <div
              className="absolute top-1.5 left-0 h-px bg-gradient-to-r from-[#7C4FD4] to-[#4F8EF7] shadow-[0_0_8px_rgba(124,79,212,0.6)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="relative z-10 flex flex-col items-center flex-1">
                <div className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                  s < step ? 'border-[#7C4FD4] bg-gradient-to-br from-[#7C4FD4] to-[#4F8EF7] shadow-[0_0_10px_rgba(124,79,212,0.4)]' :
                  s === step ? 'border-[#7C4FD4] bg-[#7C4FD4] shadow-[0_0_0_4px_rgba(124,79,212,0.18),0_0_14px_rgba(124,79,212,0.5)] scale-125' :
                  'border-[#352B44] bg-[#08060E]'
                }`}>
                  {s < step && <div className="w-1 h-1 rounded-full bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>}
                  {s === step && <div className="w-1 h-1 rounded-full bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>}
                </div>
                <span className={`text-[11px] mt-2.5 transition-colors ${
                  s === step ? 'text-[#C084FC] font-semibold' : s < step ? 'text-[#6B5F80]' : 'text-[#352B44]'
                }`}>
                  {s === 1 ? 'Info' : s === 2 ? 'Upload' : s === 3 ? 'Mode' : s === 4 ? 'Processing' : 'Ready'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-xl glass-card rounded-3xl overflow-hidden relative">
          <div className="h-0.5 bg-gradient-to-r from-[#7C4FD4] via-[#4F8EF7] to-[#C084FC]"></div>
          {renderStepContent()}

          {step < 5 && step !== 4 && (
            <div className="flex items-center justify-between px-8 py-5 border-t border-[rgba(53,43,68,0.4)]">
              {step > 1 ? (
                <button onClick={handlePrev} className="px-4 py-3 rounded-xl border border-[rgba(124,79,212,0.18)] text-[#6B5F80] text-sm hover:border-[rgba(124,79,212,0.38)] hover:text-white transition-all inline-flex items-center gap-1.5">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                  Back
                </button>
              ) : (
                <button onClick={() => navigate('/dashboard')} className="text-xs text-[#352B44] hover:text-[#6B5F80] transition-colors underline underline-offset-2">
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6B3FA0] to-[#4F72E0] text-white font-display font-semibold text-sm shadow-[0_0_26px_rgba(107,63,160,0.35),0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[0_0_40px_rgba(107,63,160,0.5),0_8px_20px_rgba(0,0,0,0.35)] hover:-translate-y-px transition-all inline-flex items-center gap-2"
              >
                {step === 3 ? 'Start Processing' : 'Continue'}
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkshopSetup;
