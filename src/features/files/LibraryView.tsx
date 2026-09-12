import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, Search, FileText, Image as ImageIcon, FileCode, Trash2, Download } from 'lucide-react';

interface LibraryFile {
  id: string;
  name: string;
  file_path?: string;
  mime_type?: string;
  size_bytes?: number;
  created_at?: number;
}

export function LibraryView() {
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<LibraryFile[]>([]);

  const fetchFiles = async () => {
    try {
      const resp = await fetch('/api/storage/library');
      if (resp.ok) {
        const json = await resp.json();
        setFiles(json.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch library files:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const content = event.target?.result as string || '';
          await fetch('/api/storage/library/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: file.name,
              content,
              mimeType: file.type || 'text/plain',
            }),
          });
          fetchFiles();
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/storage/library/${id}`, { method: 'DELETE' });
    fetchFiles();
  };

  const filtered = files.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-12 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground tracking-tight mb-2">Library & Persistent Assets</h1>
          <p className="text-sm text-muted-foreground">Manage files, documents, and reference materials stored in server disk storage.</p>
        </div>
        <button
          onClick={handleUpload}
          className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-colors shadow-sm hover:opacity-90 cursor-pointer"
        >
          <Upload className="w-4 h-4" /> Upload Asset
        </button>
      </div>

      <div className="mb-8 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input 
          className="w-full h-11 bg-transparent border border-border/40 rounded-full pl-11 pr-4 outline-none focus:border-border/80 transition-all text-[15px] placeholder:text-muted-foreground/50 text-foreground"
          placeholder="Search files..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-col border border-border/40 rounded-2xl overflow-hidden bg-card/30">
        <div className="flex items-center px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30 bg-muted/20">
          <div className="flex-1">File Name</div>
          <div className="w-24 text-right hidden md:block">Size</div>
          <div className="w-36 text-right hidden sm:block">Date Uploaded</div>
          <div className="w-16"></div>
        </div>
        
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-[15px] font-medium text-foreground mb-1">Library is empty</h3>
            <p className="text-sm text-muted-foreground">Upload assets to store them persistently on disk.</p>
          </div>
        ) : (
          filtered.map(file => (
            <div key={file.id} className="group flex items-center px-6 py-4 border-b border-border/30 last:border-b-0 hover:bg-surface-hover transition-colors">
              <div className="flex-1 flex items-center gap-3.5">
                {file.mime_type?.includes('image') ? (
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                ) : file.mime_type?.includes('json') || file.mime_type?.includes('code') ? (
                  <FileCode className="w-4 h-4 text-amber-500" />
                ) : (
                  <FileText className="w-4 h-4 text-primary" />
                )}
                <span className="font-semibold text-[15px] text-foreground">{file.name}</span>
              </div>
              <div className="w-24 text-right text-xs text-muted-foreground font-mono hidden md:block">
                {file.size_bytes ? `${(file.size_bytes / 1024).toFixed(1)} KB` : '0 KB'}
              </div>
              <div className="w-36 text-right text-xs text-muted-foreground hidden sm:block">
                {file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Just now'}
              </div>
              <div className="w-16 flex justify-end items-center gap-1">
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/10 hover:text-rose-500"
                  title="Delete File"
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
