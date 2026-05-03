import React from 'react';

interface ModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'hybrid' | 'strict';
}

const ModeModal: React.FC<ModeModalProps> = ({ isOpen, onClose, mode }) => {
  if (!isOpen) return null;

  const content = {
    hybrid: {
      title: 'Hybrid Mode',
      description: [
        'Answers using both document and general knowledge.',
        'Best for flexible and broader answers.',
        'Uses AI intelligence to supplement missing data.'
      ]
    },
    strict: {
      title: 'Strict Mode',
      description: [
        'Answers ONLY from uploaded documents.',
        'No general knowledge or external facts used.',
        'If information is not in the document, I will clearly say so.'
      ]
    }
  };

  const { title, description } = content[mode];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#16121D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-8">
          <div className="w-16 h-16 rounded-2xl bg-brand/20 flex items-center justify-center mb-6 mx-auto">
            {mode === 'hybrid' ? (
              <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-white text-center mb-4">{title} Enabled</h3>
          
          <div className="space-y-3 mb-8">
            {description.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-white/70 text-sm leading-relaxed">
                <svg className="w-5 h-5 text-brand shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand/20 active:scale-95"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeModal;
