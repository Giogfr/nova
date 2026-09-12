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
  parentId?: string;
  isTemporary?: boolean;
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
  apiKey?: string;
}

export interface Model {
  id: string;
  name: string;
  providerId: string;
  contextWindow?: string;
  capabilities: string[];
}

interface AppState {
  conversations: Record<string, Conversation>;
  currentConversationId: string | null;
  sidebarOpen: boolean;
  currentModel: string;
  currentWorkspace: string;
  providers: Provider[];
  models: Model[];
  
  loadFromBackend: () => Promise<void>;
  syncConversationToBackend: (conv: Conversation) => Promise<void>;
  setProviders: (providers: Provider[]) => void;
  updateProvider: (id: string, updates: Partial<Provider>) => void;
  setModels: (models: Model[]) => void;
  
  setCurrentWorkspace: (ws: string) => void;
  setCurrentModel: (model: string) => void;
  createConversation: (isTemporary?: boolean) => string;
  branchConversation: (conversationId: string, fromMessageId: string) => string;
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

      loadFromBackend: async () => {
        try {
          const resp = await fetch('/api/storage/conversations');
          if (resp.ok) {
            const json = await resp.json();
            if (json.conversations) {
              set(state => ({
                conversations: { ...state.conversations, ...json.conversations }
              }));
            }
          }
        } catch (err) {
          console.warn('Backend SQLite hydration failed, relying on local cache:', err);
        }
      },

      syncConversationToBackend: async (conv: Conversation) => {
        if (conv.isTemporary) return;
        try {
          await fetch('/api/storage/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation: conv }),
          });
        } catch (err) {
          console.error('Failed to sync conversation to SQLite:', err);
        }
      },

      setProviders: (providers) => set({ providers }),
      updateProvider: (id, updates) => set(state => ({
        providers: state.providers.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      setModels: (models) => set({ models }),

      setCurrentWorkspace: (ws) => set({ currentWorkspace: ws }),
      setCurrentModel: (model) => set({ currentModel: model }),

      createConversation: (isTemporary = false) => {
        const id = uuidv4();
        const newConv: Conversation = {
          id,
          title: isTemporary ? 'Temporary Chat' : 'New Chat',
          messages: [],
          updatedAt: Date.now(),
          isTemporary,
        };
        set((state) => ({
          conversations: { ...state.conversations, [id]: newConv },
          currentConversationId: id,
        }));
        if (!isTemporary) {
          get().syncConversationToBackend(newConv);
        }
        return id;
      },

      branchConversation: (conversationId, fromMessageId) => {
        const state = get();
        const targetConv = state.conversations[conversationId];
        if (!targetConv) return conversationId;

        const messageIdx = targetConv.messages.findIndex(m => m.id === fromMessageId);
        const slicedMessages = messageIdx !== -1 ? targetConv.messages.slice(0, messageIdx + 1) : targetConv.messages;

        const newId = uuidv4();
        const branchedConv: Conversation = {
          id: newId,
          title: `${targetConv.title} (Branch)`,
          messages: JSON.parse(JSON.stringify(slicedMessages)),
          updatedAt: Date.now(),
          parentId: conversationId,
        };

        set((s) => ({
          conversations: { ...s.conversations, [newId]: branchedConv },
          currentConversationId: newId,
        }));
        get().syncConversationToBackend(branchedConv);
        return newId;
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
          if (conv.messages.length === 0 && role === 'user' && !conv.isTemporary) {
            const textPart = parts.find(p => p.type === 'text');
            if (textPart && textPart.type === 'text') {
               title = textPart.text.slice(0, 30) + (textPart.text.length > 30 ? '...' : '');
            }
          }

          const updatedConv = {
            ...conv,
            title,
            messages: [...conv.messages, newMessage],
            updatedAt: Date.now(),
          };

          get().syncConversationToBackend(updatedConv);

          return {
            conversations: {
              ...state.conversations,
              [conversationId]: updatedConv,
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

          const updatedConv = {
            ...conv,
            messages: newMessages,
            updatedAt: Date.now(),
          };

          get().syncConversationToBackend(updatedConv);

          return {
            conversations: {
              ...state.conversations,
              [conversationId]: updatedConv,
            },
          };
        });
      },

      deleteConversation: (id) => {
        fetch(`/api/storage/conversations/${id}`, { method: 'DELETE' }).catch(() => {});
        set((state) => {
          const newConvs = { ...state.conversations };
          delete newConvs[id];
          return {
            conversations: newConvs,
            currentConversationId: state.currentConversationId === id ? null : state.currentConversationId
          };
        });
      },

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'nova-storage',
      partialize: (state) => {
        const persistentConversations: Record<string, Conversation> = {};
        for (const [id, conv] of Object.entries(state.conversations)) {
          if (!conv.isTemporary) {
            persistentConversations[id] = conv;
          }
        }
        return {
          conversations: persistentConversations,
          currentConversationId: state.currentConversationId,
          sidebarOpen: state.sidebarOpen,
          currentModel: state.currentModel,
          currentWorkspace: state.currentWorkspace,
          providers: state.providers
        };
      },
    }
  )
);
