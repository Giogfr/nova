import React, { useState } from 'react';
import { Search, Star, Cloud, MonitorSmartphone, Plus, MoreHorizontal, Cpu } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function ModelsView() {
  const { models, providers } = useAppStore();
  const [query, setQuery] = useState('');

  const filteredModels = models.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-12 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground tracking-tight mb-2">Models</h1>
          <p className="text-sm text-muted-foreground">Manage available AI models.</p>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-full bg-surface-hover hover:bg-surface-selected text-sm font-medium transition-colors border border-border/60">
          <Plus className="w-4 h-4" /> Add Model
        </button>
      </div>

      <div className="mb-8 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input 
          className="w-full h-11 bg-transparent border border-border/40 rounded-full pl-11 pr-4 outline-none focus:border-border/80 transition-all text-[15px] placeholder:text-muted-foreground/50"
          placeholder="Search models..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/30">
          <div className="w-8"></div>
          <div className="flex-1">Model</div>
          <div className="w-32 hidden sm:block">Provider</div>
          <div className="w-48 text-right hidden md:block">Capabilities</div>
          <div className="w-12"></div>
        </div>
        
        {filteredModels.length === 0 ? (
          <div className="py-20 text-center">
            <Cpu className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-[15px] font-medium text-foreground mb-1">No models found</h3>
            <p className="text-sm text-muted-foreground">Connect a provider in Settings to see available models.</p>
          </div>
        ) : (
          filteredModels.map(model => {
            const provider = providers.find(p => p.id === model.providerId);
            const isLocal = provider?.type === 'ollama' || provider?.type === 'lmstudio';
            return (
              <div key={model.id} className="group flex items-center px-4 py-4 border-b border-border/30 hover:bg-surface-hover transition-colors cursor-pointer">
                <div className="w-8">
                  <button className="p-1 rounded-full transition-colors text-transparent group-hover:text-muted-foreground hover:text-foreground">
                    <Star className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  {!isLocal ? <Cloud className="w-4 h-4 text-muted-foreground/50" /> : <MonitorSmartphone className="w-4 h-4 text-muted-foreground/50" />}
                  <div>
                    <h3 className="font-medium text-[15px] text-foreground flex items-center gap-2">
                      {model.name}
                    </h3>
                  </div>
                </div>
                <div className="w-32 text-sm text-muted-foreground hidden sm:block">{provider?.name || 'Unknown'}</div>
                <div className="w-48 flex justify-end gap-1 hidden md:flex">
                  {model.capabilities?.map(cap => (
                    <span key={cap} className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground/70">
                      {cap}
                    </span>
                  ))}
                </div>
                <div className="w-12 flex justify-end">
                  <button className="p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-selected hover:text-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
