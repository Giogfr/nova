import React, { useState } from 'react';
import { Message } from '@/lib/store';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Sparkle, ChevronDown, ChevronUp, BrainCircuit, Globe, Code2, Wrench, RefreshCw, Copy, Check } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
}

export function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [showReasoning, setShowReasoning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textContent = message.parts
      .filter(p => p.type === 'text')
      .map(p => (p.type === 'text' ? p.text : ''))
      .join('\n');
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`py-6 flex gap-4 w-full max-w-4xl mx-auto px-4 group transition-colors ${isUser ? '' : ''}`}>
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <Avatar className="w-8 h-8 border border-border/50">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">U</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Sparkle className="w-4 h-4 fill-current" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-sm">{isUser ? 'You' : 'Nova'}</span>
          {!isUser && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Copy message"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Regenerate response"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="text-foreground/90 space-y-4">
          {message.parts.map((part, index) => {
            if (part.type === 'reasoning') {
              return (
                <div key={index} className="my-2 border border-border/40 rounded-xl overflow-hidden bg-muted/20">
                  <button
                    onClick={() => setShowReasoning(!showReasoning)}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                      <span>Thinking Process</span>
                    </div>
                    {showReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showReasoning && (
                    <div className="px-3.5 py-2.5 border-t border-border/30 text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap bg-background/50">
                      {part.text}
                    </div>
                  )}
                </div>
              );
            }

            if (part.type === 'tool_call') {
              return (
                <div key={index} className="my-2 flex items-center gap-2 px-3 py-1.5 border border-border/40 rounded-lg text-xs bg-muted/30 text-muted-foreground">
                  <Wrench className="w-3.5 h-3.5 text-primary" />
                  <span>Executed tool: <strong className="text-foreground">{part.name}</strong></span>
                </div>
              );
            }

            if (part.type === 'tool_result') {
              return (
                <div key={index} className="my-2 p-2.5 border border-border/30 rounded-lg text-xs font-mono bg-card text-muted-foreground overflow-x-auto">
                  {part.result}
                </div>
              );
            }

            if (part.type === 'text') {
              if (isUser) {
                return (
                  <div key={index} className="whitespace-pre-wrap leading-relaxed text-[15px]">
                    {part.text}
                  </div>
                );
              }
              return <MarkdownRenderer key={index} content={part.text} />;
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
