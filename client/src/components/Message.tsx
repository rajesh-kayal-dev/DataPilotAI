import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  animate?: boolean;
}

const Message: React.FC<MessageProps> = ({ role, content, source, animate = false }) => {
  const [isTyping, setIsTyping] = useState(role === 'assistant' && animate);
  const [displayedText, setDisplayedText] = useState('');
  const [showActions, setShowActions] = useState(!animate);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (role === 'assistant' && animate) {
      setIsTyping(true);
      setShowActions(false);
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
      setShowActions(true);
    }
  }, [content, role, animate]);

  // Stop speech on unmount or reload
  useEffect(() => {
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-to-Speech Handler
  const toggleTTS = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean text: Remove markdown formatting for smoother reading
    const cleanText = content
      .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
      .replace(/(\*|_)(.*?)\1/g, '$2')    // Remove italic
      .replace(/#+\s/g, '')               // Remove headers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
      .replace(/`{1,3}.*?`{1,3}/gs, '')   // Remove code blocks
      .replace(/<.*?>/g, '')              // Remove HTML
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Improved Voice Selection (Handle Async Load)
    const getIndianFemaleVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      return voices.find(v => v.lang === 'en-IN' && (v.name.includes('Female') || v.name.includes('Heera') || v.name.includes('Neerja')))
          || voices.find(v => v.lang === 'hi-IN' && (v.name.includes('Female') || v.name.includes('Kalpana')))
          || voices.find(v => v.lang === 'en-IN' && v.name.includes('Google'))
          || voices.find(v => v.lang === 'en-IN');
    };

    const selectedVoice = getIndianFemaleVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = 0.8; // Slow and steady
    utterance.pitch = 1.1; // Clear female pitch
    
    // Prevent repetition by clearing any previous queue
    window.speechSynthesis.cancel();
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [content, isSpeaking]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4 group`}>
      {role === 'assistant' && (
        <button 
          onClick={toggleTTS}
          className={`w-10 h-10 rounded-full bg-gradient-to-br from-[#6B3FA0]/20 to-[#4F8EF7]/20 border border-white/10 flex items-center justify-center shrink-0 mr-3 self-start transition-all hover:scale-110 active:scale-95 ${isSpeaking ? 'speaking-animation ring-2 ring-brand' : ''}`}
          title={isSpeaking ? "Stop Speaking" : "Listen to Response"}
        >
          <img src="/favicon.png" alt="AI" className="w-6 h-6 object-contain" />
        </button>
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
            <div className="text-sm leading-relaxed markdown-content">
              <ReactMarkdown>{displayedText}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isTyping && role === 'assistant' && (
          <div className="flex items-center justify-between mt-2 ml-1">
            {/* Actions (Left) */}
            <div className={`flex items-center gap-2 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
              <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Copy">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
              <button 
                onClick={toggleTTS}
                className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${isSpeaking ? 'text-brand bg-brand/10' : 'text-white/40 hover:text-white'}`} 
                title={isSpeaking ? "Stop Voice" : "Voice Read"}
              >
                {isSpeaking ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
              </button>
            </div>

            {/* Source Tag (Right) */}
            {source && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50 font-medium whitespace-nowrap">
                {source === 'General Knowledge' ? (
                  <>
                    <svg className="w-3 h-3 mr-1.5 text-purple-400 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    {source}
                  </>
                ) : (
                  <>
                    {source}
                    <svg className="w-3 h-3 ml-1.5 text-blue-400 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
