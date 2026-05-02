import React, { useState, useRef, useEffect } from 'react';
import ModelSelector from './ModelSelector';
import { useWorkspace } from '../context/WorkspaceContext';
import { toast } from 'react-hot-toast';

const Navbar: React.FC = () => {
  const { currentChatMessages, currentChatTitle } = useWorkspace();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'pdf' | 'docx' | 'md') => {
    if (!currentChatMessages || currentChatMessages.length === 0) {
      toast.error('No chat content to export');
      return;
    }

    const { exportToPDF, exportToDocx, exportToMarkdown } = await import('../utils/exportUtils');
    
    try {
      if (format === 'pdf') await exportToPDF(currentChatMessages, currentChatTitle);
      else if (format === 'docx') await exportToDocx(currentChatMessages, currentChatTitle);
      else exportToMarkdown(currentChatMessages, currentChatTitle);
      
      toast.success(`Chat exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Export failed');
      console.error(err);
    }
    setIsExportOpen(false);
  };

  return (
    <header className="h-16 px-4 md:px-6 flex items-center justify-between w-full border-b border-white/5 shrink-0 relative z-[9999]">
      <div className="relative">
        <ModelSelector />
      </div>

      <div className="relative" ref={exportRef}>
        <button 
          onClick={() => setIsExportOpen(!isExportOpen)}
          className="flex items-center gap-2 glass-card rounded-full px-4 py-1.5 text-white/90 hover:bg-white/10 transition-colors"
        >
          <span className="text-xs font-medium">Export</span>
          <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
        </button>

        {isExportOpen && (
          <div className="absolute top-full mt-2 right-0 w-48 bg-[#1A1A24] border border-white/10 rounded-2xl py-2 z-[9999] shadow-2xl overflow-hidden">
            <button 
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              PDF Document
            </button>
            <button 
              onClick={() => handleExport('docx')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Microsoft Word
            </button>
            <button 
              onClick={() => handleExport('md')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Markdown File
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
