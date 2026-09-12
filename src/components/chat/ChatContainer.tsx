import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HomeContent } from '@/features/chat/HomeContent';
import { ChatMessage } from './ChatMessage';
import { useAppStore } from '@/lib/store';
import { Sparkle, BrainCircuit, Blocks, Mic, ArrowUp, Plus, StopCircle, Code2, X, Maximize2, Check, Globe } from 'lucide-react';
import { sendStreamRequest } from '@/lib/ai/gateway';
import { ModelSelector } from './ModelSelector';
import { SlashCommandMenu } from './SlashCommandMenu';
import * as Popover from '@radix-ui/react-popover';

export function ChatContainer() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const {
    currentConversationId,
    conversations,
    addMessage,
    updateLastMessage,
    createConversation,
    setCurrentConversation,
    currentModel,
    providers
  } = useAppStore();
  
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [artifactContent, setArtifactContent] = useState('');
  const [reasoningEffort, setReasoningEffort] = useState<'off' | 'low' | 'medium' | 'high'>('medium');
  const [toolsEnabled, setToolsEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (routeId && routeId !== currentConversationId) {
      if (conversations[routeId]) {
        setCurrentConversation(routeId);
      } else {
        navigate('/');
      }
    } else if (!routeId && currentConversationId && conversations[currentConversationId]?.messages.length === 0) {
      // Stay on current conversation
    } else if (!routeId && currentConversationId && conversations[currentConversationId]?.messages.length > 0) {
      const newId = createConversation();
      setCurrentConversation(newId);
    }
  }, [routeId, currentConversationId, conversations, navigate, setCurrentConversation, createConversation]);

  const currentConversation = currentConversationId ? conversations[currentConversationId] : null;
  const messages = currentConversation?.messages || [];
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    
    let convId = currentConversationId;
    if (!convId || messages.length === 0) {
      if (!convId) {
        convId = createConversation();
      }
      navigate(`/chat/${convId}`);
    }

    const userText = input.trim();
    setInput('');
    setShowSlashMenu(false);
    
    addMessage(convId, 'user', [{ type: 'text', text: userText }]);
    addMessage(convId, 'assistant', [{ type: 'text', text: '' }]);
    
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    const selectedModelObj = useAppStore.getState().models.find(m => m.id === currentModel);
    const selectedProviderObj = providers.find(p => p.id === selectedModelObj?.providerId) || providers[0];

    try {
      const history = useAppStore.getState().conversations[convId].messages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.parts.map(p => (p.type === 'text' ? p.text : '')).join('\n')
      }));

      await sendStreamRequest(
        {
          modelId: currentModel,
          providerId: selectedProviderObj?.id || 'gemini',
          providerConfig: selectedProviderObj,
          messages: history,
          reasoningEffort,
          toolsEnabled,
        },
        (event) => {
          if (event.type === 'text_delta' && event.text) {
            updateLastMessage(convId!, (msg) => {
              const textPart = msg.parts.find(p => p.type === 'text');
              if (textPart && textPart.type === 'text') {
                textPart.text += event.text;
              } else {
                msg.parts.push({ type: 'text', text: event.text || '' });
              }

              // Auto-detect code block to stream into artifact side panel
              if (textPart && textPart.type === 'text' && textPart.text.includes('```')) {
                const codeMatch = textPart.text.match(/```(?:\w+)?\n([\s\S]*?)```/);
                if (codeMatch && codeMatch[1]) {
                  setArtifactContent(codeMatch[1]);
                }
              }
            });
          } else if (event.type === 'reasoning_delta' && event.reasoning) {
            updateLastMessage(convId!, (msg) => {
              const reasonPart = msg.parts.find(p => p.type === 'reasoning');
              if (reasonPart && reasonPart.type === 'reasoning') {
                reasonPart.text += event.reasoning;
              } else {
                msg.parts.unshift({ type: 'reasoning', text: event.reasoning || '' });
              }
            });
          } else if (event.type === 'error' && event.error) {
            updateLastMessage(convId!, (msg) => {
              msg.parts.push({ type: 'text', text: `\n\n**Error:** ${event.error}` });
            });
          }
        },
        abortControllerRef.current.signal
      );
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Generation stream error:', error);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;

    const match = val.match(/(^|\s)\/([a-zA-Z0-9]*)$/);
    if (match) {
      setShowSlashMenu(true);
      setSlashQuery(match[2]);
    } else {
      setShowSlashMenu(false);
    }
  };

  const handleSlashSelect = (cmdId: string) => {
    const newVal = input.replace(/(^|\s)\/([a-zA-Z0-9]*)$/, `$1/${cmdId} `);
    setInput(newVal);
    setShowSlashMenu(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (!showSlashMenu) {
        e.preventDefault();
        handleSend();
      }
    }
    if (e.key === 'Escape' && showSlashMenu) {
      setShowSlashMenu(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const toggleVoiceDictation = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your current browser engine.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isListening) {
      setIsListening(true);
      recognition.start();
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      setIsListening(false);
    }
  };

  const composer = (
    <div className="w-full bg-card rounded-3xl border border-border/60 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] p-2 transition-all focus-within:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] focus-within:border-border/80 relative">
      {showSlashMenu && (
        <SlashCommandMenu query={slashQuery} onSelect={handleSlashSelect} onClose={() => setShowSlashMenu(false)} />
      )}
      <div className="px-4 pt-3 pb-8">
        <textarea 
          ref={textareaRef}
          className="w-full bg-transparent text-[15px] md:text-[16px] outline-none resize-none placeholder:text-muted-foreground/50 text-foreground"
          rows={1}
          placeholder="Ask anything, create anything, solve anything... (Type '/' for commands)"
          style={{ minHeight: '32px', maxHeight: '200px' }}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
      </div>
      
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.onchange = (e: any) => {
                const file = e.target?.files?.[0];
                if (file) {
                  setInput(prev => `${prev}\n[Attached file: ${file.name}]`);
                }
              };
              fileInput.click();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/50 text-muted-foreground border border-transparent hover:border-border/60 transition-all"
            title="Upload file attachment"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 bg-muted/30 rounded-full p-1 border border-border/40">
            <ModelSelector />

            {/* Reasoning Selector */}
            <Popover.Root>
              <Popover.Trigger asChild>
                <button className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${reasoningEffort !== 'off' ? 'bg-background shadow-sm border border-border/40 text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}>
                  <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                  <span>Reasoning: {reasoningEffort}</span>
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content className="z-50 w-44 bg-surface border border-border/60 rounded-xl shadow-xl p-1 mt-1">
                  {(['off', 'low', 'medium', 'high'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setReasoningEffort(level)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs capitalize transition-colors ${reasoningEffort === level ? 'bg-surface-selected font-medium text-foreground' : 'text-muted-foreground hover:bg-surface-hover'}`}
                    >
                      <span>{level} effort</span>
                      {reasoningEffort === level && <Check className="w-3.5 h-3.5 text-foreground" />}
                    </button>
                  ))}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            {/* Tools Toggle */}
            <button
              onClick={() => setToolsEnabled(!toolsEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${toolsEnabled ? 'bg-background shadow-sm border border-border/40 text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
              title="Toggle AI Tool Execution"
            >
              <Blocks className="w-3.5 h-3.5 text-primary" />
              <span>Tools: {toolsEnabled ? 'On' : 'Off'}</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleVoiceDictation}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'hover:bg-muted/50 text-muted-foreground'}`}
            title="Voice Dictation"
          >
            <Mic className="w-4 h-4" />
          </button>

          {isGenerating ? (
            <button 
              onClick={handleStop}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-foreground text-background shadow-md hover:opacity-90 transition-all"
              title="Stop Generation"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className={`flex flex-col flex-1 h-full relative transition-all duration-300 ${isArtifactOpen ? 'max-w-2xl' : 'w-full'}`}>
        <div className="flex-1 overflow-y-auto pb-32" ref={scrollRef}>
          {messages.length === 0 ? (
            <HomeContent 
              composer={composer} 
              onAction={(action) => {
                const prefixes: Record<string, string> = {
                  research: 'Research: ',
                  code: 'Write code to ',
                  math: 'Solve: ',
                  image: 'Generate an image of ',
                  file: 'Analyze this file: '
                };
                if (prefixes[action]) {
                  setInput(prefixes[action]);
                  setTimeout(() => {
                    const textarea = document.querySelector('textarea');
                    if (textarea) textarea.focus();
                  }, 10);
                }
              }} 
            />
          ) : (
            <div className="py-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onRegenerate={() => {
                    if (msg.role === 'assistant') {
                      handleSend();
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {messages.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 px-4">
            <div className="max-w-3xl mx-auto flex items-end gap-4">
              <div className="flex-1">
                {composer}
              </div>
              {!isArtifactOpen && (
                <button 
                  onClick={() => setIsArtifactOpen(true)}
                  className="mb-2 w-10 h-10 rounded-full bg-card border border-border/60 shadow-sm flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                  title="Open Artifacts Panel"
                >
                  <Code2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isArtifactOpen && (
        <div className="w-1/2 min-w-[400px] border-l border-border/40 bg-card/30 flex flex-col animate-in slide-in-from-right-8 duration-300 h-full">
          <div className="h-14 border-b border-border/40 flex items-center justify-between px-4 bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm text-foreground">Code & Document Artifact</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsArtifactOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-muted-foreground">
            {artifactContent ? (
              <div className="w-full h-full text-sm font-mono whitespace-pre-wrap bg-card border border-border/40 p-4 rounded-xl overflow-x-auto text-foreground">
                {artifactContent}
              </div>
            ) : (
              <div className="text-center">
                <Code2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="font-medium text-foreground">No active artifact</p>
                <p className="text-xs text-muted-foreground mt-1">Generated code blocks, long documents, and web view previews automatically appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
