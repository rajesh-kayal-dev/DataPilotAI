import React, { useState, useEffect } from 'react';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
}

const Message: React.FC<MessageProps> = ({ role, content, source }) => {
  const [isTyping, setIsTyping] = useState(role === 'assistant');
  const [displayedText, setDisplayedText] = useState('');
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (role === 'assistant') {
      let index = 0;
      const interval = setInterval(() => {
        if (index < content.length) {
          setDisplayedText((prev) => prev + content.charAt(index));
          index++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
          setShowActions(true);
        }
      }, 15);
      return () => clearInterval(interval);
    } else {
      setDisplayedText(content);
      setIsTyping(false);
    }
  }, [content, role]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      {role === 'assistant' && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6B3FA0]/20 to-[#4F8EF7]/20 border border-white/10 flex items-center justify-center shrink-0 mr-3 self-start">
          <img src="/favicon.png" alt="AI" className="w-5 h-5 object-contain" />
        </div>
      )}
      
      <div className="max-w-[75%]">
        <div
          className={`rounded-2xl px-4 py-3 relative ${
            role === 'user'
              ? 'bg-white/10 border border-white/10 text-white'
              : 'glass-card backdrop-blur-md bg-white/5 border border-white/10 text-white/90 shadow-lg shadow-purple-500/5'
          }`}
        >
          {isTyping ? (
            <div className="flex gap-1.5 py-1">
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed">{displayedText}</p>
          )}
        </div>

        {!isTyping && role === 'assistant' && source && (
          <div className="mt-2 ml-1">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50 font-medium">
              <svg className="w-3 h-3 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {source}
            </span>
          </div>
        )}

        {!isTyping && role === 'assistant' && showActions && (
          <div className="flex items-center gap-2 mt-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Copy">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
            <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Regenerate">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Ask follow-up">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
