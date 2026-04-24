import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Message from '../components/Message';
import ChatInput from '../components/ChatInput';
import axiosInstance from '../utils/axiosInstance';
import { useWorkspace } from '../context/WorkspaceContext';

interface ChatMessage {
  _id?: string;
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
}

const Chat: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { activeWorkspaceId, setActiveChatId } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatTitle, setChatTitle] = useState<string>('New Chat');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (chatId) setActiveChatId(chatId);
  }, [chatId]);

  useEffect(() => {
    const fetchChat = async () => {
      if (!chatId) return;
      try {
        const res = await axiosInstance.get(`/api/chats/${chatId}`);
        setMessages(res.data.messages);
        setChatTitle(res.data.title);
      } catch (err) {
        console.error('Failed to fetch chat', err);
        navigate('/dashboard');
      }
    };
    fetchChat();
  }, [chatId]);

  const handleSend = async (content: string) => {
    if (!content.trim() || !chatId) return;

    const userMsg: ChatMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // 1. Get AI Answer (using orchestrator which takes documentId, but for workspace chat we need a different approach or just use the last uploaded doc for now)
      // For now, let's assume we chat with ALL docs in workspace or the orchestrator handles it.
      // Actually, let's fetch docs for this workspace and use the first one if it exists.
      const docRes = await axiosInstance.get(`/api/documents?workspaceId=${activeWorkspaceId}`);
      const documentId = docRes.data.length > 0 ? docRes.data[0]._id : null;

      const res = await axiosInstance.post('/api/documents/chat', { 
        question: content,
        documentId 
      });
      
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.data.answer || 'Answer not found in document',
        source: res.data.source,
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      // 2. Save Messages and Handle Naming
      let newTitle = chatTitle;
      if (messages.length === 0) {
        // Auto-name after first message
        const words = content.split(' ').slice(0, 6).join(' ');
        newTitle = words.length > 30 ? words.slice(0, 30) + '...' : words;
        setChatTitle(newTitle);
      }

      await axiosInstance.patch(`/api/chats/${chatId}`, {
        title: newTitle,
        messages: finalMessages
      });

    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'An error occurred while communicating with the server.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#08060E]">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#08060E]/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center text-brand">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white truncate max-w-[200px] md:max-w-md">
                {chatTitle}
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Workspace AI Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto pt-4 pb-32 px-4 md:px-0 scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">New conversation</h3>
                <p className="text-white/40 text-sm max-w-xs">Ask anything about the documents in this workspace.</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <Message key={idx} role={msg.role} content={msg.content} source={msg.source} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-white/50">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed Chat Input Area */}
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-[#08060E] via-[#08060E] to-transparent z-20">
          <div className="max-w-3xl mx-auto relative group">
            <ChatInput onSend={handleSend} />
            <p className="text-[10px] text-center text-white/20 mt-3 font-medium">
              DataPilotAI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Chat;
