import React, { useState } from 'react';
import { X, User, Cpu, Shield, Key, Bell, CreditCard, ChevronRight, Settings, Check, RefreshCw, AlertCircle, Laptop, Sliders } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { testProviderConnection, fetchRemoteModels } from '@/lib/ai/gateway';

export function SettingsModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('providers');
  const { providers, updateProvider, setModels, models } = useAppStore();
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({});

  const [userName, setUserName] = useState('Developer User');
  const [customInstructions, setCustomInstructions] = useState('Respond clearly, accurately, and concisely. Prefer modern TypeScript and formatted Markdown.');

  if (!open) return null;

  const TABS = [
    { id: 'general', label: 'General & Personalization', icon: User },
    { id: 'providers', label: 'Cloud API Providers', icon: Cpu },
    { id: 'local', label: 'Local Models & Ollama', icon: Laptop },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  ];

  const handleTestConnection = async (providerId: string) => {
    const p = providers.find(item => item.id === providerId);
    if (!p) return;

    setTestingId(providerId);
    setTestResults(prev => ({ ...prev, [providerId]: undefined as any }));

    const res = await testProviderConnection(p);
    setTestingId(null);
    setTestResults(prev => ({ ...prev, [providerId]: res }));

    if (res.success) {
      updateProvider(providerId, { status: 'connected' });
      // Refresh models
      const remote = await fetchRemoteModels(p);
      if (remote.length > 0) {
        const otherModels = models.filter(m => m.providerId !== providerId);
        setModels([...otherModels, ...remote]);
      }
    } else {
      updateProvider(providerId, { status: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-surface border border-border/60 rounded-2xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh]">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-background/50 border-r border-border/40 p-4 flex flex-col gap-1">
          <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wider">Settings</div>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${activeTab === tab.id ? 'bg-surface-selected text-foreground font-semibold shadow-sm border border-border/40' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'}`}
            >
              <tab.icon className="w-4 h-4 text-primary" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex flex-col min-h-0 bg-surface">
          <div className="flex items-center justify-between px-8 py-5 border-b border-border/30">
            <h2 className="text-xl font-serif font-semibold text-foreground capitalize">{TABS.find(t => t.id === activeTab)?.label}</h2>
            <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-8 overflow-y-auto flex-1">
            {activeTab === 'general' && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-2 uppercase tracking-wider">User Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full h-10 bg-background border border-border/40 rounded-xl px-3.5 text-sm text-foreground outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-2 uppercase tracking-wider">Global Custom Instructions</label>
                  <textarea
                    rows={4}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full bg-background border border-border/40 rounded-xl p-3.5 text-sm text-foreground outline-none resize-none focus:border-primary/50 leading-relaxed"
                    placeholder="Provide system guidelines that Nova should adhere to in all conversations..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'providers' && (
              <div className="max-w-2xl space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Configure Cloud API providers (OpenAI, Anthropic, Gemini, OpenRouter, DeepSeek, etc.). API keys are kept strictly in your local session.
                </p>

                {providers.filter(p => p.type !== 'ollama').map(provider => {
                  const result = testResults[provider.id];
                  const isLoading = testingId === provider.id;

                  return (
                    <div key={provider.id} className="p-5 border border-border/40 rounded-xl bg-background/50 hover:border-border/60 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${provider.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : provider.status === 'error' ? 'bg-rose-500' : 'bg-muted-foreground/30'}`} />
                          <h3 className="font-semibold text-foreground text-[15px]">{provider.name}</h3>
                        </div>
                        <button
                          onClick={() => handleTestConnection(provider.id)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/50 hover:bg-muted/50 transition-colors text-foreground disabled:opacity-50"
                        >
                          {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          <span>Test Connection</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(provider.type === 'custom' || provider.type === 'lmstudio') && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Base Endpoint URL</label>
                            <input 
                              type="text" 
                              value={provider.baseUrl || ''} 
                              onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                              className="w-full h-9 bg-surface border border-border/40 rounded-lg px-3 text-xs text-foreground outline-none focus:border-primary/50"
                              placeholder="https://api.openai.com/v1"
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-muted-foreground">API Key</label>
                          <input
                            type="password"
                            value={provider.apiKey || ''}
                            onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value, apiKeyStored: !!e.target.value })}
                            className="w-full h-9 bg-surface border border-border/40 rounded-lg px-3 text-xs text-foreground outline-none focus:border-primary/50"
                            placeholder={provider.apiKeyStored ? '••••••••••••••••' : `Enter ${provider.name} API Key`}
                          />
                        </div>
                        {result && (
                          <div className={`text-xs px-3 py-2 rounded-lg ${result.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {result.success ? 'Connection verified successfully!' : `Connection test failed: ${result.error}`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'local' && (
              <div className="max-w-2xl space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Discover local AI engines running on your machine (Ollama, LM Studio, llama.cpp, vLLM).
                </p>
                {providers.filter(p => p.type === 'ollama').map(provider => (
                  <div key={provider.id} className="p-5 border border-border/40 rounded-xl bg-background/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Laptop className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm text-foreground">{provider.name}</span>
                      </div>
                      <button
                        onClick={() => handleTestConnection(provider.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      >
                        Scan Local Host
                      </button>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Local Host Endpoint</label>
                      <input
                        type="text"
                        value={provider.baseUrl || 'http://localhost:11434'}
                        onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                        className="w-full h-9 bg-surface border border-border/40 rounded-lg px-3 text-xs text-foreground outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="max-w-2xl space-y-4">
                <div className="p-5 border border-border/40 rounded-xl bg-background/50 space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">Local-First Security</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Nova routes your requests through secure direct streaming proxies without retaining prompt records or selling user telemetry.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
