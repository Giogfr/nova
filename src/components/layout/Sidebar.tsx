import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkle, Plus, Search, Folder, BookOpen, UserCircle, 
  MessageSquareDashed, Blocks, Cpu, Home, GraduationCap, 
  Code2, Settings, MessageSquare, MoreHorizontal, Trash2, Edit2, GitFork
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { SettingsModal } from '@/components/settings/SettingsModal';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export function Sidebar() {
  const { toggleSidebar, createConversation, conversations, currentWorkspace, deleteConversation, branchConversation } = useAppStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNewChat = () => {
    createConversation();
    navigate('/');
  };

  const recentChats = Object.values(conversations)
    .filter(c => c.messages.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
    <div className="w-[260px] flex-shrink-0 flex flex-col h-full bg-background border-r border-border/40">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 text-primary font-semibold text-xl">
          <Sparkle className="w-5 h-5 fill-primary text-primary" />
          <span>Nova</span>
        </NavLink>
        <button onClick={toggleSidebar} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors hidden md:block">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"><path d="M5.5 3L2.5 7.5L5.5 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 3L10 7.5L13 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      <div className="px-3 pb-2">
        <Button onClick={handleNewChat} className="w-full justify-start text-primary-foreground bg-primary hover:bg-primary/90 h-10 px-3 rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left font-medium">New Chat</span>
          <span className="text-[10px] text-primary-foreground/50 ml-auto border border-primary-foreground/20 rounded px-1">⌘ I</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-0.5 py-2">
          <button 
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search</span>
            <span className="text-[10px] opacity-50 border rounded px-1">⌘ K</span>
          </button>
          <SidebarItem icon={Folder} label="Projects" to="/projects" />
          <SidebarItem icon={BookOpen} label="Library" to="/library" />
          <SidebarItem icon={UserCircle} label="Agents" to="/agents" />
          <SidebarItem icon={MessageSquareDashed} label="Prompts" to="/prompts" />
          <SidebarItem icon={Blocks} label="Tools" to="/tools" />
          <SidebarItem icon={Cpu} label="Models" to="/models" />
        </div>

        {recentChats.length > 0 && (
          <div className="mt-6 mb-2">
            <h3 className="px-3 text-xs font-medium text-muted-foreground mb-1">Recent Chats</h3>
            <div className="space-y-0.5">
              {recentChats.map(chat => (
                <div key={chat.id} className="group relative flex items-center">
                  <NavLink
                    to={`/chat/${chat.id}`}
                    className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2 pr-8 rounded-lg text-sm transition-colors ${isActive || (location.pathname === '/' && useAppStore.getState().currentConversationId === chat.id) ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="flex-1 text-left truncate">{chat.title}</span>
                  </NavLink>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="absolute right-2 p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 bg-surface border border-border/60 rounded-xl p-1 shadow-lg text-xs">
                      <DropdownMenuItem
                        onClick={() => {
                          const newTitle = prompt('Rename conversation:', chat.title);
                          if (newTitle && newTitle.trim()) {
                            useAppStore.setState(state => ({
                              conversations: {
                                ...state.conversations,
                                [chat.id]: { ...state.conversations[chat.id], title: newTitle.trim() }
                              }
                            }));
                          }
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-surface-hover cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const lastMsg = chat.messages[chat.messages.length - 1];
                          if (lastMsg) {
                            const newId = branchConversation(chat.id, lastMsg.id);
                            navigate(`/chat/${newId}`);
                          }
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-surface-hover cursor-pointer"
                      >
                        <GitFork className="w-3.5 h-3.5" /> Fork Branch
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteConversation(chat.id)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 mb-2">
          <h3 className="px-3 text-xs font-medium text-muted-foreground mb-1">Workspaces</h3>
          <div className="space-y-0.5">
            <SidebarWorkspaceItem icon={Home} label="Personal" id="personal" />
            <SidebarWorkspaceItem icon={GraduationCap} label="Study" id="study" />
            <SidebarWorkspaceItem icon={Code2} label="Coding" id="coding" />
          </div>
        </div>
      </ScrollArea>

      {/* Footer Profile */}
      <div className="p-3 mt-auto">
        <div className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-xl cursor-pointer transition-colors group">
          <Avatar className="w-9 h-9 border border-border/50">
            <AvatarFallback className="bg-primary/5 text-primary text-sm font-medium">U</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-foreground truncate leading-tight capitalize">{currentWorkspace}</p>
            <p className="text-xs text-muted-foreground truncate flex gap-1 items-center">
              Free <span className="w-1 h-1 rounded-full bg-border inline-block"></span> <span className="text-blue-500 hover:underline">Upgrade</span>
            </p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }}
            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-foreground"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    
    <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

function SidebarWorkspaceItem({ icon: Icon, label, id }: { icon: any, label: string, id: string }) {
  const { currentWorkspace, setCurrentWorkspace } = useAppStore();
  const isActive = currentWorkspace === id;
  
  return (
    <button 
      onClick={() => setCurrentWorkspace(id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
    >
      <Icon className={`w-4 h-4 ${isActive ? 'text-foreground' : ''}`} />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

function SidebarItem({ icon: Icon, label, shortcut, to }: { icon: any, label: string, shortcut?: string, to: string }) {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-4 h-4 ${isActive ? 'text-foreground' : ''}`} />
          <span className="flex-1 text-left">{label}</span>
          {shortcut && <span className="text-[10px] opacity-50 border rounded px-1">{shortcut}</span>}
        </>
      )}
    </NavLink>
  );
}
