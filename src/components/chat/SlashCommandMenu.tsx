import React from 'react';
import {
  Plus, Cpu, BrainCircuit, Blocks, Globe, FileText, Folder,
  Brain, Minimize2, GitFork, Download, Settings, BarChart2, HelpCircle, X, Code, Calculator
} from 'lucide-react';

interface SlashCommandMenuProps {
  query: string;
  onSelect: (commandId: string) => void;
  onClose: () => void;
}

export function SlashCommandMenu({ query, onSelect, onClose }: SlashCommandMenuProps) {
  const commands = [
    { id: 'new', label: 'New Chat', icon: Plus, description: 'Start a new conversation' },
    { id: 'model', label: 'Model', icon: Cpu, description: 'Change selected AI model' },
    { id: 'reasoning', label: 'Reasoning', icon: BrainCircuit, description: 'Adjust reasoning effort (low, medium, high)' },
    { id: 'tools', label: 'Tools', icon: Blocks, description: 'Toggle AI tool execution' },
    { id: 'web', label: 'Web', icon: Globe, description: 'Enable web search & live citations' },
    { id: 'research', label: 'Research', icon: Globe, description: 'Start multi-source deep research' },
    { id: 'files', label: 'Files', icon: FileText, description: 'Open persistent file library' },
    { id: 'project', label: 'Project', icon: Folder, description: 'Select or manage project workspace' },
    { id: 'memory', label: 'Memory', icon: Brain, description: 'Inspect or save global memory' },
    { id: 'compact', label: 'Compact', icon: Minimize2, description: 'Summarize context history to save token space' },
    { id: 'branch', label: 'Branch', icon: GitFork, description: 'Branch current conversation tree' },
    { id: 'export', label: 'Export', icon: Download, description: 'Export chat as Markdown or JSON' },
    { id: 'providers', label: 'Providers', icon: Settings, description: 'Open model provider settings' },
    { id: 'usage', label: 'Usage', icon: BarChart2, description: 'View token usage metrics' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Open application settings' },
    { id: 'help', label: 'Help', icon: HelpCircle, description: 'Show keyboard shortcuts & command help' },
  ];

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.id.toLowerCase().includes(query.toLowerCase()));

  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-[calc(100%+8px)] left-0 w-80 bg-surface border border-border/60 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30 flex justify-between items-center">
        <span>Slash Commands</span>
        <button onClick={onClose} className="hover:text-foreground transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="max-h-[280px] overflow-y-auto py-1">
        {filtered.map((cmd, i) => (
          <button
            key={cmd.id}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover ${i === 0 ? 'bg-surface-hover/50' : ''}`}
            onClick={() => onSelect(cmd.id)}
          >
            <div className="p-1.5 rounded-md bg-background shadow-sm border border-border/50 text-foreground shrink-0">
              <cmd.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-foreground">/{cmd.id}</div>
              <div className="text-[11px] text-muted-foreground truncate">{cmd.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
