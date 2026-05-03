import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ModeModal from '../components/ModeModal';
import { useWorkspace } from '../context/WorkspaceContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { ragMode, isModeModalOpen, setIsModeModalOpen } = useWorkspace();

  return (
    <div className="flex w-full h-screen text-sm antialiased font-sans selection:bg-brand selection:text-white relative bg-app overflow-hidden">
      <div className="smokey-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col h-full relative z-10 w-full overflow-hidden">
        <Navbar />
        {children}
      </div>

      <ModeModal 
        isOpen={isModeModalOpen} 
        onClose={() => setIsModeModalOpen(false)} 
        mode={ragMode} 
      />
    </div>
  );
};

export default MainLayout;
