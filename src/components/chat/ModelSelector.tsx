import React from 'react';
import { useAppStore } from '@/lib/store';
import { Check, ChevronDown, Sparkle } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';

export function ModelSelector({ 
  value, 
  onChange 
}: { 
  value?: string; 
  onChange?: (val: string) => void;
} = {}) {
  const { models, currentModel: storeCurrentModel, setCurrentModel: storeSetCurrentModel } = useAppStore();

  const currentModel = value !== undefined ? value : storeCurrentModel;
  const setCurrentModel = onChange !== undefined ? onChange : storeSetCurrentModel;

  const selectedModel = models.find(m => m.id === currentModel) || models[0];

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors bg-surface shadow-sm border border-border/40 text-foreground hover:bg-surface-hover">
          <Sparkle className="w-3.5 h-3.5 fill-current" />
          <span>{selectedModel?.name || 'Select Model'}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content 
          className="z-50 w-64 bg-surface border border-border/60 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 mt-1"
          align="start"
          sideOffset={4}
        >
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30 bg-surface/50">
            Available Models
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {models.length === 0 ? (
              <div className="px-4 py-4 text-xs text-muted-foreground text-center">
                No models available. Connect a provider in settings.
              </div>
            ) : (
              models.map(model => (
                <button
                  key={model.id}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${currentModel === model.id ? 'bg-surface-selected text-foreground font-medium' : 'text-foreground hover:bg-surface-hover'}`}
                  onClick={() => setCurrentModel(model.id)}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span>{model.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{useAppStore.getState().providers.find(p => p.id === model.providerId)?.name || 'Unknown'}</span>
                  </div>
                  {currentModel === model.id && <Check className="w-4 h-4 text-foreground" />}
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
