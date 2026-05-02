import React, { useState, useRef, useEffect } from 'react';

// For TypeScript support with Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatInputProps {
  onSend: (message: string) => void;
  onUpload?: (file: File) => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onUpload, isLoading = false }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [input]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('Speech recognition not supported');
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false; // Disable interim for better stability
      
      recognition.onresult = (event: any) => {
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript;
          }
        }
        if (newTranscript) {
          setInput(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + newTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
        setIsListening(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const supportsSpeech = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-end gap-2 p-3 md:p-4 rounded-2xl transition-all duration-300 ${
        isFocused ? 'bg-white/10 border-brand/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'bg-white/5 border-white/10'
      } border backdrop-blur-xl ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <label
        className={`p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0 ${isLoading ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
        title="Upload Document"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        <input 
          type="file" 
          className="hidden" 
          accept=".pdf,.doc,.docx,.txt" 
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>

      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        disabled={isLoading}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isLoading ? "AI is processing..." : isListening ? "Listening... (Speak now)" : "Ask anything about your document..."}
        className="flex-1 bg-transparent border-none outline-none resize-none text-white placeholder-white/40 text-sm py-2 max-h-32 overflow-y-auto disabled:cursor-not-allowed"
        style={{ minHeight: '24px' }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />

      {supportsSpeech && (
        <button
          type="button"
          onClick={toggleListening}
          disabled={isLoading}
          className={`p-2.5 rounded-xl transition-all shrink-0 ${
            isListening 
              ? 'text-red-400 bg-red-400/10 animate-pulse' 
              : 'text-white/40 hover:text-white hover:bg-white/10'
          }`}
          title={isListening ? "Stop Voice Typing" : "Start Voice Typing"}
        >
          {isListening ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
      )}

      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className={`p-2.5 rounded-xl transition-all shrink-0 ${
          input.trim() && !isLoading
            ? 'bg-gradient-to-r from-[#6B3FA0] to-[#4F8EF7] text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5'
            : 'bg-white/5 text-white/30 cursor-not-allowed'
        }`}
        title="Send message"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 translate-x-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        )}
      </button>
    </form>
  );
};

export default ChatInput;
