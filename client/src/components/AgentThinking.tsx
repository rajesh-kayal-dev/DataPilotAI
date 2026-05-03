import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';

/**
 * AgentThinking Component (Production V5 - Minimalist Trace)
 * Clean "Thought for Xs" state that expands into a real-time multi-agent trace.
 */
const AgentThinking: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const { documents } = useWorkspace();
  
  const hasDocuments = documents && documents.length > 0;

  const steps = [
    { 
      id: 'manager',
      label: 'Orchestrator Agent', 
      status: 'Analyzing strategy & intent...',
      icon: (color: string) => (
        <svg className={`w-3.5 h-3.5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    { 
      id: 'retrieval',
      label: 'Document Librarian', 
      status: hasDocuments ? 'Scanning your uploaded knowledge...' : 'Checking global knowledge base...',
      icon: (color: string) => (
        <svg className={`w-3.5 h-3.5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    { 
      id: 'writer',
      label: 'Response Synthesis', 
      status: 'Formulating professional answer...',
      icon: (color: string) => (
        <svg className={`w-3.5 h-3.5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);

    const timerInterval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(timerInterval);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2 max-w-2xl select-none">
      <style>{`
        @keyframes spin-sync { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .master-spinner { animation: spin-sync 1.5s linear infinite; }
        @keyframes progress-pulse { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
        @keyframes slide-down-simple { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Collapsed Thought Bar (The Badge) */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 text-white/60 hover:text-white transition-all cursor-pointer bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl outline-none w-fit group backdrop-blur-sm"
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-brand/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-t-brand rounded-full master-spinner" />
        </div>
        <span className="text-[12px] font-bold uppercase tracking-[0.15em] flex items-center gap-2">
          Thinking
          <span className="text-white/20 font-normal lowercase tracking-normal italic ml-1">({seconds}s)</span>
        </span>
        <div className={`flex items-center justify-center w-5 h-5 rounded-full bg-white/5 group-hover:bg-white/10 transition-all ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-3 h-3 text-white/40 group-hover:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Multi-Agent Trace Board */}
      {isExpanded && (
        <div 
          className="flex flex-col gap-5 p-6 bg-black/40 border border-white/10 rounded-[24px] shadow-2xl backdrop-blur-2xl mt-2 w-full md:w-[480px]"
          style={{ animation: 'slide-down-simple 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-brand">Orchestration Trace</span>
              <span className="text-[10px] text-white/30 font-medium italic">Multi-agent collaboration in progress...</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/40 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-green-500/40 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>

          <div className="space-y-6">
            {steps.map((s, i) => {
              const isActive = i === step;
              const isCompleted = i < step;
              return (
                <div key={s.id} className={`flex items-start gap-5 transition-all duration-700 ${isActive || isCompleted ? 'opacity-100' : 'opacity-15'}`}>
                  <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-700 ${isActive ? 'bg-brand shadow-[0_0_20px_rgba(var(--brand-rgb),0.4)]' : isCompleted ? 'bg-green-500/10' : 'bg-white/5'}`}>
                    {s.icon(isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-white/20')}
                    {isActive && (
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-brand border-2 border-black rounded-full flex items-center justify-center">
                         <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col flex-1 gap-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[12px] font-bold tracking-tight ${isActive ? 'text-white' : isCompleted ? 'text-white/70' : 'text-white/30'}`}>{s.label}</span>
                      {isCompleted && (
                        <span className="text-[9px] font-bold text-green-400/60 uppercase">Complete</span>
                      )}
                    </div>
                    <span className={`text-[10px] leading-relaxed ${isActive ? 'text-white/60' : 'text-white/20'}`}>{s.status}</span>
                    
                    {isActive && (
                      <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-brand animate-[progress-pulse_1.5s_ease-in-out_infinite]" style={{ width: '40%' }} />
                      </div>
                    )}
                  </div>

                  {isCompleted && (
                    <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20">
                      <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentThinking;
