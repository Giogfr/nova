import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Folder, BookOpen, UserCircle, MessageSquareDashed, Blocks, Cpu, Settings, LayoutPanelLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';

export function CommandPalette({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { createConversation, conversations } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const navCommands = [
    { icon: Plus, label: 'New Chat', action: () => { createConversation(); navigate('/'); } },
    { icon: LayoutPanelLeft, label: 'Compare Models', action: () => navigate('/compare') },
    { icon: Folder, label: 'Projects', action: () => navigate('/projects') },
    { icon: BookOpen, label: 'Library', action: () => navigate('/library') },
    { icon: UserCircle, label: 'Agents', action: () => navigate('/agents') },
    { icon: MessageSquareDashed, label: 'Prompts', action: () => navigate('/prompts') },
    { icon: Blocks, label: 'Tools', action: () => navigate('/tools') },
    { icon: Cpu, label: 'Models', action: () => navigate('/models') },
  ];

  // Search across real conversations
  const chatResults = query.trim()
    ? Object.values(conversations)
        .filter(c =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.messages.some(m => m.parts.some(p => p.type === 'text' && p.text.toLowerCase().includes(query.toLowerCase())))
        )
        .map(c => ({
          icon: MessageSquare,
          label: `Chat: ${c.title}`,
          action: () => navigate(`/chat/${c.id}`)
        }))
    : [];

  const allFiltered = [
    ...chatResults,
    ...navCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
  ];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, open]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  if (!open) return null;

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allFiltered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allFiltered[selectedIndex]) {
        handleAction(allFiltered[selectedIndex].action);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-2xl bg-surface rounded-2xl shadow-2xl border border-border/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 border-b border-border/30">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input 
            ref={inputRef}
            className="flex-1 h-14 bg-transparent border-none outline-none px-4 text-foreground placeholder:text-muted-foreground/60 text-[15px]"
            placeholder="Type a command or search chats and views..."
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex gap-1">
            <kbd className="text-[10px] font-medium text-muted-foreground border border-border/50 rounded px-1.5 py-0.5 bg-muted/30">ESC</kbd>
          </div>
        </div>
        
        <div className="max-h-[350px] overflow-y-auto py-2" ref={listRef}>
          {allFiltered.length > 0 ? (
            <div className="px-2 space-y-0.5">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Results</div>
              {allFiltered.map((cmd, i) => (
                <button
                  key={i}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] transition-colors text-foreground ${i === selectedIndex ? 'bg-surface-selected font-medium' : 'hover:bg-surface-hover'}`}
                  onClick={() => handleAction(cmd.action)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <div className={`p-1.5 rounded-md ${i === selectedIndex ? 'bg-background shadow-sm border border-border/50 text-foreground' : 'text-muted-foreground'}`}>
                    <cmd.icon className="w-4 h-4" />
                  </div>
                  <span className="truncate flex-1 text-left">{cmd.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
