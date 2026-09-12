import { StreamEvent, ChatRequestPayload, ProviderConfig } from './types';

export async function sendStreamRequest(
  payload: ChatRequestPayload,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP status ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('ReadableStream reader unavailable');

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        const line = block.trim();
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.replace(/^data:\s*/, '');

        try {
          const event: StreamEvent = JSON.parse(jsonStr);
          onEvent(event);
        } catch (e) {
          console.warn('Failed to parse SSE line:', jsonStr);
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    onEvent({ type: 'error', error: err.message || 'Stream connection failed' });
    throw err;
  }
}

export async function testProviderConnection(config: Partial<ProviderConfig>): Promise<{ success: boolean; error?: string; modelsCount?: number }> {
  try {
    const resp = await fetch('/api/providers/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return await resp.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function fetchRemoteModels(config: Partial<ProviderConfig>): Promise<any[]> {
  try {
    const resp = await fetch('/api/models/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const data = await resp.json();
    return data.models || [];
  } catch (err) {
    return [];
  }
}
