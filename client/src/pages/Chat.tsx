import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import Message from '../components/Message';
import ChatInput from '../components/ChatInput';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I am ready to help you analyze your documents. What would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = (content: string) => {
    const newMessage: ChatMessage = {
      id: messages.length + 1,
      role: 'user',
      content,
    };

    setMessages([...messages, newMessage]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: 'assistant',
          content: 'Based on the uploaded documents, I found relevant information. The key findings are summarized below with source references.',
          source: 'document.pdf • Page 12',
        },
      ]);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSend(input);
    setInput('');
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          setInput(transcript);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
      }
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col h-full relative z-10 w-full overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col w-full">
          <div className="flex-1 flex flex-col items-center w-full max-w-3xl mx-auto py-10 px-4 md:px-0">
            {!messages.length && (
              <>
                <div className="orb mb-8"></div>
                <h1 className="text-2xl md:text-3xl font-medium text-white mb-8 tracking-wide text-center">Ask Questions About Your Documents</h1>
                <div className="flex flex-wrap justify-center gap-2.5">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full glass-card hover:bg-white/10 text-white/80 text-[11px] md:text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Ask Questions
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full glass-card hover:bg-white/10 text-white/80 text-[11px] md:text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Summarize Document
                  </button>
                </div>
              </>
            )}

            <div className="w-full mt-4 group">
              {messages.map((msg) => (
                <Message key={msg.id} role={msg.role} content={msg.content} source={msg.source} />
              ))}
            </div>
          </div>

          <div className="w-full max-w-3xl mx-auto pb-6 md:pb-8 shrink-0 px-4 md:px-0">
            <div className="relative rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 overflow-hidden">
              {isRecording && (
                <div className="absolute inset-0 flex items-center justify-between gap-4 p-3 md:p-4 z-10 bg-[#0f0a1a]/95 animate-fade-in">
                  <div className="flex-1 flex items-center justify-center gap-1 h-12">
                    {[...Array(40)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-gradient-to-t from-brand to-purple-400 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 24 + 8}px`,
                          animationDelay: `${i * 0.03}s`,
                          animationDuration: '0.8s'
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => { setIsRecording(false); setInput(''); }} 
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <button 
                      onClick={() => { setIsRecording(false); if (input) handleSend(input); }} 
                      className="p-3 rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-all"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>
              )}
              
              <div className={`transition-opacity duration-300 ${isRecording ? 'opacity-0' : 'opacity-100'}`}>
                <ChatInput onSend={handleSend} />
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className="absolute right-14 bottom-3 p-2 text-white/40 hover:text-brand transition-colors"
                  title="Voice input"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Chat;
