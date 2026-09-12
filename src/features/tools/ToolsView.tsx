import React, { useState } from 'react';
import { Globe, Code, Calculator, FileText, Image as ImageIcon, Search, Check, AlertCircle } from 'lucide-react';

export function ToolsView() {
  const [query, setQuery] = useState('');
  const [toolStates, setToolStates] = useState<Record<string, boolean>>({
    web: true,
    code: true,
    math: true,
    file: true,
    image: false,
  });

  const tools = [
    { id: 'web', name: 'Web Search & Citations', icon: Globe, description: 'Search the internet and extract verified source citations.', status: 'Active' },
    { id: 'code', name: 'Code Sandbox & HTML Renderer', icon: Code, description: 'Execute JS code and render interactive HTML/SVG artifacts.', status: 'Active' },
    { id: 'math', name: 'Math & Symbolic Solver', icon: Calculator, description: 'Step-by-step LaTeX formula evaluation and calculation.', status: 'Active' },
    { id: 'file', name: 'File & Document Analysis', icon: FileText, description: 'Parse uploaded TXT, MD, JSON, CSV, PDF, and image files.', status: 'Active' },
    { id: 'image', name: 'Image Diffusion Generation', icon: ImageIcon, description: 'Generate AI images using connected image models.', status: toolStates.image ? 'Active' : 'Disabled' },
  ];

  const filteredTools = tools.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));

  const toggleTool = (id: string) => {
    setToolStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-12 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground tracking-tight mb-2">Tools & Integrations</h1>
          <p className="text-sm text-muted-foreground">Manage and configure active tool engines for AI responses.</p>
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

      <div className="flex flex-col border border-border/40 rounded-2xl overflow-hidden bg-card/30">
        <div className="flex items-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30 bg-muted/20">
          <div className="flex-1">Tool Capability</div>
          <div className="w-44 text-right">Status & Toggle</div>
        </div>
        {filteredTools.map(tool => {
          const isEnabled = toolStates[tool.id];
          return (
            <div key={tool.id} className="flex items-center px-6 py-4 border-b border-border/30 last:border-b-0 hover:bg-surface-hover transition-colors">
              <div className="flex-1 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-background border border-border/40 text-primary shadow-sm">
                  <tool.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-foreground">{tool.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                </div>
              </div>
              <div className="w-44 flex justify-end items-center gap-3">
                <span className={`text-xs font-medium ${isEnabled ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={() => toggleTool(tool.id)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${isEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <div className={`w-5 h-5 bg-background rounded-full transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'} shadow-sm`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
