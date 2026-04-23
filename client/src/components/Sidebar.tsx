import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { logout } from '../utils/auth';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [dataFilesOpen, setDataFilesOpen] = useState(true);
  const [chatMenuOpen, setChatMenuOpen] = useState<number | null>(null);

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
                <div className="w-5 h-5 rounded bg-brand/20 text-brand flex items-center justify-center text-[10px] font-bold shrink-0">D</div>
                {!collapsed && <span className="font-medium text-[13px] text-white/90 whitespace-nowrap">Default Workspace</span>}
              </div>
              {!collapsed && <svg className="w-3.5 h-3.5 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>}
            </button>
            {workspaceOpen && !collapsed && (
              <div className="absolute top-full left-0 w-full mt-1 glass-dropdown rounded-lg py-1 z-50">
                <button onClick={() => setWorkspaceOpen(false)} className="w-full text-left px-3 py-2 text-xs text-brand bg-white/5 flex items-center gap-2"><div className="w-4 h-4 rounded bg-brand/20 flex items-center justify-center font-bold">D</div> Default Workspace</button>
                <button onClick={() => setWorkspaceOpen(false)} className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10 flex items-center gap-2"><div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center font-bold">F</div> Finance Team</button>
                <Link to="/workshop-setup" className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10 flex items-center gap-2 border-t border-white/10 mt-1 pt-2">
                  <svg className="w-4 h-4 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  Add new workspace
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="px-3">
          <Link to="/chat" className="w-full bg-white/10 hover:bg-white/15 border border-white/5 transition-colors text-white py-2 px-4 rounded-xl flex items-center gap-3 text-sm font-medium">
            <svg className="w-4 h-4 text-white/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            {!collapsed && <span className="whitespace-nowrap">New Chat</span>}
          </Link>
        </div>

        <div className="px-3">
          <button onClick={() => setProjectsOpen(!projectsOpen)} className={`w-full flex items-center justify-between mb-2 px-1 ${collapsed ? 'hidden' : ''}`}>
            <h3 className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Projects</h3>
            <svg className={`w-3 h-3 text-white/40 transition-transform ${projectsOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>
          {projectsOpen && !collapsed && (
            <ul className="space-y-0.5 text-white/70">
              <li><Link to="/create-project" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 hover:text-white transition-colors text-[13px]"><svg className="w-4 h-4 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg> <span className="whitespace-nowrap">Create New Project</span></Link></li>
              <li><Link to="#" className="flex items-center gap-3 p-2 rounded-lg bg-brand/10 text-white border border-brand/20 transition-colors text-[13px]"><svg className="w-4 h-4 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg> <span className="whitespace-nowrap">Q3 Financials</span></Link></li>
              <li><Link to="#" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 hover:text-white transition-colors text-[13px]"><svg className="w-4 h-4 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg> <span className="whitespace-nowrap">Legal Contracts</span></Link></li>
            </ul>
          )}
        </div>

        <div className="px-3">
          <button onClick={() => setDataFilesOpen(!dataFilesOpen)} className={`w-full flex items-center justify-between mb-2 px-1 ${collapsed ? 'hidden' : ''}`}>
            <h3 className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Data & Files</h3>
            <svg className={`w-3 h-3 text-white/40 transition-transform ${dataFilesOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>
          {dataFilesOpen && !collapsed && (
            <ul className="space-y-1 text-white/70">
              <li><Link to="#" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-[13px]"><svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> <span className="whitespace-nowrap">All Documents</span></Link></li>
              <li><Link to="/workshop-setup" className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand/10 text-brand text-[13px]"><svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg> <span className="whitespace-nowrap">Upload Document</span></Link></li>
            </ul>
          )}
        </div>

        <div className="px-3">
          <button onClick={() => setChatsOpen(!chatsOpen)} className={`w-full flex items-center justify-between mb-2 px-1 ${collapsed ? 'hidden' : ''}`}>
            <h3 className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Chats</h3>
            <svg className={`w-3 h-3 text-white/40 transition-transform ${chatsOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>
          {chatsOpen && !collapsed && (
            <div className="space-y-1">
              <div className="text-[10px] text-white/30 px-1 mb-1">Recents</div>
              {recentChats.map((chat) => (
                <div key={chat.id} className="relative group">
                  <Link to={`/chat/${chat.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors text-[13px] text-white/70 hover:text-white">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {chat.pinned && <svg className="w-3 h-3 text-white/30 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5.818 10.274zM14.182 10.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174l-.818-2.552z" /></svg>}
                      <span className="truncate">{chat.title}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.preventDefault(); setChatMenuOpen(chatMenuOpen === chat.id ? null : chat.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    </button>
                  </Link>
                  {chatMenuOpen === chat.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 glass-dropdown rounded-lg py-1 z-50 shadow-xl">
                      <button className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.366A3 3 0 019 12c0-.482.114-.938.316-1.342m0 2.684a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
                        Share
                      </button>
                      <button className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Start a group chat
                      </button>
                      <button className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Rename
                      </button>
                      <div className="h-px bg-white/10 my-1 mx-2"></div>
                      <button className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        Unpin chat
                      </button>
                      <button className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                        Archive
                      </button>
                      <div className="h-px bg-white/10 my-1 mx-2"></div>
                      <button className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/10 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-auto border-t border-white/5 py-3">
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
              <svg className="w-4 h-4 ml-auto text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </div>
            <div className="h-px bg-white/10 my-1 mx-2"></div>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg> Upgrade plan</button>
            <Link to="/settings" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> Settings</Link>
            <div className="h-px bg-white/10 my-1 mx-2"></div>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors" onClick={logout} ><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg> Log out</button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
