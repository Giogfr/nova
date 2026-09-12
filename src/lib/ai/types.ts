export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'xai'
  | 'openrouter'
  | 'deepseek'
  | 'groq'
  | 'together'
  | 'fireworks'
  | 'mistral'
  | 'cerebras'
  | 'azure'
  | 'ollama'
  | 'lmstudio'
  | 'custom';

export interface ProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  customHeaders?: Record<string, string>;
  status?: 'connected' | 'offline' | 'unknown' | 'error';
}

export interface ModelMetadata {
  id: string;
  name: string;
  providerId: string;
  contextWindow?: number;
  capabilities: ('vision' | 'tools' | 'reasoning' | 'image-gen')[];
  isLocal?: boolean;
}

export type StreamEventType =
  | 'text_delta'
  | 'reasoning_delta'
  | 'tool_start'
  | 'tool_delta'
  | 'tool_complete'
  | 'citation'
  | 'usage'
  | 'error'
  | 'done';

export interface StreamEvent {
  type: StreamEventType;
  text?: string;
  reasoning?: string;
  toolCall?: { id: string; name: string; args?: string; result?: string };
  citation?: { title: string; url: string; snippet?: string };
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  error?: string;
}

export interface ChatRequestPayload {
  modelId: string;
  providerId: string;
  providerConfig?: ProviderConfig;
  messages: { role: string; content: string; parts?: any[] }[];
  temperature?: number;
  reasoningEffort?: 'off' | 'low' | 'medium' | 'high';
  toolsEnabled?: boolean;
  webSearchEnabled?: boolean;
  systemInstruction?: string;
}
