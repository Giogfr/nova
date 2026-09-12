import React, { useState, useEffect, useRef } from 'react';
import { Code2, Download, Copy, Check, X, Eye, FileCode, History, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

interface ArtifactPanelProps {
  artifactId?: string;
  content: string;
  title?: string;
  type?: 'html' | 'svg' | 'markdown' | 'code' | 'json';
  onClose: () => void;
}

interface ArtifactVersion {
  id: string;
  version_number: number;
  content: string;
  created_at: number;
}

export function ArtifactPanel({ artifactId, content, title = 'Artifact Workspace', type = 'html', onClose }: ArtifactPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'versions'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(() => {
    return parseInt(localStorage.getItem('nova_artifact_width') || '580', 10);
  });
  const [isResizing, setIsResizing] = useState(false);

  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [activeContent, setActiveContent] = useState(content);
  const [currentVersionNum, setCurrentVersionNum] = useState(1);

  const isHtml = type === 'html' || activeContent.trim().toLowerCase().startsWith('<!doctype html>') || activeContent.includes('<html') || activeContent.includes('</div>');
  const isSvg = type === 'svg' || activeContent.trim().startsWith('<svg');

  useEffect(() => {
    if (artifactId) {
      fetch(`/api/storage/artifacts/${artifactId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.versions) {
            setVersions(data.versions);
            const latest = data.versions[data.versions.length - 1];
            if (latest) {
              setActiveContent(latest.content);
              setCurrentVersionNum(latest.version_number);
            }
          }
        })
        .catch(err => console.error('Failed to load artifact versions:', err));
    } else {
      setActiveContent(content);
    }
  }, [artifactId, content]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(380, Math.min(window.innerWidth - 300, window.innerWidth - e.clientX));
      setPanelWidth(newWidth);
      localStorage.setItem('nova_artifact_width', newWidth.toString());
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = isHtml ? 'html' : isSvg ? 'svg' : type === 'json' ? 'json' : 'txt';
    const mime = isHtml ? 'text/html' : isSvg ? 'image/svg+xml' : type === 'json' ? 'application/json' : 'text/plain';
    const blob = new Blob([activeContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!artifactId) return;
    try {
      const resp = await fetch(`/api/storage/artifacts/${artifactId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });
      if (resp.ok) {
        const json = await resp.json();
        // Refresh versions
        const res = await fetch(`/api/storage/artifacts/${artifactId}`);
        if (res.ok) {
          const data = await res.json();
          setVersions(data.versions || []);
          const latest = data.versions[data.versions.length - 1];
          if (latest) {
            setActiveContent(latest.content);
            setCurrentVersionNum(latest.version_number);
          }
        }
      }
    } catch (err) {
      console.error('Failed to restore artifact version:', err);
    }
  };

  return (
    <div
      style={{ width: isFullscreen ? '100vw' : `${panelWidth}px` }}
      className={`border-l border-border/40 bg-card/40 flex flex-col h-full animate-in slide-in-from-right-8 duration-300 z-30 relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}
    >
      {/* Drag Resize Handle */}
      {!isFullscreen && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 transition-colors z-40"
          title="Drag to resize panel"
        />
      )}

      {/* Header */}
      <div className="h-14 border-b border-border/40 flex items-center justify-between px-4 bg-background/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm text-foreground truncate max-w-[200px]">{title}</span>
          <span className="text-xs bg-muted/40 border border-border/40 px-2 py-0.5 rounded-md font-mono text-muted-foreground uppercase">
            {type}
          </span>
          {versions.length > 1 && (
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-mono font-medium">
              v{currentVersionNum}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex bg-muted/40 rounded-lg p-0.5 border border-border/40">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('source')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === 'source' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Source</span>
            </button>
            {versions.length > 1 && (
              <button
                onClick={() => setActiveTab('versions')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === 'versions' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Versions ({versions.length})</span>
              </button>
            )}
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
            title="Download artifact"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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

      {/* Main Panel Content */}
      <div className="flex-1 overflow-hidden relative p-4">
        {activeTab === 'preview' && (isHtml || isSvg) ? (
          <iframe
            srcDoc={activeContent}
            title="Sandboxed Artifact Preview"
            className="w-full h-full bg-white rounded-xl border border-border/40 shadow-sm"
            sandbox="allow-scripts"
          />
        ) : activeTab === 'versions' ? (
          <div className="w-full h-full overflow-y-auto p-4 bg-card border border-border/40 rounded-xl space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Persistent Version History</h3>
            {versions.map((ver) => (
              <div key={ver.id} className="flex items-center justify-between p-3 border border-border/30 rounded-xl bg-background hover:bg-surface-hover transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">Version v{ver.version_number}</span>
                    {ver.version_number === currentVersionNum && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">Current</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(ver.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveContent(ver.content)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-border/40 hover:bg-muted text-foreground transition-colors"
                  >
                    View
                  </button>
                  {ver.version_number !== currentVersionNum && (
                    <button
                      onClick={() => handleRestoreVersion(ver.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto p-4 bg-card border border-border/40 rounded-xl font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed shadow-inner">
            {activeContent}
          </div>
        )}
      </div>
    </div>
  );
}
