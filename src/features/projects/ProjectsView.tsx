import React, { useState, useEffect } from 'react';
import { Folder, Plus, Search, FileText, Trash2, MessageSquare, FileCode, Upload, ArrowLeft, Settings, ShieldAlert, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';

interface Project {
  id: string;
  name: string;
  description: string;
  instructions: string;
  icon?: string;
  color?: string;
  memory_mode?: string;
  default_model?: string;
  updated_at?: number;
}

interface ProjectFile {
  id: string;
  name: string;
  mime_type?: string;
  size_bytes?: number;
  created_at?: number;
}

export function ProjectsView() {
  const navigate = useNavigate();
  const { createConversation, conversations } = useAppStore();

  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'files' | 'instructions' | 'settings'>('chats');

  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [libraryFiles, setLibraryFiles] = useState<ProjectFile[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInst, setNewInst] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

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

  const fetchProjectFiles = async (projId: string) => {
    try {
      const resp = await fetch(`/api/storage/projects/${projId}/files`);
      if (resp.ok) {
        const json = await resp.json();
        setProjectFiles(json.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch project files:', err);
    }
  };

  const fetchLibraryFiles = async () => {
    try {
      const resp = await fetch('/api/storage/library');
      if (resp.ok) {
        const json = await resp.json();
        setLibraryFiles(json.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch library files:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchLibraryFiles();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectFiles(selectedProject.id);
    }
  }, [selectedProject]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const proj = {
      id: `p_${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'No description provided.',
      instructions: newInst.trim() || 'Default project instructions apply.',
      color: newColor,
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

  const handleUpdateProject = async (updatedFields: Partial<Project>) => {
    if (!selectedProject) return;
    const updated = { ...selectedProject, ...updatedFields };
    setSelectedProject(updated);

    await fetch('/api/storage/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    fetchProjects();
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await fetch(`/api/storage/projects/${id}`, { method: 'DELETE' });
    if (selectedProject?.id === id) setSelectedProject(null);
    fetchProjects();
  };

  const handleAddFileToProject = async (libraryFileId: string) => {
    if (!selectedProject) return;
    await fetch(`/api/storage/projects/${selectedProject.id}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ libraryFileId }),
    });
    fetchProjectFiles(selectedProject.id);
  };

  const handleRemoveFileFromProject = async (fileId: string) => {
    if (!selectedProject) return;
    await fetch(`/api/storage/projects/${selectedProject.id}/files/${fileId}`, { method: 'DELETE' });
    fetchProjectFiles(selectedProject.id);
  };

  const handleCreateProjectChat = () => {
    const newId = createConversation();
    navigate(`/chat/${newId}`);
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description?.toLowerCase().includes(query.toLowerCase())
  );

  if (selectedProject) {
    return (
      <div className="flex flex-col h-full max-w-5xl mx-auto px-6 py-8 w-full animate-in fade-in duration-300">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelectedProject(null)} className="p-2 rounded-xl border border-border/40 hover:bg-muted/50 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2.5 rounded-xl text-white shadow-sm" style={{ backgroundColor: selectedProject.color || '#3b82f6' }}>
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">{selectedProject.name}</h1>
              <p className="text-xs text-muted-foreground">{selectedProject.description}</p>
            </div>
          </div>
          <button
            onClick={handleCreateProjectChat}
            className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Project Chat
          </button>
        </div>

        {/* Project Navigation Tabs */}
        <div className="flex border-b border-border/40 mb-6 gap-6">
          {(['chats', 'files', 'instructions', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize transition-colors relative ${activeTab === tab ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'chats' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-foreground">Project Chats</h3>
            </div>
            {Object.values(conversations).length === 0 ? (
              <div className="py-16 text-center border border-border/40 rounded-2xl bg-card/20">
                <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No chats in this project yet</p>
                <button onClick={handleCreateProjectChat} className="mt-3 text-xs text-primary underline">Start new project chat</button>
              </div>
            ) : (
              Object.values(conversations).slice(0, 5).map(chat => (
                <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="p-4 border border-border/40 rounded-xl bg-card/40 hover:bg-surface-hover cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{chat.title}</h4>
                      <p className="text-xs text-muted-foreground">{chat.messages.length} messages • Updated {new Date(chat.updatedAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            <div className="border border-border/40 rounded-2xl p-4 bg-card/30">
              <h3 className="text-sm font-semibold text-foreground mb-2">Attached Project Files</h3>
              {projectFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No reference files attached to this project.</p>
              ) : (
                <div className="space-y-2">
                  {projectFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 border border-border/30 rounded-xl bg-background">
                      <div className="flex items-center gap-3">
                        <FileCode className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-foreground">{file.name}</span>
                      </div>
                      <button onClick={() => handleRemoveFileFromProject(file.id)} className="text-muted-foreground hover:text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-border/40 rounded-2xl p-4 bg-card/30">
              <h3 className="text-sm font-semibold text-foreground mb-3">Add Assets from Library</h3>
              <div className="space-y-2">
                {libraryFiles.map(file => {
                  const isAttached = projectFiles.some(pf => pf.id === file.id);
                  return (
                    <div key={file.id} className="flex items-center justify-between p-3 border border-border/30 rounded-xl bg-background">
                      <span className="text-xs font-medium text-foreground">{file.name}</span>
                      <button
                        onClick={() => !isAttached && handleAddFileToProject(file.id)}
                        disabled={isAttached}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${isAttached ? 'bg-muted text-muted-foreground cursor-default' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
                      >
                        {isAttached ? 'Attached' : 'Attach File'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'instructions' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Custom Project System Instructions</h3>
            <p className="text-xs text-muted-foreground">These instructions will automatically apply to every AI request inside this project workspace.</p>
            <textarea
              className="w-full h-48 bg-card border border-border/40 rounded-2xl p-4 text-sm font-mono text-foreground outline-none focus:border-primary/60"
              value={selectedProject.instructions}
              onChange={e => handleUpdateProject({ instructions: e.target.value })}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Project Name</label>
              <input
                className="w-full h-10 bg-card border border-border/40 rounded-xl px-3 text-sm text-foreground outline-none"
                value={selectedProject.name}
                onChange={e => handleUpdateProject({ name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
              <input
                className="w-full h-10 bg-card border border-border/40 rounded-xl px-3 text-sm text-foreground outline-none"
                value={selectedProject.description}
                onChange={e => handleUpdateProject({ description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Memory Mode</label>
              <select
                className="w-full h-10 bg-card border border-border/40 rounded-xl px-3 text-sm text-foreground outline-none"
                value={selectedProject.memory_mode || 'default'}
                onChange={e => handleUpdateProject({ memory_mode: e.target.value })}
              >
                <option value="default">Default Context Retrieval</option>
                <option value="project_only">Strict Project-Only Memory Isolation</option>
              </select>
            </div>
            <div className="pt-4 border-t border-border/40">
              <button onClick={(e) => handleDelete(selectedProject.id, e)} className="flex items-center gap-2 text-rose-500 text-xs font-semibold hover:underline">
                <Trash2 className="w-4 h-4" /> Delete Project Workspace
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-6 py-12 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground tracking-tight mb-2">Projects</h1>
          <p className="text-sm text-muted-foreground">Organize your chats, files, and custom system instructions into relational project workspaces.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-colors shadow-sm hover:opacity-90 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {isCreating && (
        <div className="mb-8 p-6 border border-border/60 rounded-2xl bg-card shadow-lg animate-in fade-in zoom-in-95 duration-200 max-w-2xl">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 py-20 text-center border border-border/40 rounded-2xl bg-card/20">
            <Folder className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-[15px] font-medium text-foreground mb-1">No projects found</h3>
            <p className="text-sm text-muted-foreground">Create a project workspace to group chats and files.</p>
          </div>
        ) : (
          filtered.map(project => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="group p-5 border border-border/40 rounded-2xl bg-card/40 hover:bg-surface-hover transition-all cursor-pointer flex flex-col justify-between h-44 shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl text-white shadow-sm" style={{ backgroundColor: project.color || '#3b82f6' }}>
                    <Folder className="w-5 h-5" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    className="p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/10 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-base text-foreground leading-snug">{project.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
              </div>

              {project.instructions && (
                <div className="text-[11px] font-mono text-muted-foreground/80 bg-muted/30 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 border border-border/30 max-w-full">
                  <FileText className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">{project.instructions}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
