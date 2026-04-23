import React, { useState } from 'react';

interface NavbarProps {
  onModelSelect?: (model: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onModelSelect }) => {
  const [modelOpen, setModelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('GPT-4');

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    setModelOpen(false);
    onModelSelect?.(model);
  };

  return (
    <header className="h-16 px-4 md:px-6 flex items-center justify-between w-full border-b border-white/5 shrink-0">
      <div className="relative">
        <button onClick={() => setModelOpen(!modelOpen)} className="flex items-center gap-2 glass-card rounded-full px-4 py-1.5 text-white/90 hover:bg-white/10">
          <span className="text-xs font-medium">{selectedModel}</span>
          <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        {modelOpen && (
          <div className="absolute top-full left-0 mt-2 w-36 glass-dropdown rounded-lg py-1 z-50">
            <button onClick={() => handleModelSelect('GPT-4')} className="w-full text-left px-4 py-2 text-xs text-white/80 hover:bg-white/10">GPT-4</button>
            <button onClick={() => handleModelSelect('Claude')} className="w-full text-left px-4 py-2 text-xs text-white/80 hover:bg-white/10">Claude</button>
            <button onClick={() => handleModelSelect('Gemini')} className="w-full text-left px-4 py-2 text-xs text-white/80 hover:bg-white/10">Gemini</button>
            <button onClick={() => handleModelSelect('DeepSeek')} className="w-full text-left px-4 py-2 text-xs text-white/80 hover:bg-white/10">DeepSeek</button>
          </div>
        )}
      </div>
      <button className="flex items-center gap-2 glass-card rounded-full px-4 py-1.5 text-white/90 hover:bg-white/10 transition-colors">
        <span className="text-xs font-medium">Export</span>
        <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
      </button>
    </header>
  );
};

export default Navbar;
