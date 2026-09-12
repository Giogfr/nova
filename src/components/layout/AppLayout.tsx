import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAppStore } from '@/lib/store';
import { Menu } from 'lucide-react';
import { CommandPalette } from '@/components/CommandPalette';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground relative">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:flex`}>
        {sidebarOpen && <Sidebar />}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto relative">
          {children}
        </main>
      </div>

      <CommandPalette open={commandPaletteOpen} setOpen={setCommandPaletteOpen} />
    </div>
  );
}
