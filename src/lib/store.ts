import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Role = 'user' | 'assistant' | 'system';

export type MessagePart = 
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string }
  | { type: 'tool_call'; id: string; name: string; args: string }
  | { type: 'tool_result'; id: string; result: string };

export interface Message {
  id: string;
  role: Role;
  parts: MessagePart[];
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  mode?: string;
}

export interface Provider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'lmstudio' | 'custom';
  enabled: boolean;
  status: 'connected' | 'offline' | 'unknown' | 'error';
  baseUrl?: string;
  apiKeyStored: boolean;
  apiKey?: string; // Optional, only kept locally
}

export interface Model {
  id: string;
  name: string;
  providerId: string;
  contextWindow?: string;
  capabilities: string[]; // 'vision', 'tools', 'reasoning'
}

interface AppState {
  conversations: Record<string, Conversation>;
  currentConversationId: string | null;
  sidebarOpen: boolean;
  currentModel: string;
  currentWorkspace: string;
  providers: Provider[];
  models: Model[];
  
  setProviders: (providers: Provider[]) => void;
  updateProvider: (id: string, updates: Partial<Provider>) => void;
  setModels: (models: Model[]) => void;
  
  setCurrentWorkspace: (ws: string) => void;
  setCurrentModel: (model: string) => void;
  createConversation: () => string;
  setCurrentConversation: (id: string) => void;
  addMessage: (conversationId: string, role: Role, parts: MessagePart[]) => void;
  updateLastMessage: (conversationId: string, updater: (msg: Message) => void) => void;
  toggleSidebar: () => void;
  deleteConversation: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      conversations: {},
      currentConversationId: null,
      sidebarOpen: true,
      currentModel: 'nova-3.5',
      currentWorkspace: 'personal',
      
      providers: [
        { id: 'nova', name: 'Nova', type: 'custom', enabled: true, status: 'unknown', apiKeyStored: false },
        { id: 'openai', name: 'OpenAI', type: 'openai', enabled: false, status: 'unknown', apiKeyStored: false },
        { id: 'anthropic', name: 'Anthropic', type: 'anthropic', enabled: false, status: 'unknown', apiKeyStored: false },
        { id: 'gemini', name: 'Google Gemini', type: 'gemini', enabled: false, status: 'unknown', apiKeyStored: false },
        { id: 'ollama', name: 'Ollama', type: 'ollama', enabled: true, status: 'unknown', baseUrl: 'http://localhost:11434', apiKeyStored: false }
      ],
      
      models: [
        { id: 'nova-3.5', name: 'Nova 3.5', providerId: 'nova', capabilities: ['vision', 'tools'] }
      ],

      setProviders: (providers) => set({ providers }),
      updateProvider: (id, updates) => set(state => ({
        providers: state.providers.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      setModels: (models) => set({ models }),

      setCurrentWorkspace: (ws) => set({ currentWorkspace: ws }),
      setCurrentModel: (model) => set({ currentModel: model }),

      createConversation: () => {
        const id = uuidv4();
        const newConv: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          updatedAt: Date.now(),
        };
        set((state) => ({
          conversations: { ...state.conversations, [id]: newConv },
          currentConversationId: id,
        }));
        return id;
      },

      setCurrentConversation: (id) => set({ currentConversationId: id }),

      addMessage: (conversationId, role, parts) => {
        set((state) => {
          const conv = state.conversations[conversationId];
          if (!conv) return state;

          const newMessage: Message = {
            id: uuidv4(),
            role,
            parts,
            createdAt: Date.now(),
          };
          
          let title = conv.title;
          if (conv.messages.length === 0 && role === 'user') {
            const textPart = parts.find(p => p.type === 'text');
            if (textPart && textPart.type === 'text') {
               title = textPart.text.slice(0, 30) + (textPart.text.length > 30 ? '...' : '');
            }
          }

          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...conv,
                title,
                messages: [...conv.messages, newMessage],
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      updateLastMessage: (conversationId, updater) => {
        set((state) => {
          const conv = state.conversations[conversationId];
          if (!conv || conv.messages.length === 0) return state;

          const lastIndex = conv.messages.length - 1;
          const lastMessage = { ...conv.messages[lastIndex] };
          updater(lastMessage);

          const newMessages = [...conv.messages];
          newMessages[lastIndex] = lastMessage;

          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...conv,
                messages: newMessages,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      deleteConversation: (id) => set((state) => {
        const newConvs = { ...state.conversations };
        delete newConvs[id];
        return {
          conversations: newConvs,
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId
        };
      }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'nova-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
        sidebarOpen: state.sidebarOpen,
        currentModel: state.currentModel,
        currentWorkspace: state.currentWorkspace,
        providers: state.providers
      }),
    }
  )
);
