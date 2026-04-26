import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Model {
  id: string;
  label: string;
  provider: string;
  type: 'free' | 'paid';
  tier: string;
  tags: string[];
  badge?: string;
}

interface GroupedModels {
  champions: Model[];
  free: {
    top: Model[];
    specialized: Model[];
    experimental: Model[];
  };
  paid: {
    budget: Model[];
    mid: Model[];
    premium: Model[];
  };
}

const ModelSelector: React.FC = () => {
  const [models, setModels] = useState<GroupedModels | null>(null);
  const [currentModelId, setCurrentModelId] = useState<string>('');
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModels();
    fetchUserPreference();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/models');
      setModels(res.data);
    } catch (err) {
      console.error('Failed to fetch models');
    }
  };

  const fetchUserPreference = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/models/user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCurrentModelId(res.data.modelId);
      setUserPlan(res.data.plan);
    } catch (err) {
      console.error('Failed to fetch user preference');
    }
  };

  const handleSelect = async (model: Model) => {
    if (model.type === 'paid' && userPlan === 'free') {
      window.location.href = '/pricing'; // Redirect to payment
      return;
    }

    setLoading(true);
    try {
      await axios.patch('http://localhost:5000/api/models/user', 
        { modelId: model.id },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      setCurrentModelId(model.id);
      setIsOpen(false);
    } catch (err: any) {
      if (err.response?.data?.upgrade) {
        window.location.href = '/pricing';
      }
    } finally {
      setLoading(false);
    }
  };

  if (!models) return null;

  const currentModel = [...models.champions, ...models.free.top, ...models.free.specialized, ...models.free.experimental, ...models.paid.budget, ...models.paid.mid, ...models.paid.premium].find(m => m.id === currentModelId);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm text-white/80"
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>{currentModel?.label || 'Select Model'}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full mb-3 left-0 w-80 max-h-[500px] overflow-y-auto bg-[#0F0F12] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
          
          {/* Champions Section */}
          <div className="mb-4">
            <h4 className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30 font-bold">Champions</h4>
            {models.champions.map(m => (
              <ModelItem key={m.id} model={m} isSelected={m.id === currentModelId} isLocked={m.type === 'paid' && userPlan === 'free'} onSelect={() => handleSelect(m)} />
            ))}
          </div>

          {/* Free Models */}
          <div className="mb-4">
            <h4 className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30 font-bold">Free Models</h4>
            {[...models.free.top, ...models.free.specialized].map(m => (
              <ModelItem key={m.id} model={m} isSelected={m.id === currentModelId} isLocked={false} onSelect={() => handleSelect(m)} />
            ))}
          </div>

          {/* Paid Models */}
          <div>
            <h4 className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30 font-bold">Paid Models</h4>
            {[...models.paid.mid, ...models.paid.premium].map(m => (
              <ModelItem key={m.id} model={m} isSelected={m.id === currentModelId} isLocked={userPlan === 'free'} onSelect={() => handleSelect(m)} />
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

const ModelItem = ({ model, isSelected, isLocked, onSelect }: { model: Model, isSelected: boolean, isLocked: boolean, onSelect: () => void }) => (
  <button
    onClick={onSelect}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
      isSelected ? 'bg-brand/20 text-white' : 'hover:bg-white/5 text-white/60'
    }`}
  >
    <div className="flex flex-col items-start text-left">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{model.label}</span>
        {model.badge && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
            model.type === 'free' ? 'bg-green-500/10 text-green-500' : 'bg-purple-500/10 text-purple-500'
          }`}>
            {model.badge}
          </span>
        )}
      </div>
      <span className="text-[10px] text-white/30">{model.provider}</span>
    </div>

    {isLocked ? (
      <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
    ) : isSelected && (
      <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
    )}
  </button>
);

export default ModelSelector;
