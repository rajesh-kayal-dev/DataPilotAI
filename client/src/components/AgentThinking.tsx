import React, { useState, useEffect } from 'react';

/**
 * AgentThinking Component (Production V6 - Hyper-Minimal)
 * Clean, compact trace of agent collaboration.
 */
const AgentThinking: React.FC = () => {
  const [step, setStep] = useState(0);

  const steps = [
    { id: 'manager', label: 'Orchestrator', status: 'Analyzing strategy' },
    { id: 'retrieval', label: 'Knowledge', status: 'Retrieving context' },
    { id: 'writer', label: 'Synthesis', status: 'Formulating response' }
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(stepInterval);
  }, []);

  return (
    <div className="flex flex-col gap-2 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl w-full md:w-[320px] select-none">
      <div className="flex items-center justify-between border-b border-white/[0.03] pb-2 mb-1">
        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-brand/80">Trace Details</span>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-brand animate-pulse" />
          <div className="w-1 h-1 rounded-full bg-brand/50 animate-pulse" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>

      <div className="space-y-2.5">
        {steps.map((s, i) => {
          const isActive = i === step;
          const isCompleted = i < step;
          return (
            <div key={s.id} className={`flex items-center gap-3 transition-all duration-500 ${isActive || isCompleted ? 'opacity-100' : 'opacity-20'}`}>
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'bg-brand scale-125' : isCompleted ? 'bg-green-500/50' : 'bg-white/10'}`} />
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
                  {isCompleted && (
                    <svg className="w-2.5 h-2.5 text-green-500/60" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  )}
                </div>
                <span className={`text-[9px] ${isActive ? 'text-white/50' : 'text-white/20'}`}>{s.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentThinking;
