import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { logout } from '../utils/auth';
import axiosInstance from '../utils/axiosInstance';
import { useWorkspace } from '../context/WorkspaceContext';
import FeedbackModal from './FeedbackModal';
import { toast } from 'react-hot-toast';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const { 
    workspaces, 
    documents,
    chats,
    activeWorkspaceId, 
    activeChatId,
    setActiveWorkspaceId, 
    setActiveChatId,
    refreshDocuments,
    refreshChats,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    renameChat,
    deleteChat,
    ragMode,
    setRagMode
  } = useWorkspace();

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [dataFilesOpen, setDataFilesOpen] = useState(true);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editChatTitle, setEditChatTitle] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axiosInstance.get('/auth/dashboard');
        setUser(data.user);
      } catch (err) {
        console.error('Sidebar: Failed to fetch user', err);
      }
    };
    fetchUser();
  }, []);

  const handleUpdateChat = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editChatTitle.trim()) return;
    try {
      await renameChat(id, editChatTitle);
      setEditingChatId(null);
      setEditChatTitle('');
      toast.success('Chat renamed');
    } catch (err) {
      console.error('Failed to update chat', err);
      toast.error('Failed to update chat');
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        await deleteChat(id);
        toast.success('Chat deleted');
        if (activeChatId === id) {
          navigate(`/chat/${activeWorkspaceId}`);
        }
      } catch (err) {
        console.error('Failed to delete chat', err);
        toast.error('Failed to delete chat');
      }
    }
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axiosInstance.get(`${import.meta.env.VITE_BACKEND_URL}/api/health`);
        setIsHealthy(res.data?.status === 'healthy' || res.data?.status === 'degraded');
      } catch {
        setIsHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // 60s
    return () => clearInterval(interval);
  }, []);

  const handleDeleteWorkspace = async (id: string) => {
    if (window.confirm('Delete this workspace and all its documents?')) {
      try {
        await deleteWorkspace(id);
        setWorkspaceOpen(false);
      } catch (err) {
        console.error('Failed to delete workspace', err);
      }
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      await createWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      setIsCreatingWorkspace(false);
      setWorkspaceOpen(false);
    } catch (err) {
      console.error('Failed to create workspace', err);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editWorkspaceName.trim()) return;
    try {
      await updateWorkspace(id, editWorkspaceName);
      setEditingWorkspaceId(null);
      setEditWorkspaceName('');
    } catch (err) {
      console.error('Failed to update workspace', err);
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    navigate('/chat');
  };

  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];
  const currentWorkspace = safeWorkspaces.find(w => w._id === activeWorkspaceId);
  const safeDocuments = Array.isArray(documents) ? documents : [];

  const handleDeleteDoc = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axiosInstance.delete(`/documents/${id}?workspaceId=${activeWorkspaceId}`);
        refreshDocuments();
        toast.success('Document has been deleted');
      } catch (err) {
        console.error('Failed to delete document', err);
        toast.error('Failed to delete document');
      }
    }
  };

  return (
    <aside className={`h-full shrink-0 flex flex-col glass-panel z-30 relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'w-[80px]' : 'w-64'}`}>
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5 h-16 shrink-0">
        {!collapsed ? (
          <>
            <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
              <Logo variant="full" size="lg" className="shrink-0" />
              <div className="flex items-center gap-1.5 ml-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
                <span className={`text-[9px] uppercase font-bold tracking-tighter ${user?.plan === 'pro' ? 'text-brand' : 'text-white/30'}`}>
                  {user?.plan === 'pro' ? 'Premium' : (isHealthy ? 'API Live' : 'API Down')}
                </span>
              </div>
            </Link>
            <button onClick={onToggle} className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0 ml-auto">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            </button>
          </>
        ) : (
          <button onClick={onToggle} className="mx-auto p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Logo variant="icon" size="sm" />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide space-y-6">
        
        {/* Workspace Selector */}
        {!collapsed && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Workspace</h3>
              <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/40">{safeWorkspaces.length}</span>
            </div>
            <div className="relative">
              <button 
                onClick={() => setWorkspaceOpen(!workspaceOpen)}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-left overflow-hidden"
              >
                <div className="w-5 h-5 rounded bg-brand/20 flex items-center justify-center font-bold text-[10px] text-brand shrink-0">
                  {currentWorkspace?.name[0] || 'T'}
                </div>
                <span className="font-medium text-[13px] text-white/90 truncate">{currentWorkspace?.name || 'Select Workspace'}</span>
                <svg className={`w-4 h-4 ml-auto text-white/30 transition-transform ${workspaceOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>

              {workspaceOpen && (
                <div className="absolute top-full left-0 w-full mt-2 glass-dropdown rounded-xl py-2 z-[100] shadow-2xl border border-white/10 overflow-visible">
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {safeWorkspaces.length === 0 && (
                      <div className="px-4 py-3 text-xs text-white/40 text-center">No workspaces found</div>
                    )}
                    {safeWorkspaces.map(ws => (
                      <div 
                        key={ws._id}
                        className={`group w-full text-left px-4 py-2.5 text-xs flex items-center justify-between cursor-pointer transition-all ${activeWorkspaceId === ws._id ? 'text-brand bg-white/5' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                        onClick={() => {
                          if (editingWorkspaceId !== ws._id) {
                            setActiveWorkspaceId(ws._id); 
                            setWorkspaceOpen(false);
                            navigate(`/chat/${ws._id}`);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <div className={`w-4 h-4 rounded flex items-center justify-center font-bold shrink-0 ${activeWorkspaceId === ws._id ? 'bg-brand/20' : 'bg-white/10'}`}>
                            {ws.name[0]}
                          </div> 
                          {editingWorkspaceId === ws._id ? (
                            <form onSubmit={(e) => handleUpdateWorkspace(e, ws._id)} className="flex-1 flex gap-1">
                              <input autoFocus type="text" value={editWorkspaceName} onChange={(e) => setEditWorkspaceName(e.target.value)} className="w-full bg-white/5 border border-white/20 rounded px-1 py-0.5 text-xs text-white outline-none" onClick={(e) => e.stopPropagation()}/>
                            </form>
                          ) : (
                            <span className="truncate">{ws.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {editingWorkspaceId === ws._id ? (
                            <button onClick={(e) => { e.stopPropagation(); setEditingWorkspaceId(null); }} className="p-1 hover:text-white transition-all text-white/40"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                          ) : (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); setEditingWorkspaceId(ws._id); setEditWorkspaceName(ws.name); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-brand transition-all text-white/40"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                              {safeWorkspaces.length > 1 && (
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteWorkspace(ws._id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all text-white/40"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {isCreatingWorkspace ? (
                    <form onSubmit={handleCreateWorkspace} className="p-2 border-t border-white/10 mt-1">
                      <input autoFocus type="text" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="Workspace name..." className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-brand/50 mb-2"/>
                      <div className="flex gap-1">
                        <button type="submit" className="flex-1 bg-brand text-white text-[10px] py-1 rounded">Create</button>
                        <button type="button" onClick={() => setIsCreatingWorkspace(false)} className="px-2 py-1 text-[10px] text-white/50 hover:text-white">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setIsCreatingWorkspace(true)} className="w-full text-left px-3 py-2 text-xs text-white/50 hover:text-white hover:bg-white/10 flex items-center gap-2 border-t border-white/10 mt-1 pt-2">
                      <svg className="w-4 h-4 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                      Add new workspace
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* New Chat Button */}
        <div>
          <button 
            onClick={handleNewChat}
            className={`w-full bg-white/10 hover:bg-white/15 border border-white/5 transition-all text-white py-2.5 px-4 rounded-xl flex items-center ${collapsed ? 'justify-center' : 'gap-3'} text-sm font-medium`}
          >
            <svg className="w-4 h-4 text-white/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            {!collapsed && <span className="whitespace-nowrap">New Chat</span>}
          </button>
        </div>

        {/* Documents Section */}
        <div>
          {!collapsed && (
            <button onClick={() => setDataFilesOpen(!dataFilesOpen)} className="w-full flex items-center justify-between mb-2 px-1 mt-4">
              <h3 className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Data & Files</h3>
              <svg className={`w-3 h-3 text-white/40 transition-transform ${dataFilesOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
          {(dataFilesOpen || collapsed) && (
            <div className="space-y-1">
              {safeDocuments.length === 0 ? !collapsed && (
                <div className="px-2 py-3 text-[10px] text-white/20 text-center border border-dashed border-white/5 rounded-lg">No documents</div>
              ) : safeDocuments.map((doc) => {
                const isProcessing = doc.status === 'processing' || doc.status === 'pending';
                return (
                  <div key={doc._id} className="group relative">
                    <div className={`flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors ${collapsed ? 'justify-center' : ''} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        {isProcessing ? (
                          <div className="w-4 h-4 border-2 border-brand/40 border-t-brand rounded-full animate-spin shrink-0" />
                        ) : (
                          <svg className={`w-4 h-4 shrink-0 ${doc.status === 'ready' || doc.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        )}
                        {!collapsed && (
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm text-white/70 truncate">{doc.name}</span>
                            {isProcessing && <span className="text-[9px] text-brand/60 animate-pulse font-medium uppercase tracking-tighter">Processing...</span>}
                          </div>
                        )}
                      </div>
                      {!collapsed && !isProcessing && (
                        <button onClick={() => handleDeleteDoc(doc._id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      )}
                    </div>
                  </div>
                );
              })}
              {!collapsed && (
                <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-brand/10 text-brand text-xs border border-dashed border-brand/20 mt-2 cursor-pointer transition-colors">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  <span>Upload New</span>
                  <input type="file" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !activeWorkspaceId) return;
                    const toastId = toast.loading(`Uploading ${file.name}...`);
                    try {
                      const formData = new FormData();
                      formData.append('document', file);
                      formData.append('workspaceId', activeWorkspaceId);
                      await axiosInstance.post('/documents/upload', formData);
                      toast.success('Your PDF has been uploaded successfully!', { id: toastId });
                      refreshDocuments();
                    } catch (err) {
                      console.error('Failed to upload', err);
                      toast.error('Failed to upload document', { id: toastId });
                    }
                    e.target.value = '';
                  }}/>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Chat History Section */}
        <div>
          {!collapsed && (
            <button onClick={() => setChatsOpen(!chatsOpen)} className="w-full flex items-center justify-between mb-2 px-1 mt-2">
              <h3 className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Chat History</h3>
              <svg className={`w-3 h-3 text-white/40 transition-transform ${chatsOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
          {(chatsOpen || collapsed) && (
            <div className="space-y-1">
              {chats.length === 0 ? !collapsed && (
                <div className="px-2 py-3 text-[10px] text-white/20 text-center border border-dashed border-white/5 rounded-lg">No previous chats</div>
              ) : chats.map((chat) => (
                <div 
                  key={chat._id} 
                  onClick={() => { if (editingChatId !== chat._id) { setActiveChatId(chat._id); navigate(`/chat/${activeWorkspaceId}/${chat._id}`); } }}
                  className={`group relative flex items-center p-2 rounded-lg cursor-pointer transition-colors ${collapsed ? 'justify-center' : ''} ${activeChatId === chat._id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/70 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <svg className={`w-4 h-4 shrink-0 ${activeChatId === chat._id ? 'text-brand' : 'text-white/40'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    {editingChatId === chat._id ? (
                      <form onSubmit={(e) => handleUpdateChat(e, chat._id)} className="flex-1 flex gap-1">
                        <input autoFocus type="text" value={editChatTitle} onChange={(e) => setEditChatTitle(e.target.value)} className="w-full bg-white/5 border border-white/20 rounded px-1 py-0.5 text-xs text-white outline-none" onClick={(e) => e.stopPropagation()}/>
                      </form>
                    ) : (
                      !collapsed && <span className="text-sm truncate">{chat.title}</span>
                    )}
                  </div>
                  {!collapsed && editingChatId !== chat._id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingChatId(chat._id); setEditChatTitle(chat.title); }}
                        className="p-1 hover:text-brand text-white/30 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button 
                        onClick={(e) => handleDeleteChat(e, chat._id)}
                        className="p-1 hover:text-red-400 text-white/30 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="mt-auto border-t border-white/5 p-3 space-y-3">
        <div className="relative">
          <button onClick={() => setProfileOpen(!profileOpen)} className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl hover:bg-white/5 transition-colors`}>
            <img src={user?.picture || "https://i.pravatar.cc/150?img=11"} alt="Profile" className="w-8 h-8 rounded-full shrink-0 object-cover border border-white/10" />
            {!collapsed && (
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-bold text-white truncate w-full">{user?.name || "Guest User"}</span>
                <span className={`text-[11px] uppercase tracking-widest font-black ${user?.plan === 'pro' ? 'text-brand' : 'text-white/40'}`}>
                  {user?.plan === 'pro' ? 'Premium' : 'Free Plan'}
                </span>
              </div>
            )}
          </button>
          {profileOpen && !collapsed && (
            <div className="absolute bottom-full left-0 mb-2 w-full glass-dropdown rounded-xl py-2 z-50 shadow-2xl border border-white/5 animate-in slide-in-from-bottom-2 duration-200">
              <button onClick={() => { navigate('/feedback'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg> <span>Send Feedback</span>
              </button>
              <button onClick={() => { navigate('/upgrade'); setProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> <span>Upgrade to Pro</span>
              </button>
              <div className="h-px bg-white/5 my-1 mx-2"></div>
              
              {/* RAG Mode Toggle in Sidebar */}
              <div className="px-4 py-2">
                <div className="text-[10px] uppercase tracking-wider text-white/30 font-bold mb-2">Search Mode</div>
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setRagMode('hybrid'); }}
                    className={`flex-1 text-[10px] py-1.5 rounded-md transition-all font-bold ${ragMode === 'hybrid' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-white/40 hover:text-white'}`}
                  >
                    Hybrid
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setRagMode('strict'); }}
                    className={`flex-1 text-[10px] py-1.5 rounded-md transition-all font-bold ${ragMode === 'strict' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-white/40 hover:text-white'}`}
                  >
                    Strict
                  </button>
                </div>
              </div>

              <div className="h-px bg-white/5 my-1 mx-2"></div>
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/5 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </aside>
  );
};

export default Sidebar;
