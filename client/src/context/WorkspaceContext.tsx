import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

interface Workspace {
  _id: string;
  name: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const refreshWorkspaces = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setWorkspaces([]);
      setActiveWorkspaceId(null);
      return;
    }

    try {
      const res = await axiosInstance.get('/api/v1/workspaces');
      const safeWorkspaces = Array.isArray(res.data) ? res.data : [];
      setWorkspaces(safeWorkspaces);
      if (safeWorkspaces.length > 0 && !activeWorkspaceId) {
        setActiveWorkspaceId(safeWorkspaces[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
    }
  };

  const createWorkspace = async (name: string) => {
    const res = await axiosInstance.post('/api/v1/workspaces', { name });
    const createdWorkspace = res.data?.workspace || res.data;
    if (!createdWorkspace?._id) {
      throw new Error('Invalid workspace response');
    }
    setWorkspaces(prev => [createdWorkspace, ...prev]);
    setActiveWorkspaceId(createdWorkspace._id);
    return createdWorkspace;
  };

  useEffect(() => {
    refreshWorkspaces();
  }, []);

  return (
    <WorkspaceContext.Provider value={{ 
      workspaces, 
      activeWorkspaceId, 
      setActiveWorkspaceId, 
      activeChatId, 
      setActiveChatId,
      refreshWorkspaces,
      createWorkspace
    }}>
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
