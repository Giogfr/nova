import React, { useState } from 'react';
import { UserCircle, Plus, Search, MoreHorizontal, Bot } from 'lucide-react';

export function AgentsView() {
  const [agents] = useState<any[]>([]); // To be wired to real state

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-12 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground tracking-tight mb-2">Agents</h1>
          <p className="text-sm text-muted-foreground">Custom AI personas with specific instructions and tools.</p>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-full bg-surface-hover hover:bg-surface-selected text-sm font-medium transition-colors border border-border/60 text-foreground">
          <Plus className="w-4 h-4" /> Create Agent
        </button>
      </div>

      <div className="mb-8 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input 
          className="w-full h-11 bg-transparent border border-border/40 rounded-full pl-11 pr-4 outline-none focus:border-border/80 transition-all text-[15px] placeholder:text-muted-foreground/50"
          placeholder="Search agents..."
        />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/30">
          <div className="flex-1">Agent</div>
          <div className="w-48 text-right hidden sm:block">Model</div>
          <div className="w-12"></div>
        </div>
        
        {agents.length === 0 ? (
          <div className="py-20 text-center">
            <Bot className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-[15px] font-medium text-foreground mb-1">No agents found</h3>
            <p className="text-sm text-muted-foreground">Create custom AI personas tailored to your workflow.</p>
          </div>
        ) : (
          agents.map(agent => (
            <div key={agent.id} className="group flex items-center px-4 py-4 border-b border-border/30 hover:bg-surface-hover transition-colors cursor-pointer">
              <div className="flex-1 flex items-center gap-4">
                <Bot className="w-4 h-4 text-muted-foreground/70" />
                <div>
                  <h3 className="font-medium text-[15px] text-foreground">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground truncate max-w-[300px]">{agent.description}</p>
                </div>
              </div>
              <div className="w-48 text-right text-sm text-muted-foreground hidden sm:block">{agent.model}</div>
              <div className="w-12 flex justify-end">
                <button className="p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-selected hover:text-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
