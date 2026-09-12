import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code(props: any) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded-md font-mono text-[0.9em]" {...rest}>
                  {children}
                </code>
              );
            }
            return (
              <div className="rounded-lg overflow-hidden border border-border/50 bg-[#1E1E1E] my-4">
                <div className="flex items-center justify-between px-4 py-2 bg-[#2D2D2D] text-xs text-slate-300 font-mono">
                  <span>{match?.[1] || 'text'}</span>
                  <button className="hover:text-white transition-colors" onClick={() => navigator.clipboard.writeText(String(children))}>
                    Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  {...rest}
                  PreTag="div"
                  children={String(children).replace(/\n$/, '')}
                  language={match?.[1] || 'text'}
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                />
              </div>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
