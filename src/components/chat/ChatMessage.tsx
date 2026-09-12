import React from 'react';
import { Message } from '@/lib/store';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Sparkle, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`py-6 flex gap-4 w-full max-w-4xl mx-auto px-4 ${isUser ? '' : ''}`}>
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <Avatar className="w-8 h-8 border border-border/50">
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-medium">J</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Sparkle className="w-4 h-4 fill-current" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">
            {isUser ? 'You' : 'Nova'}
          </span>
        </div>
        
        <div className="text-foreground/90 space-y-4">
          {message.parts.map((part, index) => {
            if (part.type === 'text') {
              if (isUser) {
                // User messages don't need full markdown typically, but we can render it or just preserve whitespace.
                return (
                  <div key={index} className="whitespace-pre-wrap leading-relaxed text-[15px]">
                    {part.text}
                  </div>
                );
              }
              return <MarkdownRenderer key={index} content={part.text} />;
            }
            if (part.type === 'reasoning') {
              return (
                <div key={index} className="border-l-2 border-primary/20 pl-4 py-1 text-muted-foreground italic text-sm my-2">
                  <span className="font-medium not-italic block mb-1 text-xs uppercase tracking-wider">Thinking process</span>
                  {part.text}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
