import React, { useState } from 'react';
import { LayoutPanelLeft, Play, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ModelSelector } from '@/components/chat/ModelSelector';

export function ModelCompareView() {
  const [prompt, setPrompt] = useState('');
  const { models } = useAppStore();
  const [model1, setModel1] = useState(models[0]?.id || '');
  const [model2, setModel2] = useState(models.length > 1 ? models[1]?.id : models[0]?.id || '');

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300">
      <div className="px-6 py-6 border-b border-border/40 flex items-center justify-between bg-background/50 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-serif text-foreground tracking-tight">Compare Models</h1>
          <p className="text-sm text-muted-foreground mt-1">Run the same prompt across multiple models simultaneously.</p>
        </div>
        <button 
          className="flex items-center gap-2 h-9 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
          disabled={!prompt.trim() || models.length === 0}
        >
          <Play className="w-4 h-4 fill-current" /> Run Comparison
        </button>
      </div>

      <div className="flex-1 flex flex-col p-6 overflow-hidden max-w-[1600px] mx-auto w-full">
        {/* Prompt Input */}
        <div className="w-full bg-card rounded-2xl border border-border/60 shadow-sm p-2 mb-6">
          <div className="px-4 pt-3 pb-4">
            <textarea 
              className="w-full bg-transparent text-[15px] outline-none resize-none placeholder:text-muted-foreground/50 text-foreground"
              rows={2}
              placeholder="Enter a prompt to compare (e.g., 'Write a quicksort in Rust' or 'Explain quantum entanglement')..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        </div>

        {/* Model Columns */}
        {models.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <LayoutPanelLeft className="w-10 h-10 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No Models Available</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Connect a provider in Settings to compare model outputs.</p>
          </div>
        ) : (
          <div className="flex-1 flex gap-4 min-h-0">
            <div className="flex-1 flex flex-col bg-surface border border-border/40 rounded-2xl overflow-hidden">
              <div className="h-12 border-b border-border/40 px-4 flex items-center justify-between bg-surface-hover/30">
                <ModelSelector value={model1} onChange={setModel1} />
                <span className="text-xs text-muted-foreground">Model A</span>
              </div>
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
                <AlertCircle className="w-6 h-6 mb-2 opacity-20" />
                <p className="text-sm">Awaiting prompt execution...</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-surface border border-border/40 rounded-2xl overflow-hidden">
              <div className="h-12 border-b border-border/40 px-4 flex items-center justify-between bg-surface-hover/30">
                <ModelSelector value={model2} onChange={setModel2} />
                <span className="text-xs text-muted-foreground">Model B</span>
              </div>
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
                <AlertCircle className="w-6 h-6 mb-2 opacity-20" />
                <p className="text-sm">Awaiting prompt execution...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
