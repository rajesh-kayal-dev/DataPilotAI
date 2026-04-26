import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { logout } from '../utils/auth';
import axiosInstance from '../utils/axiosInstance';
import { useWorkspace } from '../context/WorkspaceContext';
import ModelSelector from './ModelSelector';

interface Document {
  _id: string;
  name: string;
  status: string;
  size: number;
}

interface Chat {
  _id: string;
  title: string;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const { 
    workspaces, 
    activeWorkspaceId, 
    setActiveWorkspaceId, 
    activeChatId, 
    setActiveChatId,
    createWorkspace 
  } = useWorkspace();

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [dataFilesOpen, setDataFilesOpen] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  useEffect(() => {
    const fetchDocsAndChats = async () => {
      if (!activeWorkspaceId) return;
      try {
        const [docRes, chatRes] = await Promise.all([
          axiosInstance.get(`/api/documents?workspaceId=${activeWorkspaceId}`),
          axiosInstance.get(`/api/chats?workspaceId=${activeWorkspaceId}`)
        ]);
        setDocuments(docRes.data);
        setChats(chatRes.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchDocsAndChats();
    const interval = setInterval(fetchDocsAndChats, 5000);
    return () => clearInterval(interval);
  }, [activeWorkspaceId]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      const ws = await createWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      setIsCreatingWorkspace(false);
      setWorkspaceOpen(false);
    } catch (err) {
      alert('Failed to create workspace');
    }
  };

  const handleNewChat = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await axiosInstance.post('/api/chats', { workspaceId: activeWorkspaceId });
      setActiveChatId(res.data._id);
      navigate(`/chat/${res.data._id}`);
    } catch (err) {
      alert('Failed to create chat');
    }
  };

  const currentWorkspace = workspaces.find(w => w._id === activeWorkspaceId);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axiosInstance.delete(`/api/documents/${id}`);
        setDocuments(prev => prev.filter(d => d._id !== id));
      } catch (err) {
        alert('Failed to delete document');
      }
    }
  };

  const recentChats = [
    { id: 1, title: 'React Hooks Mastery', pinned: true },
    { id: 2, title: 'JavaScript Interview Concepts' },
    { id: 3, title: 'Docker Presentation Script' },
    { id: 4, title: 'Docker Notes for Beginners' },
    { id: 5, title: 'Desktop Layout Optimization' },
  ];

  return (
    <aside className={`${collapsed ? 'w-[68px]' : 'w-64'} h-full shrink-0 flex flex-col glass-panel z-30 relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>

      <div className="h-16 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
        {collapsed ? (
          <button onClick={onToggle} className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0">
            <Logo variant="icon" size="sm" />
          </button>
        ) : (
          <>
            <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
              <Logo variant="full" size="lg" className="shrink-0" />
            </Link>
            <button onClick={onToggle} className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0 ml-auto">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            </button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col mt-4 gap-5 pb-4">

        <div className="px-3">
          <h3 className={`text-[10px] uppercase tracking-wider text-white/40 mb-2 px-1 font-semibold ${collapsed ? 'hidden' : ''}`}>Workspace</h3>
          <div className="relative">
            <button onClick={() => setWorkspaceOpen(!workspaceOpen)} className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-brand/20 text-brand flex items-center justify-center text-[10px] font-bold shrink-0">
                  {currentWorkspace?.name?.[0] || 'W'}
                </div>
                {!collapsed && <span className="font-medium text-[13px] text-white/90 whitespace-nowrap">{currentWorkspace?.name || 'Select Workspace'}</span>}
              </div>
              {!collapsed && <svg className={`w-3.5 h-3.5 text-white/50 shrink-0 transition-transform ${workspaceOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>}
            </button>
            {workspaceOpen && !collapsed && (
              <div className="absolute top-full left-0 w-full mt-1 glass-dropdown rounded-lg py-1 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-48 overflow-y-auto scrollbar-hide">
                  {workspaces.map(ws => (
                    <button 
                      key={ws._id}
                      onClick={() => { setActiveWorkspaceId(ws._id); setWorkspaceOpen(false); }} 
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${activeWorkspaceId === ws._id ? 'text-brand bg-white/5' : 'text-white/80 hover:bg-white/10'}`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center font-bold ${activeWorkspaceId === ws._id ? 'bg-brand/20' : 'bg-white/10'}`}>
                        {ws.name[0]}
                      </div> 
                      <span className="truncate">{ws.name}</span>
                    </button>
                  ))}
                </div>
                
                {isCreatingWorkspace ? (
                  <form onSubmit={handleCreateWorkspace} className="p-2 border-t border-white/10 mt-1">
                    <input 
                      autoFocus
                      type="text" 
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      placeholder="Workspace name..."
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-brand/50 mb-2"
                    />
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

        <div className="px-3">
          <button 
            onClick={handleNewChat}
            className="w-full bg-white/10 hover:bg-white/15 border border-white/5 transition-colors text-white py-2 px-4 rounded-xl flex items-center gap-3 text-sm font-medium"
          >
            <svg className="w-4 h-4 text-white/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            {!collapsed && <span className="whitespace-nowrap">New Chat</span>}
          </button>
        </div>

        <div className="px-3">
          <button onClick={() => setDataFilesOpen(!dataFilesOpen)} className={`w-full flex items-center justify-between mb-2 px-1 ${collapsed ? 'hidden' : ''}`}>
            <h3 className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Data & Files</h3>
            <svg className={`w-3 h-3 text-white/40 transition-transform ${dataFilesOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
          {dataFilesOpen && !collapsed && (
            <ul className="space-y-1 text-white/70">
              {documents.map((doc) => (
                <li key={doc._id} className="group relative">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors text-[13px]">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <svg className={`w-4 h-4 shrink-0 ${doc.status === 'ready' ? 'text-green-400' : 'text-yellow-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="truncate">{doc.name}</span>
                    </div>
                    <button 
                      onClick={() => handleDelete(doc._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                      title="Delete document"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </li>
              ))}
              <li><Link to="/workspaces" className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand/10 text-brand text-[13px] border border-dashed border-brand/20 mt-2"><svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg> <span className="whitespace-nowrap">Upload New</span></Link></li>
            </ul>
          )}
        </div>

        <div className="px-3">
          <button onClick={() => setChatsOpen(!chatsOpen)} className={`w-full flex items-center justify-between mb-2 px-1 ${collapsed ? 'hidden' : ''}`}>
            <h3 className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Chats</h3>
            <svg className={`w-3 h-3 text-white/40 transition-transform ${chatsOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
          {chatsOpen && !collapsed && (
            <div className="space-y-1">
              {chats.map((chat) => (
                <Link 
                  key={chat._id} 
                  to={`/chat/${chat._id}`}
                  onClick={() => setActiveChatId(chat._id)}
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors text-[13px] ${activeChatId === chat._id ? 'bg-brand/10 text-brand border border-brand/20' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <svg className="w-3.5 h-3.5 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    <span className="truncate">{chat.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="relative mt-auto border-t border-white/5 py-3">
        {!collapsed && (
          <div className="px-3 mb-4">
            <ModelSelector />
          </div>
        )}
        <button onClick={() => setProfileOpen(!profileOpen)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors outline-none">
          <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-8 h-8 rounded-full shrink-0 object-cover border border-white/10" />
          {!collapsed && (
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-sm font-medium text-white whitespace-nowrap">Rajesh Kayal</span>
              <span className="text-[10px] text-white/50">Free Plan</span>
            </div>
          )}
        </button>

        {profileOpen && !collapsed && (
          <div className="absolute bottom-full left-4 mb-2 w-56 glass-dropdown rounded-xl py-2 z-50 text-white shadow-2xl">
            <div className="px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-t-lg">
              <div className="w-8 h-8 rounded-full bg-white/20 shrink-0"></div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Rajesh Kayal</span>
                <span className="text-xs text-white/50">Go</span>
              </div>
              <svg className="w-4 h-4 ml-auto text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </div>
            <div className="h-px bg-white/10 my-1 mx-2"></div>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> Upgrade plan</button>
            <Link to="/settings" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Settings</Link>
            <div className="h-px bg-white/10 my-1 mx-2"></div>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors" onClick={logout} ><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> Log out</button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
