import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import AgentThinking from './AgentThinking';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  animate?: boolean;
  isLast?: boolean;
  isLoading?: boolean;
  onRegenerate?: () => void;
  onStop?: () => void;
  onDelete?: (id: string) => void;
  id?: string;
}

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden bg-black/40 border border-white/10">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{language}</span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${copied ? 'text-green-400 bg-green-500/10' : 'text-white/40 hover:text-white hover:bg-white/10'
            }`}
        >
          {copied ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              <span className="text-[9px] font-bold uppercase">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span className="text-[9px] font-bold uppercase">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed scrollbar-hide">
        <code className={`language-${language} text-white/80`}>{code}</code>
      </pre>
    </div>
  );
};

/**
 * TraceToggle — owns its own showTrace state.
 * Mounts only when isLoading=true, so every new generation starts with trace CLOSED.
 */
const TraceToggle: React.FC = () => {
  const [showTrace, setShowTrace] = useState(false);

  return (
    <div className="mt-1 border-t border-white/[0.03] pt-2.5">
      {/* Spinner + toggle button */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 border-[1.5px] border-brand/20 border-t-brand/70 rounded-full animate-spin flex-shrink-0" />
        <button
          onClick={() => setShowTrace(v => !v)}
          className={`flex items-center gap-1 text-[10px] font-semibold tracking-wide transition-colors duration-200 ${
            showTrace ? 'text-brand/70' : 'text-white/25 hover:text-white/50'
          }`}
        >
          <svg
            className={`w-2.5 h-2.5 transition-transform duration-300 ${showTrace ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
          {showTrace ? 'Hide trace' : 'Show trace'}
        </button>
      </div>

      {/* Trace panel — only in DOM when open */}
      {showTrace && (
        <div
          className="pt-2"
          style={{ animation: 'traceReveal 0.25s ease-out both' }}
        >
          <AgentThinking />
        </div>
      )}
    </div>
  );
};

const Message: React.FC<MessageProps> = ({
  role,
  content,
  source,
  animate = false,
  isLast = false,
  isLoading = false,
  onRegenerate,
  onStop,
  onDelete,
  id
}) => {
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
      const typingValue = !!(isLoading && isLast);
      setIsTyping(prev => prev !== typingValue ? typingValue : prev);
      setShowActions(prev => !prev ? true : prev);
    }
  }, [content, role, animate, isLoading, isLast]);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleTTS = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = content
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/#+\s/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/`{1,3}.*?`{1,3}/gs, '')
      .replace(/<.*?>/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    const getIndianFemaleVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      return voices.find(v => v.lang === 'en-IN' && (v.name.includes('Female') || v.name.includes('Heera') || v.name.includes('Neerja')))
        || voices.find(v => v.lang === 'hi-IN' && (v.name.includes('Female') || v.name.includes('Kalpana')))
        || voices.find(v => v.lang === 'en-IN' && v.name.includes('Google'))
        || voices.find(v => v.lang === 'en-IN');
    };

    const selectedVoice = getIndianFemaleVoice();
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.rate = 0.8;
    utterance.pitch = 1.1;

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
    <div className={`w-full flex flex-col ${role === 'user' ? 'items-end' : 'items-start'} group mb-2`}>
      {/* Role Label */}
      <div className="flex items-center gap-2 mb-2 px-1">
        {role === 'assistant' ? (
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-brand to-brand/60 flex items-center justify-center p-1 shadow-md shadow-brand/10">
            <img src="/favicon.png" alt="AI" className="w-full h-full object-contain" />
          </div>
        ) : null}
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
          {role === 'user' ? 'You' : 'AI Assistant'}
        </span>
      </div>

      <div className={`flex items-start w-full ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[85%] md:max-w-[80%] min-w-[60px] ${role === 'user' ? 'ml-auto' : ''}`}>
          <div
            className={`rounded-2xl px-5 py-3.5 relative ${role === 'user'
                ? 'bg-white/10 border border-white/5 text-white rounded-tr-none'
                : 'bg-white/[0.03] border border-white/[0.05] text-white/90 rounded-tl-none'
              }`}
          >
            {isLoading && isLast && content === '' ? (
              <div className="flex items-center gap-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <div className="text-[14.5px] leading-relaxed markdown-content selection:bg-brand/30">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeValue = String(children).replace(/\n$/, '');

                      if (!inline && match) {
                        return <CodeBlock code={codeValue} language={match[1]} />;
                      }

                      return (
                        <code className={`${className} bg-white/5 px-1.5 py-0.5 rounded text-sm`} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {displayedText}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {role === 'assistant' && (
            <div className="flex flex-col gap-3 mt-3 px-1">
              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1 transition-opacity duration-300 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
                  <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-white/10 text-white/20 hover:text-white transition-all" title="Copy">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                  <button
                    onClick={toggleTTS}
                    className={`p-1.5 rounded-lg hover:bg-white/10 transition-all ${isSpeaking ? 'text-brand bg-brand/10' : 'text-white/20 hover:text-white'}`}
                    title={isSpeaking ? "Stop Voice" : "Voice Read"}
                  >
                    {isSpeaking ? (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    )}
                  </button>

                  {isLast && (
                    isLoading ? (
                      <button onClick={onStop} className="p-1.5 rounded-lg hover:bg-white/10 text-red-400/70 hover:text-red-500 transition-all" title="Stop Generating">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect width="14" height="14" x="5" y="5" rx="1" /></svg>
                      </button>
                    ) : (
                      onRegenerate && (
                        <button onClick={onRegenerate} className="p-1.5 rounded-lg hover:bg-white/10 text-white/20 hover:text-white transition-all" title="Regenerate Response">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                      )
                    )
                  )}
                </div>

                {/* Source Tag */}
                {source && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-tighter transition-all ${source === 'General Knowledge' || source === 'Internal' || source === 'Strict Guardrail'
                        ? 'bg-purple-500/5 border-purple-500/10 text-purple-400/40'
                        : 'bg-blue-500/5 border-blue-500/10 text-blue-400/50'
                      }`}>
                      {source}
                    </span>
                  </div>
                )}
              </div>

              {/* Trace toggle — mounts fresh each generation, always starts closed */}
              {isLoading && isLast && <TraceToggle />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
