import React, { useState } from 'react';
import { BookOpen, Upload, Search, FileText, Image as ImageIcon, FileCode, Trash2, Download } from 'lucide-react';

interface LibraryFile {
  id: string;
  name: string;
  size: string;
  type: 'text' | 'image' | 'code' | 'pdf';
  date: string;
}

export function LibraryView() {
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<LibraryFile[]>([
    { id: 'f1', name: 'System_Architecture_Doc.md', size: '24 KB', type: 'text', date: 'Today, 10:14 AM' },
    { id: 'f2', name: 'Nova_Logo_Dark.png', size: '142 KB', type: 'image', date: 'Yesterday' },
    { id: 'f3', name: 'benchmark_results.json', size: '8 KB', type: 'code', date: 'Sep 10, 2024' },
  ]);

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        const newFile: LibraryFile = {
          id: `f_${Date.now()}`,
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.name.endsWith('.png') || file.name.endsWith('.jpg') ? 'image' : file.name.endsWith('.json') || file.name.endsWith('.js') ? 'code' : 'text',
          date: 'Just now',
        };
        setFiles([newFile, ...files]);
      }
    };
    input.click();
  };

  const handleDelete = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const filtered = files.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-12 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground tracking-tight mb-2">Library & Assets</h1>
          <p className="text-sm text-muted-foreground">Manage uploaded files, reference documents, and generated artifacts.</p>
        </div>
        <button
          onClick={handleUpload}
          className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-colors shadow-sm hover:opacity-90"
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
            <p className="text-sm text-muted-foreground">Upload assets to reference them across your conversations.</p>
          </div>
        ) : (
          filtered.map(file => (
            <div key={file.id} className="group flex items-center px-6 py-4 border-b border-border/30 last:border-b-0 hover:bg-surface-hover transition-colors">
              <div className="flex-1 flex items-center gap-3.5">
                {file.type === 'image' ? (
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                ) : file.type === 'code' ? (
                  <FileCode className="w-4 h-4 text-amber-500" />
                ) : (
                  <FileText className="w-4 h-4 text-primary" />
                )}
                <span className="font-semibold text-[15px] text-foreground">{file.name}</span>
              </div>
              <div className="w-24 text-right text-xs text-muted-foreground font-mono hidden md:block">{file.size}</div>
              <div className="w-36 text-right text-xs text-muted-foreground hidden sm:block">{file.date}</div>
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
