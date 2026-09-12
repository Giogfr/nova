import React, { useState } from 'react';
import { BookOpen, Upload, Search, FileText, Image as ImageIcon, FileCode, MoreHorizontal } from 'lucide-react';

export function LibraryView() {
  const [files] = useState<any[]>([]); // To be wired to real state

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-6 py-12 w-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground tracking-tight mb-2">Library</h1>
          <p className="text-sm text-muted-foreground">Manage files, documents, and reference materials.</p>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-full bg-surface-hover hover:bg-surface-selected text-sm font-medium transition-colors border border-border/60 text-foreground">
          <Upload className="w-4 h-4" /> Upload File
        </button>
      </div>

      <div className="mb-8 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input 
          className="w-full h-11 bg-transparent border border-border/40 rounded-full pl-11 pr-4 outline-none focus:border-border/80 transition-all text-[15px] placeholder:text-muted-foreground/50"
          placeholder="Search files..."
        />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/30">
          <div className="flex-1">Name</div>
          <div className="w-24 text-right hidden md:block">Size</div>
          <div className="w-32 text-right hidden sm:block">Date Modified</div>
          <div className="w-12"></div>
        </div>
        
        {files.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-[15px] font-medium text-foreground mb-1">Library is empty</h3>
            <p className="text-sm text-muted-foreground">Upload files to use them across your projects and chats.</p>
          </div>
        ) : (
          files.map(file => (
            <div key={file.id} className="group flex items-center px-4 py-4 border-b border-border/30 hover:bg-surface-hover transition-colors cursor-pointer">
              <div className="flex-1 flex items-center gap-4">
                <FileText className="w-4 h-4 text-muted-foreground/70" />
                <h3 className="font-medium text-[15px] text-foreground">{file.name}</h3>
              </div>
              <div className="w-24 text-right text-sm text-muted-foreground hidden md:block">{file.size}</div>
              <div className="w-32 text-right text-sm text-muted-foreground hidden sm:block">{file.date}</div>
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
