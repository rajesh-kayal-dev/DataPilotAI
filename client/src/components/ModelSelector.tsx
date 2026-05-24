import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import type { Model } from '../types';

interface GroupedModelsFlat {
  free: Model[];
  paid: Model[];
}

const ModelSelector: React.FC = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<GroupedModelsFlat | null>(null);
  const [currentModelId, setCurrentModelId] = useState<string>('');
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailableModel, setUnavailableModel] = useState<Model | null>(null);
  const [fallbackModel, setFallbackModel] = useState<Model | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const fetchModels = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/models');
      const data = res.data;
      if (data && Array.isArray(data.free)) {
        setModels(data);
      } else {
        setModels({ free: [], paid: [] });
      }
    } catch (err) {
      console.error('Failed to fetch models', err);
    }
  }, []);

  const fetchUserPreference = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/models/user');
      if (res.data) {
        setCurrentModelId(res.data.modelId || '');
        setUserPlan(res.data.plan || 'free');
      }
    } catch (err) {
      console.error('Failed to fetch user preference', err);
    }
  }, []);

  useEffect(() => {
    fetchModels();
    fetchUserPreference();
  }, [fetchModels, fetchUserPreference]);

  const handleSelect = async (model: Model) => {
    if (model.type === 'paid' && userPlan === 'free') {
      setIsOpen(false);
      navigate('/upgrade');
      return;
    }

    if (model.configured === false) {
      setUnavailableModel(model);
      setFallbackModel(getFallbackFor(model) || null);
      setIsOpen(false);
      return;
    }

    await switchToModel(model);
  };

  const switchToModel = async (model: Model) => {
    setLoading(true);
    const toastId = toast.loading(`Switching to ${model.label}...`);
    try {
      await axiosInstance.patch('/models/user', { modelId: model.id });
      setCurrentModelId(model.id);
      setIsOpen(false);
      toast.success(`Model changed to ${model.label}`, { id: toastId });
    } catch (err: any) {
      console.error('Failed to update model preference:', err);
      toast.error('Failed to change model', { id: toastId });
      if (err.response?.status === 402 || err.response?.data?.upgrade) {
        navigate('/upgrade');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFallback = async (fallbackModel: Model) => {
    setUnavailableModel(null);
    await switchToModel(fallbackModel);
  };

  if (!models) return null;

  const safeFree = Array.isArray(models.free) ? models.free : [];
  const safePaid = Array.isArray(models.paid) ? models.paid : [];
  const allModels = [...safeFree, ...safePaid];

  const currentModel = allModels.find(m => m.id === currentModelId);

  const getFallbackFor = (model: Model): Model | undefined => {
    if (model.fallbackId) {
      const fb = allModels.find(m => m.id === model.fallbackId);
      if (fb && fb.configured !== false) return fb;
    }
    // Last resort: first configured model (free or paid)
    return allModels.find(m => m.configured !== false);
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm text-white/80"
          disabled={loading}
        >
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Active Model (Blue)" />
          <span>{currentModel?.label || 'Select Model'}</span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </button>

        {isOpen && (
          <div className="absolute top-full mt-2 left-0 w-72 max-h-[500px] overflow-y-auto bg-[#1A1A24] border border-white/20 rounded-2xl p-2 z-[9999] shadow-2xl">
            <div className="mb-4">
              <h4 className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30 font-bold">Free Models</h4>
              {safeFree.map(m => (
                <ModelItem key={m.id} model={m} isSelected={m.id === currentModelId} isLocked={false} unavailable={m.configured === false} onSelect={() => handleSelect(m)} />
              ))}
            </div>

            {safePaid.length > 0 && (
              <div>
                <h4 className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30 font-bold">Pro Models</h4>
                {safePaid.map(m => (
                  <ModelItem key={m.id} model={m} isSelected={m.id === currentModelId} isLocked={userPlan === 'free'} unavailable={m.configured === false} onSelect={() => handleSelect(m)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unavailable Modal - portaled to body to avoid ancestor transform/backdrop-filter clipping */}
      {unavailableModel && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60" onClick={() => { setUnavailableModel(null); setFallbackModel(null); }}>
          <div className="bg-[#1A1A24] border border-white/10 rounded-3xl p-8 max-w-md w-[90%] mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Model Unavailable</h3>
            <p className="text-white/50 text-center mb-6">
              Sorry, <span className="text-white/80 font-medium">{unavailableModel.label}</span> is currently not available right now.
            </p>
            <div className="flex flex-col gap-3">
              {fallbackModel && (
                <button
                  onClick={() => handleFallback(fallbackModel)}
                  className="w-full py-3 rounded-2xl bg-brand hover:bg-brand/90 text-white text-sm font-bold shadow-lg shadow-brand/20 transition-all"
                >
                  Switch to {fallbackModel.label}
                </button>
              )}
              <button
                onClick={() => { setUnavailableModel(null); setFallbackModel(null); }}
                className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 text-sm font-bold border border-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const ModelItem = ({ model, isSelected, isLocked, unavailable, onSelect }: { model: Model, isSelected: boolean, isLocked: boolean, unavailable: boolean, onSelect: () => void }) => (
  <button
    onClick={onSelect}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
      isSelected ? 'bg-blue-500/10 text-white' : 'hover:bg-white/5 text-white/60'
    }`}
  >
    <div className="flex flex-col items-start text-left">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{model.label}</span>
        {model.badge && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
            model.type === 'free' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
          }`}>
            {model.badge}
          </span>
        )}
      </div>
      <span className="text-[10px] text-white/30">{model.provider}</span>
    </div>

    {unavailable && model.apiProvider === 'freemodel' ? null : unavailable ? (
      <svg className="w-4 h-4 text-yellow-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Not Available"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ) : isLocked ? (
      <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Upgrade Required"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
    ) : isSelected && (
      <svg className="w-5 h-5 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Selected Model (Green Tick)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
    )}
  </button>
);

export default ModelSelector;
