import React, { useState } from 'react';
import { Code2, Play, Download, Copy, Check, X, RefreshCw, Eye, FileCode } from 'lucide-react';

interface ArtifactPanelProps {
  content: string;
  onClose: () => void;
}

export function ArtifactPanel({ content, onClose }: ArtifactPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  const isHtml = content.trim().toLowerCase().startsWith('<!doctype html>') || content.includes('<html') || content.includes('</div>');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: isHtml ? 'text/html' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isHtml ? 'artifact.html' : 'artifact.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-1/2 min-w-[420px] max-w-[700px] border-l border-border/40 bg-card/40 flex flex-col h-full animate-in slide-in-from-right-8 duration-300 z-20">
      <div className="h-14 border-b border-border/40 flex items-center justify-between px-4 bg-background/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">Artifact Workspace</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-muted/40 rounded-lg p-0.5 border border-border/40">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === 'code' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative p-4">
        {content ? (
          activeTab === 'preview' && isHtml ? (
            <iframe
              srcDoc={content}
              title="HTML Artifact Sandbox Preview"
              className="w-full h-full bg-white rounded-xl border border-border/40 shadow-sm"
              sandbox="allow-scripts"
            />
          ) : (
            <div className="w-full h-full overflow-y-auto p-4 bg-card border border-border/40 rounded-xl font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed shadow-inner">
              {content}
            </div>
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Code2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-foreground">No Active Artifact</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Generated HTML documents, code files, and structured outputs will render in this panel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
