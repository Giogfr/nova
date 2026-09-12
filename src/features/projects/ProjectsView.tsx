import React, { useState, useEffect } from 'react';
import { Folder, Plus, Search, FileText, Trash2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  instructions: string;
  updated_at?: number;
}

export function ProjectsView() {
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInst, setNewInst] = useState('');

  const fetchProjects = async () => {
    try {
      const resp = await fetch('/api/storage/projects');
      if (resp.ok) {
        const json = await resp.json();
        setProjects(json.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const proj = {
      id: `p_${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'No description provided.',
      instructions: newInst.trim() || 'Default project instructions apply.',
    };

    await fetch('/api/storage/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proj),
    });

    setNewName('');
    setNewDesc('');
    setNewInst('');
    setIsCreating(false);
    fetchProjects();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/storage/projects/${id}`, { method: 'DELETE' });
    fetchProjects();
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-12 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground tracking-tight mb-2">Projects</h1>
          <p className="text-sm text-muted-foreground">Organize your chats, files, and custom instructions into dedicated workspaces stored in SQLite.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-colors shadow-sm hover:opacity-90 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {isCreating && (
        <div className="mb-8 p-6 border border-border/60 rounded-2xl bg-card shadow-lg animate-in fade-in zoom-in-95 duration-200">
          <h2 className="text-base font-semibold mb-4 text-foreground">Create New Project Workspace</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Project Name</label>
              <input
                className="w-full h-10 bg-muted/30 border border-border/40 rounded-xl px-3 text-sm text-foreground outline-none focus:border-primary/50"
                placeholder="e.g. AI Research Assistant"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
              <input
                className="w-full h-10 bg-muted/30 border border-border/40 rounded-xl px-3 text-sm text-foreground outline-none focus:border-primary/50"
                placeholder="Short description of this project"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Custom Project Instructions</label>
              <textarea
                className="w-full h-20 bg-muted/30 border border-border/40 rounded-xl p-3 text-sm text-foreground outline-none resize-none focus:border-primary/50"
                placeholder="System instructions automatically appended to chats in this project"
                value={newInst}
                onChange={e => setNewInst(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-primary text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input 
          className="w-full h-11 bg-transparent border border-border/40 rounded-full pl-11 pr-4 outline-none focus:border-border/80 transition-all text-[15px] placeholder:text-muted-foreground/50 text-foreground"
          placeholder="Search projects..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-col border border-border/40 rounded-2xl overflow-hidden bg-card/30">
        <div className="flex items-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30 bg-muted/20">
          <div className="flex-1">Name & Instructions</div>
          <div className="w-32 text-right hidden sm:block">Updated</div>
          <div className="w-12"></div>
        </div>
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Folder className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-[15px] font-medium text-foreground mb-1">No projects found</h3>
            <p className="text-sm text-muted-foreground">Create a project to organize your AI workflows.</p>
          </div>
        ) : (
          filtered.map(project => (
            <div key={project.id} className="group flex items-center px-6 py-4 border-b border-border/30 last:border-b-0 hover:bg-surface-hover transition-colors">
              <div className="flex-1 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-background border border-border/40 text-primary shadow-sm mt-0.5">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] text-foreground">{project.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
                  {project.instructions && (
                    <div className="mt-2 text-[11px] font-mono text-muted-foreground/80 bg-muted/30 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 border border-border/30">
                      <FileText className="w-3 h-3 text-primary" />
                      <span className="truncate max-w-md">{project.instructions}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-32 text-right text-xs text-muted-foreground hidden sm:block">
                {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'Just now'}
              </div>
              <div className="w-12 flex justify-end">
                <button
                  onClick={(e) => handleDelete(project.id, e)}
                  className="p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/10 hover:text-rose-500"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
