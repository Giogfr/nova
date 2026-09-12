import React, { useState } from 'react';
import { Folder, Plus, Search, MoreHorizontal } from 'lucide-react';

export function ProjectsView() {
  const [projects] = useState<any[]>([]); // To be wired to real state
  
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-12 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground tracking-tight mb-2">Projects</h1>
          <p className="text-sm text-muted-foreground">Organize your chats, files, and agents into dedicated workspaces.</p>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-full bg-surface-hover hover:bg-surface-selected text-sm font-medium transition-colors border border-border/60 text-foreground">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="mb-8 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input 
          className="w-full h-11 bg-transparent border border-border/40 rounded-full pl-11 pr-4 outline-none focus:border-border/80 transition-all text-[15px] placeholder:text-muted-foreground/50"
          placeholder="Search projects..."
        />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/30">
          <div className="flex-1">Name</div>
          <div className="w-32 text-right hidden sm:block">Updated</div>
          <div className="w-12"></div>
        </div>
        {projects.length === 0 ? (
          <div className="py-20 text-center">
            <Folder className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-[15px] font-medium text-foreground mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground">Create your first project to organize your work.</p>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="group flex items-center px-4 py-4 border-b border-border/30 hover:bg-surface-hover transition-colors cursor-pointer">
              <div className="flex-1 flex items-center gap-4">
                <Folder className="w-4 h-4 text-muted-foreground/70" />
                <div>
                  <h3 className="font-medium text-[15px] text-foreground">{project.name}</h3>
                  <p className="text-sm text-muted-foreground truncate max-w-[300px]">{project.description}</p>
                </div>
              </div>
              <div className="w-32 text-right text-sm text-muted-foreground hidden sm:block">
                {project.updated}
              </div>
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
