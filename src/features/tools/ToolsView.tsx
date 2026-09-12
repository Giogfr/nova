import React, { useState, useEffect } from 'react';
import { Globe, Code, Calculator, FileText, Image as ImageIcon, Search } from 'lucide-react';

interface ToolStatus {
  id: string;
  name: string;
  icon: any;
  description: string;
  risk: string;
  status: 'Active' | 'Not Configured' | 'Disabled';
  enabled: boolean;
}

export function ToolsView() {
  const [query, setQuery] = useState('');
  const [toolStates, setToolStates] = useState<Record<string, boolean>>({
    web_search: true,
    code_sandbox: true,
    math_solver: true,
    file_analysis: true,
    image_generation: false,
  });

  const fetchToolStates = async () => {
    try {
      const resp = await fetch('/api/storage/tools');
      if (resp.ok) {
        const json = await resp.json();
        if (json.tools) {
          const map: Record<string, boolean> = {};
          json.tools.forEach((t: any) => { map[t.tool_id] = Boolean(t.enabled); });
          setToolStates(prev => ({ ...prev, ...map }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch tool configuration:', err);
    }
  };

  useEffect(() => {
    fetchToolStates();
  }, []);

  const toggleTool = async (id: string) => {
    const nextVal = !toolStates[id];
    setToolStates(prev => ({ ...prev, [id]: nextVal }));

    try {
      await fetch('/api/storage/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: id, enabled: nextVal }),
      });
    } catch (err) {
      console.error('Failed to save tool configuration:', err);
    }
  };

  const tools: ToolStatus[] = [
    {
      id: 'web_search',
      name: 'Web Search & Citations',
      icon: Globe,
      description: 'Search duckduckgo/web for live external context and citations.',
      risk: 'external',
      status: toolStates.web_search ? 'Active' : 'Disabled',
      enabled: Boolean(toolStates.web_search),
    },
    {
      id: 'code_sandbox',
      name: 'Code Sandbox & Execution',
      icon: Code,
      description: 'Execute Node/JavaScript code safely in an isolated child process sandbox.',
      risk: 'compute',
      status: toolStates.code_sandbox ? 'Active' : 'Disabled',
      enabled: Boolean(toolStates.code_sandbox),
    },
    {
      id: 'math_solver',
      name: 'Math Solver',
      icon: Calculator,
      description: 'Deterministic symbolic expression calculation without eval().',
      risk: 'compute',
      status: toolStates.math_solver ? 'Active' : 'Disabled',
      enabled: Boolean(toolStates.math_solver),
    },
    {
      id: 'file_analysis',
      name: 'File & Document Analysis',
      icon: FileText,
      description: 'Retrieve and search document content stored in Library persistent assets.',
      risk: 'read',
      status: toolStates.file_analysis ? 'Active' : 'Disabled',
      enabled: Boolean(toolStates.file_analysis),
    },
    {
      id: 'image_generation',
      name: 'Image Diffusion Generation',
      icon: ImageIcon,
      description: 'Generate AI images using connected image diffusion models.',
      risk: 'external',
      status: 'Not Configured',
      enabled: false,
    },
  ];

  const filteredTools = tools.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-12 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground tracking-tight mb-2">Tools & Integrations</h1>
          <p className="text-sm text-muted-foreground">Manage and configure active central tool engines backed by SQLite database configuration.</p>
        </div>
      </div>

      <div className="mb-8 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input 
          className="w-full h-11 bg-transparent border border-border/40 rounded-full pl-11 pr-4 outline-none focus:border-border/80 transition-all text-[15px] placeholder:text-muted-foreground/50 text-foreground"
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
          return (
            <div key={tool.id} className="flex items-center px-6 py-4 border-b border-border/30 last:border-b-0 hover:bg-surface-hover transition-colors">
              <div className="flex-1 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-background border border-border/40 text-primary shadow-sm">
                  <tool.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[15px] text-foreground">{tool.name}</h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-muted/40 border border-border/30 text-muted-foreground">
                      {tool.risk}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                </div>
              </div>
              <div className="w-44 flex justify-end items-center gap-3">
                <span className={`text-xs font-medium ${tool.status === 'Active' ? 'text-emerald-500' : tool.status === 'Not Configured' ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {tool.status}
                </span>
                {tool.status !== 'Not Configured' && (
                  <button
                    onClick={() => toggleTool(tool.id)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${tool.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <div className={`w-5 h-5 bg-background rounded-full transition-transform ${tool.enabled ? 'translate-x-5' : 'translate-x-0'} shadow-sm`} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
