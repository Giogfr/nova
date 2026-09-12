import React, { useEffect, useState } from 'react';
import { Share, Sun, Moon, Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { ModelSelector } from '@/components/chat/ModelSelector';

interface TopBarProps {
  onToggleSidebar?: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const { sidebarOpen } = useAppStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 w-full bg-background/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border/30">
      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleSidebar} 
          className={`p-2 -ml-2 text-muted-foreground hover:text-foreground transition-opacity ${sidebarOpen ? 'hidden md:hidden' : 'block'}`}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <ModelSelector />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleShare} variant="outline" className="rounded-full h-9 px-4 border-border/60 hover:bg-muted/50 gap-2 shadow-sm text-foreground hidden sm:flex">
          <Share className="w-4 h-4" />
          <span>Share</span>
        </Button>
        <button 
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted/50 text-muted-foreground transition-colors border border-transparent hover:border-border/60"
        >
          {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Avatar className="w-8 h-8 border border-border/50 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarFallback className="bg-primary/5 text-primary text-xs font-medium">U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
