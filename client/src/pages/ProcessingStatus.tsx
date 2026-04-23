import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const steps = [
  { id: 1, title: 'Upload Complete' },
  { id: 2, title: 'Text Extraction' },
  { id: 3, title: 'Chunking' },
  { id: 4, title: 'Embedding' },
  { id: 5, title: 'Indexing' },
  { id: 6, title: 'Ready' },
];

const ProcessingStatus: React.FC = () => {
  const navigate = useNavigate();
  const { docId } = useParams<{ docId: string }>();
  
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [chunksCreated, setChunksCreated] = useState<number>(0);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const docSize = '2.4 MB'; // Simulated size
  
  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTaken((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate process progression
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (currentStep === 1) {
      // Upload Complete -> Text Extraction
      timeout = setTimeout(() => setCurrentStep(2), 1500);
    } else if (currentStep === 2) {
      // Text Extraction -> Chunking
      timeout = setTimeout(() => setCurrentStep(3), 2500);
    } else if (currentStep === 3) {
      // Chunking -> Embedding
      // Simulate chunk counting
      let chunks = 0;
      const chunkInterval = setInterval(() => {
        chunks += 12;
        setChunksCreated(chunks);
        if (chunks > 140) {
          clearInterval(chunkInterval);
          setCurrentStep(4);
        }
      }, 150);
      return () => clearInterval(chunkInterval);
    } else if (currentStep === 4) {
      // Embedding -> Indexing
      timeout = setTimeout(() => setCurrentStep(5), 3000);
    } else if (currentStep === 5) {
      // Indexing -> Ready
      timeout = setTimeout(() => setCurrentStep(6), 2000);
    } else if (currentStep === 6) {
      // Ready -> Redirect
      timeout = setTimeout(() => {
        navigate(`/document/${docId || 'new-doc'}`);
      }, 1500);
    }

    return () => clearTimeout(timeout);
  }, [currentStep, navigate, docId]);

  return (
    <MainLayout>
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-3xl glass-card rounded-3xl p-8 md:p-12 relative z-10 border border-white/10 shadow-2xl">
          
          <div className="text-center mb-12">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
              Processing Document
            </h1>
            <p className="text-[#9C8EAF] text-sm">
              Our AI is analyzing and indexing your document for chat.
            </p>
          </div>

          {/* Document Stats Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand/30 to-blue-500/30 flex items-center justify-center border border-white/10">
                <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white mb-1">Contract_Agreement_2026.pdf</div>
                <div className="text-xs text-[#7A6B8A]">Size: {docSize}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-8 px-4">
              <div className="text-center">
                <div className="text-xs text-[#7A6B8A] mb-1 uppercase tracking-wider">Chunks</div>
                <div className="text-lg font-display font-bold text-brand">{chunksCreated}</div>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-center">
                <div className="text-xs text-[#7A6B8A] mb-1 uppercase tracking-wider">Time</div>
                <div className="text-lg font-display font-bold text-blue-400">00:{timeTaken.toString().padStart(2, '0')}</div>
              </div>
            </div>
          </div>

          {/* Horizontal Stepper */}
          <div className="relative mt-8 mb-4 px-4 md:px-8">
            <div className="absolute top-5 left-8 right-8 h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand to-blue-500 transition-all duration-700 ease-out"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>

            <div className="flex justify-between relative z-10">
              {steps.map((step, index) => {
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;
                
                return (
                  <div key={step.id} className="flex flex-col items-center gap-3 w-20">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                        ${isCompleted ? 'bg-[#34D399] border-[#34D399] shadow-[0_0_15px_rgba(52,211,153,0.4)]' : ''}
                        ${isCurrent ? 'bg-brand border-brand shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse' : ''}
                        ${!isCompleted && !isCurrent ? 'bg-[#0B0612] border-white/20' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isCurrent ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span className="text-xs text-white/40 font-medium">{step.id}</span>
                      )}
                    </div>
                    <span 
                      className={`text-[10px] text-center font-medium transition-colors duration-300
                        ${isCompleted ? 'text-[#34D399]' : ''}
                        ${isCurrent ? 'text-white' : ''}
                        ${!isCompleted && !isCurrent ? 'text-[#7A6B8A]' : ''}
                      `}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {currentStep === 6 && (
            <div className="mt-12 text-center animate-fade-up">
              <p className="text-sm text-[#34D399] font-medium flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Document is ready. Redirecting to chat...
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ProcessingStatus;
