import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

import type { Workspace } from '../types';

interface ChatSession {
  _id: string;
  title: string;
  createdAt: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  documents: any[];
  chats: ChatSession[];
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  currentChatMessages: any[];
  setCurrentChatMessages: (messages: any[]) => void;
  currentChatTitle: string;
  setCurrentChatTitle: (title: string) => void;
  ragMode: 'hybrid' | 'strict';
  setRagMode: (mode: 'hybrid' | 'strict') => void;
  isModeModalOpen: boolean;
  setIsModeModalOpen: (open: boolean) => void;
  refreshWorkspaces: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
  refreshChats: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace>;
  updateWorkspace: (id: string, name: string) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  renameChat: (chatId: string, title: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [currentChatMessages, setCurrentChatMessages] = useState<any[]>([]);
  const [currentChatTitle, setCurrentChatTitle] = useState<string>('New Chat');
  const [ragMode, setRagModeState] = useState<'hybrid' | 'strict'>('hybrid');
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);

  // Fetch RAG mode on mount
  useEffect(() => {
    const fetchRagMode = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axiosInstance.get('/models/rag-mode');
        if (res.data?.mode) {
          setRagModeState(res.data.mode);
        }
      } catch (err) {
        console.error('Failed to fetch RAG mode', err);
      }
    };
    fetchRagMode();
  }, []);

  const setRagMode = async (mode: 'hybrid' | 'strict') => {
    // ONLY trigger the modal if the mode is actually different from current
    if (mode !== ragMode) {
      setIsModeModalOpen(true);
    }
    setRagModeState(mode);
    try {
      await axiosInstance.patch('/models/rag-mode', { mode });
    } catch (err) {
      console.error('Failed to save RAG mode', err);
    }
  };

  const refreshDocuments = async () => {
    if (!activeWorkspaceId) {
      setDocuments([]);
      return;
    }
    try {
      const res = await axiosInstance.get(`/documents?workspaceId=${activeWorkspaceId}`);
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    }
  };

  const refreshChats = async () => {
    if (!activeWorkspaceId || activeWorkspaceId === 'null') {
      setChats([]);
      return;
    }
    try {
      const chatRes = await axiosInstance.get(`/chat/sessions?workspaceId=${activeWorkspaceId}`);
      setChats(Array.isArray(chatRes.data) ? chatRes.data : []);
    } catch (err) {
      console.error('Failed to fetch chats', err);
    }
  };

  const refreshWorkspaces = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setWorkspaces([]);
      setDocuments([]);
      setChats([]);
      setActiveWorkspaceId(null);
      return;
    }

    try {
      const res = await axiosInstance.get('/workspaces');
      const safeWorkspaces = Array.isArray(res.data) ? res.data : [];
      setWorkspaces(safeWorkspaces);
      
      // Auto-select first workspace if none selected or invalid selection
      if (safeWorkspaces.length > 0) {
        const isValid = safeWorkspaces.some(w => w._id === activeWorkspaceId);
        if (!activeWorkspaceId || activeWorkspaceId === 'null' || !isValid) {
          setActiveWorkspaceId(safeWorkspaces[0]._id);
        }
      } else if (token) {
        // Create default workspace if none exist
        await createWorkspace('My Workspace');
      }
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
    }
  };

  const createWorkspace = async (name: string) => {
    const res = await axiosInstance.post('/workspaces', { name });
    const createdWorkspace = res.data?.workspace || res.data;
    if (!createdWorkspace?._id) {
      throw new Error('Invalid workspace response');
    }
    setWorkspaces(prev => Array.isArray(prev) ? [createdWorkspace, ...prev] : [createdWorkspace]);
    setActiveWorkspaceId(createdWorkspace._id);
    return createdWorkspace;
  };

  const deleteWorkspace = async (id: string) => {
    await axiosInstance.delete(`/workspaces/${id}`);
    await refreshWorkspaces();
  };

  useEffect(() => {
    refreshWorkspaces();
  }, []);

  useEffect(() => {
    if (activeWorkspaceId && activeWorkspaceId !== 'null') {
      // Clear current session state for isolation
      setActiveChatId(null);
      setCurrentChatMessages([]);
      setCurrentChatTitle('New Chat');
      
      refreshDocuments();
      refreshChats();
    }
  }, [activeWorkspaceId]);

  const updateWorkspace = async (id: string, name: string) => {
    const res = await axiosInstance.patch(`/workspaces/${id}`, { name });
    const updatedWorkspace = res.data?.workspace || res.data;
    setWorkspaces(prev => prev.map(w => w._id === id ? updatedWorkspace : w));
    return updatedWorkspace;
  };

  const renameChat = async (chatId: string, title: string) => {
    try {
      await axiosInstance.patch(`/chat/sessions/${chatId}`, { title, workspaceId: activeWorkspaceId });
      setChats(prev => prev.map(c => c._id === chatId ? { ...c, title } : c));
      if (activeChatId === chatId) {
        setCurrentChatTitle(title);
      }
    } catch (err) {
      console.error('Failed to rename chat', err);
      throw err;
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await axiosInstance.delete(`/chat/sessions/${chatId}?workspaceId=${activeWorkspaceId}`);
      setChats(prev => prev.filter(c => c._id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setCurrentChatMessages([]);
        setCurrentChatTitle('New Chat');
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
      throw err;
    }
  };

  const contextValue = React.useMemo(() => ({
    workspaces,
    documents,
    chats,
    activeWorkspaceId,
    setActiveWorkspaceId,
    activeChatId,
    setActiveChatId,
    currentChatMessages,
    setCurrentChatMessages,
    currentChatTitle,
    setCurrentChatTitle,
    ragMode,
    setRagMode,
    isModeModalOpen,
    setIsModeModalOpen,
    refreshWorkspaces,
    refreshDocuments,
    refreshChats,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    renameChat,
    deleteChat
  }), [workspaces, documents, chats, activeWorkspaceId, activeChatId, currentChatMessages, currentChatTitle, ragMode, isModeModalOpen]);

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
