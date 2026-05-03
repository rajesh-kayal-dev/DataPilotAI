import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Message from '../components/Message';
import ChatInput from '../components/ChatInput';
import AgentThinking from '../components/AgentThinking';
import axiosInstance from '../utils/axiosInstance';
import { useWorkspace } from '../context/WorkspaceContext';
import { toast } from 'react-hot-toast';

import type { ChatMessage, ChatResponse } from '../types';

const Chat: React.FC = () => {
  const { workspaceId, chatId } = useParams<{ workspaceId: string; chatId?: string }>();
  const navigate = useNavigate();
  const { 
    workspaces, documents, activeWorkspaceId, setActiveWorkspaceId, 
    setActiveChatId, refreshDocuments, refreshChats,
    setCurrentChatMessages, setCurrentChatTitle
  } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatTitle, setChatTitle] = useState<string>('New Chat');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync with global context for Navbar export
  useEffect(() => {
    setCurrentChatMessages(messages);
  }, [messages, setCurrentChatMessages]);

  useEffect(() => {
    setCurrentChatTitle(chatTitle);
  }, [chatTitle, setCurrentChatTitle]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (workspaceId && workspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(workspaceId);
    }
  }, [workspaceId, activeWorkspaceId]);

  useEffect(() => {
    // Force refresh documents when entering chat
    if (workspaceId) refreshDocuments();

    if (chatId) {
      setActiveChatId(chatId);
      const fetchChatSession = async () => {
        try {
          const res = await axiosInstance.get(`/chat/sessions/${chatId}`);
          if (res.data) {
            setChatTitle(res.data.title || 'Chat');
            setMessages(res.data.messages || []);
          }
        } catch (err) {
          console.error('Failed to fetch chat session:', err);
        }
      };
      fetchChatSession();
    } else {
      setActiveChatId(null);
      setMessages([]);
      setChatTitle('New Chat');
    }
  }, [workspaceId, chatId]);

  // Polling for processing documents
  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing' || d.status === 'pending');
    if (hasProcessing) {
      const interval = setInterval(() => {
        refreshDocuments();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [documents, workspaceId]);

  const abortControllerRef = useRef<AbortController | null>(null);

    const handleSend = async (content: string, isRegenerate = false) => {
      if (!content.trim()) return;

      if (!isRegenerate) {
        const userMsg: ChatMessage = { role: 'user', content };
        const assistantMsg: ChatMessage = { role: 'assistant', content: '', animate: false };
        setMessages(prev => Array.isArray(prev) ? [...prev, userMsg, assistantMsg] : [userMsg, assistantMsg]);
      } else {
        // Reset last assistant message content for regeneration
        setMessages(prev => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === 'assistant') {
              next[i] = { ...next[i], content: '' };
              break;
            }
          }
          return next;
        });
      }
      
      setIsLoading(true);
      setIsThinking(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        if (!activeWorkspaceId || activeWorkspaceId === 'null') {
          throw new Error('No active workspace selected. Please select a workspace from the sidebar.');
        }
        
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': localStorage.getItem('token') || '',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            question: content,
            workspaceId: activeWorkspaceId,
            chatId: chatId || undefined,
            stream: true,
            regenerate: isRegenerate
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to send message');
        }

        if (isRegenerate) {
          // Replace last assistant message with empty one to reset
          setMessages(prev => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i--) {
              if (next[i].role === 'assistant') {
                next[i] = { role: 'assistant', content: '', animate: false };
                break;
              }
            }
            return next;
          });
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullAnswer = '';
        let streamMetadata: any = null;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.chunk) {
                    setIsThinking(false);
                    fullAnswer += data.chunk;
                    setMessages(prev => {
                      const next = [...prev];
                      // Update the last assistant message
                      for (let i = next.length - 1; i >= 0; i--) {
                        if (next[i].role === 'assistant') {
                          next[i] = { ...next[i], content: fullAnswer };
                          break;
                        }
                      }
                      return next;
                    });
                  }

                  if (data.done) {
                    streamMetadata = data;
                  }
                } catch (e) {}
              }
            }
          }
        }

        if (streamMetadata) {
          if (streamMetadata.messages) {
            setMessages(streamMetadata.messages);
          } else {
            setMessages(prev => {
              const next = [...prev];
              for (let i = next.length - 1; i >= 0; i--) {
                if (next[i].role === 'assistant') {
                  next[i] = { 
                    ...next[i], 
                    source: streamMetadata.source,
                    modelName: streamMetadata.model,
                    confidence: streamMetadata.confidence
                  };
                  break;
                }
              }
              return next;
            });
          }

          if (!chatId && streamMetadata.chatId) {
            setChatTitle(streamMetadata.title || 'Chat');
            await refreshChats();
            navigate(`/chat/${activeWorkspaceId}/${streamMetadata.chatId}`, { replace: true });
          }
        }

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Stream aborted');
        } else {
          console.error('Chat error:', error);
          const errorMessage = error.message || 'Something went wrong. Please try again.';
          setMessages((prev) => [
            ...(Array.isArray(prev) ? prev : []),
            { role: 'assistant', content: errorMessage, animate: true },
          ]);
        }
      } finally {
        setIsLoading(false);
        setIsThinking(false);
        abortControllerRef.current = null;
      }
    };

    const handleStop = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };

    const handleRegenerate = async () => {
      // Use functional state check if needed, but here we just need the last user message
      setMessages(prev => {
        const lastUserMsg = [...prev].reverse().find(m => m.role === 'user');
        if (lastUserMsg) {
          // We trigger the send logic outside the setter to avoid side effects
          setTimeout(() => handleSend(lastUserMsg.content, true), 0);
        }
        return prev;
      });
    };

    const handleDeleteMessage = async (messageId: string) => {
      if (!chatId) return;
      try {
        await axiosInstance.delete(`/chat/sessions/${chatId}/messages/${messageId}`);
        setMessages(prev => prev.filter(m => m._id !== messageId));
        toast.success('Message deleted');
      } catch (err) {
        console.error('Failed to delete message:', err);
        toast.error('Failed to delete message');
      }
    };

  const handleUpload = async (file: File) => {
    if (!activeWorkspaceId || activeWorkspaceId === 'null') {
      toast.error('No active workspace selected.');
      return;
    }
    const toastId = toast.loading('Uploading document...');
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('workspaceId', activeWorkspaceId);
      
      await axiosInstance.post('/documents/upload', formData);
      toast.success('Document uploaded and processing started', { id: toastId });
      refreshDocuments();
    } catch (err) {
      console.error('Failed to upload', err);
      toast.error('Failed to upload document', { id: toastId });
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
                <span className={`w-1.5 h-1.5 rounded-full ${documents.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold truncate max-w-[300px]">
                  {documents.length > 0 
                    ? `Chatting with: ${documents.map(d => d.name).join(', ')}` 
                    : 'No documents indexed'}
                </span>
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
            {(Array.isArray(messages) ? messages : []).map((msg, idx) => (
              <div key={idx} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] uppercase tracking-wider text-white/35 font-semibold px-1">
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </span>
                <div className="w-full">
                  <Message 
                    role={msg.role} 
                    content={msg.content} 
                    source={msg.source} 
                    animate={msg.animate}
                    isLast={idx === messages.length - 1}
                    isLoading={isLoading}
                    onRegenerate={handleRegenerate}
                    onStop={handleStop}
                    onDelete={handleDeleteMessage}
                    id={msg._id}
                  />
                </div>

                {/* Multi-Agent Thinking Trace */}
                {isThinking && msg.role === 'assistant' && msg.content === '' && (
                  <div className="mt-4 w-full animate-in fade-in slide-in-from-top-2 duration-500">
                    <AgentThinking />
                  </div>
                )}

                {msg.role === 'assistant' && (msg.modelName || msg.confidence !== undefined) && (
                  <div className="px-1 text-[10px] text-white/40 flex items-center gap-3">
                    {msg.modelName && <span>Model: {msg.modelName}</span>}
                    {msg.confidence !== undefined && <span>Confidence: {Number(msg.confidence).toFixed(2)}</span>}
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed Chat Input Area */}
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-[#08060E] via-[#08060E] to-transparent z-20">
          <div className="max-w-3xl mx-auto relative group">
            <div className={isLoading ? 'opacity-70 pointer-events-none' : ''}>
              <ChatInput onSend={handleSend} onUpload={handleUpload} isLoading={isLoading} />
            </div>
            {isLoading && (
              <div className="absolute inset-0 rounded-2xl" aria-hidden="true" />
            )}
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
