import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-end gap-2 p-3 md:p-4 rounded-2xl transition-all duration-300 ${
        isFocused ? 'bg-white/10 border-brand/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'bg-white/5 border-white/10'
      } border backdrop-blur-xl`}
    >
      <button
        type="button"
        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0"
        title="Attach file"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
      </button>

      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Ask anything about your document..."
        className="flex-1 bg-transparent border-none outline-none resize-none text-white placeholder-white/40 text-sm py-2 max-h-32 overflow-y-auto"
        style={{ minHeight: '24px' }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />

      <button
        type="submit"
        disabled={!input.trim()}
        className={`p-2.5 rounded-xl transition-all shrink-0 ${
          input.trim()
            ? 'bg-gradient-to-r from-[#6B3FA0] to-[#4F8EF7] text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5'
            : 'bg-white/5 text-white/30 cursor-not-allowed'
        }`}
        title="Send message"
      >
        <svg className="w-4 h-4 translate-x-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      </button>
    </form>
  );
};

export default ChatInput;
