import React, { useState } from 'react';
import { Blocks, Search, Code, Calculator, FileText, Globe, Image as ImageIcon, GraduationCap } from 'lucide-react';

const REAL_TOOLS = [
  { id: 'web', name: 'Web Search', icon: Globe, description: 'Search the internet for real-time information.', enabled: false, reason: 'Provider API key required' },
  { id: 'code', name: 'Code Interpreter', icon: Code, description: 'Execute Python code in a secure sandbox.', enabled: false, reason: 'Sandbox environment offline' },
  { id: 'math', name: 'Math Solver', icon: Calculator, description: 'Step-by-step mathematical reasoning.', enabled: false, reason: 'Requires Math mode support' },
  { id: 'file', name: 'File Analysis', icon: FileText, description: 'Read and extract data from documents.', enabled: false, reason: 'Parser service offline' },
  { id: 'image', name: 'Image Generation', icon: ImageIcon, description: 'Create images using diffusion models.', enabled: false, reason: 'No image model connected' },
];

export function ToolsView() {
  const [query, setQuery] = useState('');

  const filteredTools = REAL_TOOLS.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-12 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground tracking-tight mb-2">Tools</h1>
          <p className="text-sm text-muted-foreground">Extend the assistant's capabilities with external actions.</p>
        </div>
      </div>

      <div className="mb-8 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input 
          className="w-full h-11 bg-transparent border border-border/40 rounded-full pl-11 pr-4 outline-none focus:border-border/80 transition-all text-[15px] placeholder:text-muted-foreground/50"
          placeholder="Search tools..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/30">
          <div className="flex-1">Tool</div>
          <div className="w-48 text-right">Status</div>
        </div>
        {filteredTools.map(tool => (
          <div key={tool.id} className="flex items-center px-4 py-4 border-b border-border/30 hover:bg-surface-hover transition-colors">
            <div className="flex-1 flex items-center gap-4">
              <tool.icon className="w-4 h-4 text-muted-foreground/70" />
              <div>
                <h3 className="font-medium text-[15px] text-foreground">{tool.name}</h3>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
            </div>
            <div className="w-48 flex justify-end items-center gap-3">
              <span className="text-[11px] font-medium text-muted-foreground/80">{tool.reason}</span>
              <button
                className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 opacity-50 cursor-not-allowed bg-muted-foreground/30`}
                disabled
              >
                <div className={`w-4 h-4 bg-background rounded-full transition-transform translate-x-0`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
