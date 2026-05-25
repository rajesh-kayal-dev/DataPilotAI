import React, { useState, useRef } from 'react';
import { MessageSquare, Globe, FileText, ShieldCheck, ChevronRight, Check } from 'lucide-react';
import PopoverDropdown from './PopoverDropdown';

export type AgentType = 'chat' | 'research' | 'summarizer' | 'citation';

interface AgentInfo {
  id: AgentType;
  label: string;
  icon: React.ElementType;
  description: string;
}

export const agents: AgentInfo[] = [
  { id: 'chat', label: 'Chat Agent', icon: MessageSquare, description: 'Normal document chat' },
  { id: 'research', label: 'Research Agent', icon: Globe, description: 'Web search mode' },
  { id: 'summarizer', label: 'Summarizer Agent', icon: FileText, description: 'Key points & summaries' },
  { id: 'citation', label: 'Citation Agent', icon: ShieldCheck, description: 'Source verification' },
];

interface AgentMenuProps {
  selected: AgentType;
  onSelect: (agent: AgentType) => void;
}

export default function AgentMenu({ selected, onSelect }: AgentMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<{ top: number; bottom: number; left: number } | null>(null);
  const selectedAgent = agents.find(a => a.id === selected) || agents[0];
  const ActiveIcon = selectedAgent.icon;
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => setIsOpen(false);

  return (
    <PopoverDropdown
      isOpen={isOpen}
      onClose={handleClose}
      hoverable={false}
      triggerRect={isOpen ? triggerRect : null}
      trigger={
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (buttonRef.current) {
              const r = buttonRef.current.getBoundingClientRect();
              setTriggerRect({ top: r.top, bottom: r.bottom, left: r.left });
            }
            setIsOpen(prev => !prev);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 rounded-full transition-all duration-200"
        >
          <ActiveIcon className="w-3.5 h-3.5 text-brand shrink-0" />
          <span className="truncate max-w-[80px]">{selectedAgent.label}</span>
          <ChevronRight className={`w-3 h-3 text-white/40 group-hover:text-white/60 transition-transform duration-200 ${isOpen ? 'rotate-90 text-white/60' : ''}`} />
        </button>
      }
    >
      <div className="flex flex-col gap-1 py-1 text-left">
        <div className="px-3 py-1.5 border-b border-white/5">
          <span className="text-xs font-bold text-white/30 uppercase tracking-wider">Select Agent</span>
        </div>

        <div className="space-y-0.5">
          {agents.map((agent) => {
            const AgentIcon = agent.icon;
            const isSelected = agent.id === selected;

            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => {
                  onSelect(agent.id);
                  handleClose();
                }}
                className={`flex items-center justify-between w-full p-2.5 rounded-xl text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-brand/10 text-brand'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-start gap-2.5 max-w-[200px] truncate">
                  <AgentIcon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-brand' : 'text-white/40'}`} />
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold truncate">{agent.label}</span>
                    <span className={`text-[9px] truncate ${isSelected ? 'text-brand/70' : 'text-white/40'}`}>
                      {agent.description}
                    </span>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-brand shrink-0 ml-1.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </PopoverDropdown>
  );
}
