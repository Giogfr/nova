import React, { useState } from 'react';
import { X, User, Cpu, Shield, Key, Bell, CreditCard, ChevronRight, Settings } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

export function SettingsModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('providers');
  const { providers, updateProvider } = useAppStore();

  if (!open) return null;

  const TABS = [
    { id: 'general', label: 'General', icon: User },
    { id: 'providers', label: 'Providers', icon: Cpu },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-surface border border-border/60 rounded-2xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh]">
        {/* Sidebar */}
        <div className="w-64 bg-background/50 border-r border-border/40 p-4 flex flex-col gap-1">
          <div className="px-3 py-2 text-sm font-semibold text-muted-foreground mb-2 tracking-tight">Settings</div>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id ? 'bg-surface-selected text-foreground font-medium shadow-sm border border-border/30' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-surface">
          <div className="flex items-center justify-between px-8 py-5 border-b border-border/30">
            <h2 className="text-xl font-serif text-foreground capitalize">{activeTab}</h2>
            <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-surface-hover text-muted-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-8 overflow-y-auto">
            {activeTab === 'providers' && (
              <div className="max-w-2xl">
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                  Configure connections to AI model providers. API keys are stored locally in your browser and never sent to our servers.
                </p>
                <div className="space-y-4">
                  {providers.map(provider => (
                    <div key={provider.id} className="p-5 border border-border/40 rounded-xl bg-background hover:border-border/60 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${provider.status === 'connected' ? 'bg-emerald-500' : provider.status === 'offline' ? 'bg-destructive' : 'bg-muted-foreground/30'}`} />
                          <h3 className="font-medium text-foreground text-[15px]">{provider.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">{provider.status}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {(provider.type === 'ollama' || provider.type === 'lmstudio' || provider.type === 'custom') && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Base URL</label>
                            <input 
                              type="text" 
                              value={provider.baseUrl || ''} 
                              onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                              className="w-full h-9 bg-surface-hover border border-border/40 rounded-md px-3 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                              placeholder="http://localhost:11434"
                            />
                          </div>
                        )}
                        {(provider.type !== 'ollama' && provider.type !== 'lmstudio') && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-muted-foreground">API Key</label>
                            <div className="flex gap-2">
                              <input 
                                type="password" 
                                value={provider.apiKey || ''}
                                onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value, apiKeyStored: !!e.target.value })}
                                className="flex-1 h-9 bg-surface-hover border border-border/40 rounded-md px-3 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-muted-foreground/50"
                                placeholder={provider.apiKeyStored ? '••••••••••••••••' : `Enter ${provider.name} API Key`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab !== 'providers' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 bg-surface-hover border border-border/40 rounded-2xl flex items-center justify-center mb-4">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">Configuration</h3>
                <p className="text-sm text-muted-foreground max-w-sm">This section is currently under development.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
