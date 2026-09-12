import React from 'react';
import { Search, Code, Calculator, FileText, Globe, GraduationCap, X, Sparkles, LayoutPanelLeft } from 'lucide-react';

interface SlashCommandMenuProps {
  query: string;
  onSelect: (commandId: string) => void;
  onClose: () => void;
}

export function SlashCommandMenu({ query, onSelect, onClose }: SlashCommandMenuProps) {
  const commands = [
    { id: 'research', label: 'Research', icon: Globe, description: 'Search the web for real-time information' },
    { id: 'code', label: 'Code', icon: Code, description: 'Write or analyze code' },
    { id: 'math', label: 'Math', icon: Calculator, description: 'Step-by-step mathematical reasoning' },
    { id: 'file', label: 'File', icon: FileText, description: 'Analyze an uploaded document' },
    { id: 'teach', label: 'Teach', icon: GraduationCap, description: 'Socratic tutoring mode' },
    { id: 'compare', label: 'Compare', icon: LayoutPanelLeft, description: 'Compare outputs across models' },
  ];

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.id.toLowerCase().includes(query.toLowerCase()));

  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-[calc(100%+8px)] left-0 w-72 bg-surface border border-border/60 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30 flex justify-between items-center">
        <span>Commands</span>
        <button onClick={onClose} className="hover:text-foreground transition-colors"><X className="w-3 h-3" /></button>
      </div>
      <div className="max-h-[250px] overflow-y-auto py-1">
        {filtered.map((cmd, i) => (
          <button
            key={cmd.id}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover ${i === 0 ? 'bg-surface-hover/50' : ''}`}
            onClick={() => onSelect(cmd.id)}
          >
            <div className="p-1.5 rounded-md bg-background shadow-sm border border-border/50 text-foreground">
              <cmd.icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">/{cmd.id}</div>
              <div className="text-[11px] text-muted-foreground">{cmd.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
