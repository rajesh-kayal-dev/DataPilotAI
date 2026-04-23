import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('api');
  const [openaiKey, setOpenaiKey] = useState('sk-proj-xxxxxxxxxxx');
  const [showKey, setShowKey] = useState(false);

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-white mb-2">Settings</h1>
            <p className="text-[#7A6B8A] text-sm">Manage your API keys, model preferences, and workspace configuration</p>
          </div>

          <div className="section-tabs flex gap-2 flex-wrap mb-6 sticky top-0 z-20 bg-[#0C0812]/85 backdrop-blur-lg py-3 border-b border-white/5">
            {[
              { id: 'api', label: 'API Keys' },
              { id: 'model', label: 'Model' },
              { id: 'rag', label: 'RAG / PDF' },
              { id: 'prefs', label: 'Preferences' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm font-body px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'text-[#C084FC] bg-[rgba(124,79,212,0.15)] border border-[rgba(124,79,212,0.25)]'
                    : 'text-[#6B5F80] hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="card-accent h-0.5 bg-gradient-to-r from-[#7C4FD4] via-[#4F8EF7] to-[#C084FC]"></div>
            
            <div className="p-6 md:p-8">
              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="font-display font-bold text-lg text-white mb-1">API Configuration</h2>
                    <p className="text-xs text-[#7A6B8A]">Connect your AI provider keys - stored locally, never shared</p>
                  </div>

                  <div className="space-y-4">
                    <div className="api-row flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3 w-32 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="text-sm text-white font-medium">OpenAI</span>
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type={showKey ? 'text' : 'password'}
                          value={openaiKey}
                          onChange={(e) => setOpenaiKey(e.target.value)}
                          className="w-full bg-[#0C0812]/60 border border-[#352B44] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#7C4FD4]/55 focus:shadow-[0_0_0_3px_rgba(124,79,212,0.12)]"
                        />
                        <button
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5F80] hover:text-[#9B6FCC]"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            {showKey ? (
                              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                            ) : (
                              <>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                              </>
                            )}
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                        <button className="px-3 py-1.5 rounded-lg bg-[rgba(124,79,212,0.1)] border border-[rgba(124,79,212,0.22)] text-[#9B6FCC] text-xs font-medium hover:bg-[rgba(124,79,212,0.2)] transition-colors">
                          Test
                        </button>
                      </div>
                    </div>

                    <div className="api-row flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3 w-32 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <span className="text-sm text-white font-medium">Claude</span>
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="password"
                          placeholder="sk-ant-..."
                          className="w-full bg-[#0C0812]/60 border border-[#352B44] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#7C4FD4]/55 focus:shadow-[0_0_0_3px_rgba(124,79,212,0.12)] placeholder-[#352B44]"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-[#352B44]"></div>
                        <button className="px-3 py-1.5 rounded-lg bg-[rgba(124,79,212,0.1)] border border-[rgba(124,79,212,0.22)] text-[#9B6FCC] text-xs font-medium hover:bg-[rgba(124,79,212,0.2)] transition-colors">
                          Test
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'model' && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="font-display font-bold text-lg text-white mb-1">Model Configuration</h2>
                    <p className="text-xs text-[#7A6B8A]">Set default model and inference parameters</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[#9C8EAF] mb-2">Default Model</label>
                      <select className="w-full bg-[#0C0812]/60 border border-[#352B44] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#7C4FD4]/55 cursor-pointer appearance-none">
                        <option>GPT-4o</option>
                        <option>GPT-4o mini</option>
                        <option selected>Claude 3.5 Sonnet</option>
                        <option>Gemini Pro 1.5</option>
                        <option>DeepSeek V3</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-medium text-[#9C8EAF]">Temperature</label>
                        <span className="text-sm text-[#9B6FCC] font-display font-bold">0.7</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        defaultValue="0.7"
                        className="w-full h-1 bg-[#352B44] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-[#9B6FCC] [&::-webkit-slider-thumb]:to-[#4F8EF7]"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-[#352B44]">0</span>
                        <span className="text-[10px] text-[#352B44]">1</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#9C8EAF] mb-2">Max Tokens</label>
                      <input
                        type="number"
                        defaultValue="4096"
                        min="256"
                        max="32000"
                        step="256"
                        className="w-32 bg-[#0C0812]/60 border border-[#352B44] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#7C4FD4]/55"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'rag' && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="font-display font-bold text-lg text-white mb-1">RAG / PDF Configuration</h2>
                    <p className="text-xs text-[#7A6B8A]">Tune chunking, embedding, and retrieval settings</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-medium text-[#9C8EAF]">Chunk Size</label>
                        <span className="text-sm text-[#9B6FCC] font-display font-bold">512</span>
                      </div>
                      <input
                        type="range"
                        min="128"
                        max="2048"
                        step="128"
                        defaultValue="512"
                        className="w-full h-1 bg-[#352B44] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-[#9B6FCC] [&::-webkit-slider-thumb]:to-[#4F8EF7]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-medium text-[#9C8EAF]">Top-K Results</label>
                        <span className="text-sm text-[#9B6FCC] font-display font-bold">5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        defaultValue="5"
                        className="w-full h-1 bg-[#352B44] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-[#9B6FCC] [&::-webkit-slider-thumb]:to-[#4F8EF7]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#9C8EAF] mb-2">Embedding Model</label>
                      <select className="w-full bg-[#0C0812]/60 border border-[#352B44] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#7C4FD4]/55 cursor-pointer">
                        <option selected>text-embedding-3-small (OpenAI)</option>
                        <option>text-embedding-3-large (OpenAI)</option>
                        <option>text-embedding-ada-002 (OpenAI)</option>
                        <option>all-MiniLM-L6-v2 (Open Source)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'prefs' && (
                <div className="space-y-4">
                  <div className="mb-6">
                    <h2 className="font-display font-bold text-lg text-white mb-1">Preferences</h2>
                    <p className="text-xs text-[#7A6B8A]">Customize your workspace behaviour</p>
                  </div>

                  {[
                    { name: 'Dark Mode', desc: 'Always-on dark theme for the interface', checked: true },
                    { name: 'Auto-save Chats', desc: 'Automatically save all conversations to history', checked: true },
                    { name: 'Streaming Responses', desc: 'Display AI responses word-by-word as they generate', checked: true },
                    { name: 'Show Source Citations', desc: 'Display document source and page references in answers', checked: true },
                    { name: 'Compact UI', desc: 'Reduce spacing for a denser information layout', checked: false },
                  ].map((toggle) => (
                    <div key={toggle.name} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                      <div>
                        <div className="text-sm text-white font-medium">{toggle.name}</div>
                        <div className="text-xs text-[#6B5F80] mt-0.5">{toggle.desc}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={toggle.checked} className="sr-only peer" />
                        <div className="w-11 h-6 bg-[#352B44] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#7A6B8A] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-br peer-checked:from-[#7C4FD4] peer-checked:to-[#4F8EF7] peer-checked:after:bg-white"></div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="fixed bottom-0 right-0 left-64 md:left-72 py-3.5 px-8 bg-[#07050D]/90 backdrop-blur-lg border-t border-[rgba(124,79,212,0.13)] flex items-center justify-between z-30">
            <span className="text-xs text-[#352B44] font-body">Changes are saved to your browser</span>
            <div className="flex gap-2.5">
              <button className="px-4 py-2 rounded-lg border border-[rgba(124,79,212,0.18)] text-[#6B5F80] text-sm hover:border-[rgba(124,79,212,0.38)] hover:text-white transition-colors">
                Reset
              </button>
              <button className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#6B3FA0] to-[#4F72E0] text-white text-sm font-display font-bold shadow-[0_0_22px_rgba(107,63,160,0.35)] hover:shadow-[0_0_34px_rgba(107,63,160,0.5)] hover:-translate-y-px transition-all">
                Save Settings
              </button>
            </div>
          </div>
          <div className="h-20"></div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
