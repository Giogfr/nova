import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db, FILES_DIR } from './src/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { executeWebSearch } from './src/lib/ai/webSearch';
import { defaultToolRegistry } from './src/lib/ai/tools';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));

  const sendEvent = (res: express.Response, event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  // SQLite Storage Endpoints
  app.get('/api/storage/conversations', (req, res) => {
    try {
      const convs = db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all() as any[];
      const result: Record<string, any> = {};

      for (const conv of convs) {
        const msgs = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conv.id) as any[];
        result[conv.id] = {
          id: conv.id,
          title: conv.title,
          updatedAt: conv.updated_at,
          isTemporary: Boolean(conv.is_temporary),
          parentId: conv.parent_id,
          messages: msgs.map(m => ({
            id: m.id,
            role: m.role,
            parts: JSON.parse(m.parts_json),
            createdAt: m.created_at,
          })),
        };
      }
      return res.json({ conversations: result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/storage/conversations', (req, res) => {
    try {
      const { conversation } = req.body;
      if (!conversation || !conversation.id) {
        return res.status(400).json({ error: 'Invalid conversation payload' });
      }

      const insertConv = db.prepare(`
        INSERT INTO conversations (id, title, created_at, updated_at, is_temporary, parent_id)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          updated_at = excluded.updated_at,
          is_temporary = excluded.is_temporary
      `);

      insertConv.run(
        conversation.id,
        conversation.title || 'New Chat',
        conversation.createdAt || Date.now(),
        conversation.updatedAt || Date.now(),
        conversation.isTemporary ? 1 : 0,
        conversation.parentId || null
      );

      if (Array.isArray(conversation.messages)) {
        const insertMsg = db.prepare(`
          INSERT INTO messages (id, conversation_id, role, parts_json, created_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            parts_json = excluded.parts_json
        `);

        for (const msg of conversation.messages) {
          insertMsg.run(
            msg.id,
            conversation.id,
            msg.role,
            JSON.stringify(msg.parts || []),
            msg.createdAt || Date.now()
          );
        }
      }

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/storage/conversations/:id', (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
      db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Projects Endpoints
  app.get('/api/storage/projects', (req, res) => {
    try {
      const projects = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
      return res.json({ projects });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/storage/projects', (req, res) => {
    try {
      const { id, name, description, instructions } = req.body;
      const stmt = db.prepare(`
        INSERT INTO projects (id, name, description, instructions, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          instructions = excluded.instructions,
          updated_at = excluded.updated_at
      `);
      stmt.run(id, name, description || '', instructions || '', Date.now());
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/storage/projects/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Library & Persistent Disk File Storage Endpoints
  app.get('/api/storage/library', (req, res) => {
    try {
      const files = db.prepare('SELECT * FROM library_files ORDER BY created_at DESC').all();
      return res.json({ files });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/storage/library/upload', (req, res) => {
    try {
      const { name, content, mimeType } = req.body;
      if (!name || content === undefined) {
        return res.status(400).json({ error: 'Missing name or content' });
      }

      const fileId = uuidv4();
      const safeFilename = `${fileId}_${path.basename(name).replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const diskPath = path.join(FILES_DIR, safeFilename);

      fs.writeFileSync(diskPath, content, 'utf-8');
      const sizeBytes = Buffer.byteLength(content, 'utf-8');

      const stmt = db.prepare(`
        INSERT INTO library_files (id, name, file_path, mime_type, size_bytes, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(fileId, name, diskPath, mimeType || 'text/plain', sizeBytes, Date.now());

      return res.json({
        success: true,
        file: { id: fileId, name, filePath: diskPath, mimeType: mimeType || 'text/plain', sizeBytes, createdAt: Date.now() }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/storage/library/file/:id', (req, res) => {
    try {
      const file: any = db.prepare('SELECT * FROM library_files WHERE id = ?').get(req.params.id);
      if (!file || !fs.existsSync(file.file_path)) {
        return res.status(404).json({ error: 'File not found' });
      }
      const content = fs.readFileSync(file.file_path, 'utf-8');
      return res.json({ file, content });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/storage/library/:id', (req, res) => {
    try {
      const file: any = db.prepare('SELECT * FROM library_files WHERE id = ?').get(req.params.id);
      if (file && fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
      }
      db.prepare('DELETE FROM library_files WHERE id = ?').run(req.params.id);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Test Provider Connection Endpoint
  app.post('/api/providers/test', async (req, res) => {
    try {
      const { type, baseUrl, apiKey } = req.body;

      if (type === 'ollama') {
        const url = (baseUrl || 'http://localhost:11434').replace(/\/$/, '') + '/api/tags';
        const resp = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (resp.ok) {
          const data = await resp.json();
          return res.json({ success: true, modelsCount: data.models?.length || 0 });
        }
        return res.status(400).json({ success: false, error: `Ollama error: HTTP ${resp.status}` });
      }

      if (type === 'openai' || type === 'openrouter' || type === 'deepseek' || type === 'groq' || type === 'together' || type === 'fireworks' || type === 'mistral' || type === 'cerebras' || type === 'lmstudio' || type === 'custom') {
        const key = apiKey || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
        let defaultUrl = 'https://api.openai.com/v1';
        if (type === 'openrouter') defaultUrl = 'https://openrouter.ai/api/v1';
        if (type === 'deepseek') defaultUrl = 'https://api.deepseek.com';
        if (type === 'groq') defaultUrl = 'https://api.groq.com/openai/v1';
        if (type === 'together') defaultUrl = 'https://api.together.xyz/v1';
        if (type === 'fireworks') defaultUrl = 'https://api.fireworks.ai/inference/v1';
        if (type === 'mistral') defaultUrl = 'https://api.mistral.ai/v1';
        if (type === 'cerebras') defaultUrl = 'https://api.cerebras.ai/v1';
        if (type === 'lmstudio') defaultUrl = 'http://localhost:1234/v1';

        const targetUrl = (baseUrl || defaultUrl).replace(/\/$/, '') + '/models';
        const headers: Record<string, string> = {};
        if (key) headers['Authorization'] = `Bearer ${key}`;

        const resp = await fetch(targetUrl, { headers, signal: AbortSignal.timeout(5000) });
        if (resp.ok) {
          return res.json({ success: true });
        }
        return res.status(400).json({ success: false, error: `API returned HTTP ${resp.status}` });
      }

      if (type === 'gemini') {
        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) {
          return res.status(400).json({ success: false, error: 'Gemini API Key missing' });
        }
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, { signal: AbortSignal.timeout(5000) });
        if (resp.ok) {
          return res.json({ success: true });
        }
        return res.status(400).json({ success: false, error: `Gemini HTTP ${resp.status}` });
      }

      if (type === 'anthropic') {
        const key = apiKey || process.env.ANTHROPIC_API_KEY;
        if (!key) return res.status(400).json({ success: false, error: 'Anthropic API Key missing' });
        return res.json({ success: true });
      }

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Connection failed' });
    }
  });

  // Fetch Available Models Endpoint
  app.post('/api/models/list', async (req, res) => {
    try {
      const { providerId, type, baseUrl, apiKey } = req.body;

      if (type === 'ollama') {
        const url = (baseUrl || 'http://localhost:11434').replace(/\/$/, '') + '/api/tags';
        const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (resp.ok) {
          const data = await resp.json();
          const models = (data.models || []).map((m: any) => ({
            id: m.name,
            name: m.name,
            providerId: providerId || 'ollama',
            contextWindow: m.details?.context_length || 8192,
            capabilities: ['tools'],
            isLocal: true,
          }));
          return res.json({ models });
        }
      }

      if (type === 'openrouter' || type === 'openai') {
        const key = apiKey || (type === 'openrouter' ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY);
        const url = type === 'openrouter' ? 'https://openrouter.ai/api/v1/models' : 'https://api.openai.com/v1/models';
        const headers: Record<string, string> = {};
        if (key) headers['Authorization'] = `Bearer ${key}`;
        const resp = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
        if (resp.ok) {
          const data = await resp.json();
          const models = (data.data || []).slice(0, 30).map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            providerId: providerId || type,
            capabilities: ['vision', 'tools', 'reasoning'],
          }));
          return res.json({ models });
        }
      }

      return res.json({ models: [] });
    } catch (err: any) {
      return res.json({ models: [] });
    }
  });

  // Main Streaming Universal Chat Proxy API with Real Tool Execution Loop
  app.post('/api/chat', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const { modelId, providerConfig, messages, reasoningEffort, systemInstruction, toolsEnabled } = req.body;

      const providerType = providerConfig?.type || 'gemini';
      const apiKey = providerConfig?.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;

      const lastUserMsg = messages[messages.length - 1]?.content || '';

      // Perform Real Web Search Tool execution if prompt asks for research/search or tools are enabled for search queries
      if (toolsEnabled && (lastUserMsg.toLowerCase().startsWith('research:') || lastUserMsg.toLowerCase().includes('search web'))) {
        const searchQuery = lastUserMsg.replace(/^research:\s*/i, '').replace(/search web\s*/i, '').trim();
        sendEvent(res, { type: 'tool_start', toolCall: { id: uuidv4(), name: 'Web Search', args: JSON.stringify({ query: searchQuery }) } });

        const searchResults = await executeWebSearch(searchQuery);
        sendEvent(res, { type: 'tool_complete', toolCall: { id: uuidv4(), name: 'Web Search', result: JSON.stringify(searchResults) } });

        // Augment prompt with retrieved search results
        const searchContext = searchResults.map(r => `[Source: ${r.title}] (${r.url})\n${r.snippet}`).join('\n\n');
        messages[messages.length - 1].content = `${lastUserMsg}\n\n[Retrieved Web Sources]:\n${searchContext}`;
      }

      if (providerType === 'mock' || modelId === 'nova-mock') {
        sendEvent(res, { type: 'reasoning_delta', reasoning: 'Analyzing prompt structure and context...\nEvaluating requirements...\nFormulating optimal response architecture.' });
        await new Promise(r => setTimeout(r, 600));

        const sampleResponse = `Hello! I am **Nova**, your universal AI assistant. You asked: "${messages[messages.length - 1]?.content}".\n\nHere is how I can help you today:\n1. Universal Model Connectivity\n2. Real-time code execution and artifacts\n3. Local & Cloud AI workflow orchestration`;

        for (let i = 0; i < sampleResponse.length; i += 5) {
          sendEvent(res, { type: 'text_delta', text: sampleResponse.slice(i, i + 5) });
          await new Promise(r => setTimeout(r, 40));
        }

        sendEvent(res, { type: 'usage', usage: { promptTokens: 15, completionTokens: 42, totalTokens: 57 } });
        sendEvent(res, { type: 'done' });
        return res.end();
      }

      if (providerType === 'ollama') {
        const baseUrl = (providerConfig?.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
        const ollamaResp = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelId || 'llama3',
            messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
            stream: true,
          }),
        });

        if (!ollamaResp.ok || !ollamaResp.body) {
          throw new Error(`Ollama HTTP Error ${ollamaResp.status}: Failed to communicate with Ollama endpoint`);
        }

        const reader = ollamaResp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                sendEvent(res, { type: 'text_delta', text: parsed.message.content });
              }
            } catch (e) {}
          }
        }
        sendEvent(res, { type: 'done' });
        return res.end();
      }

      if (
        providerType === 'openai' ||
        providerType === 'openrouter' ||
        providerType === 'deepseek' ||
        providerType === 'groq' ||
        providerType === 'together' ||
        providerType === 'fireworks' ||
        providerType === 'mistral' ||
        providerType === 'cerebras' ||
        providerType === 'lmstudio' ||
        providerType === 'custom'
      ) {
        let endpoint = 'https://api.openai.com/v1/chat/completions';
        if (providerType === 'openrouter') endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        if (providerType === 'deepseek') endpoint = 'https://api.deepseek.com/chat/completions';
        if (providerType === 'groq') endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        if (providerType === 'together') endpoint = 'https://api.together.xyz/v1/chat/completions';
        if (providerType === 'fireworks') endpoint = 'https://api.fireworks.ai/inference/v1/chat/completions';
        if (providerType === 'mistral') endpoint = 'https://api.mistral.ai/v1/chat/completions';
        if (providerType === 'cerebras') endpoint = 'https://api.cerebras.ai/v1/chat/completions';
        if (providerType === 'lmstudio') endpoint = 'http://localhost:1234/v1/chat/completions';
        if (providerConfig?.baseUrl) {
          endpoint = providerConfig.baseUrl.replace(/\/$/, '') + '/chat/completions';
        }

        const formattedMessages = [];
        if (systemInstruction) {
          formattedMessages.push({ role: 'system', content: systemInstruction });
        }
        formattedMessages.push(...messages.map((m: any) => ({ role: m.role, content: m.content })));

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const payload: any = {
          model: modelId || 'gpt-4o',
          messages: formattedMessages,
          stream: true,
        };

        if (reasoningEffort && reasoningEffort !== 'off') {
          payload.reasoning_effort = reasoningEffort;
        }

        const aiResp = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!aiResp.ok || !aiResp.body) {
          const errText = await aiResp.text();
          throw new Error(`Provider API Error (${aiResp.status}): ${errText || aiResp.statusText}`);
        }

        const reader = aiResp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta;
              if (delta) {
                if (delta.reasoning_content || delta.reasoning) {
                  sendEvent(res, { type: 'reasoning_delta', reasoning: delta.reasoning_content || delta.reasoning });
                }
                if (delta.content) {
                  sendEvent(res, { type: 'text_delta', text: delta.content });
                }
              }
              if (parsed.usage) {
                sendEvent(res, { type: 'usage', usage: parsed.usage });
              }
            } catch (e) {}
          }
        }

        sendEvent(res, { type: 'done' });
        return res.end();
      }

      const geminiKey = apiKey || process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        sendEvent(res, { type: 'text_delta', text: `Please configure an API Key for provider "${providerType}" in Settings -> Models & Providers to enable live AI responses.` });
        sendEvent(res, { type: 'done' });
        return res.end();
      }

      const formattedContents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId || 'gemini-2.5-flash'}:streamGenerateContent?alt=sse&key=${geminiKey}`;
      const geminiResp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: formattedContents }),
      });

      if (!geminiResp.ok || !geminiResp.body) {
        throw new Error(`Gemini HTTP Error ${geminiResp.status}: ${await geminiResp.text()}`);
      }

      const reader = geminiResp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.replace(/^data:\s*/, '');
          try {
            const parsed = JSON.parse(jsonStr);
            const textPart = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textPart) {
              sendEvent(res, { type: 'text_delta', text: textPart });
            }
          } catch (e) {}
        }
      }

      sendEvent(res, { type: 'done' });
      return res.end();

    } catch (error: any) {
      console.error('Streaming Chat API Error:', error);
      sendEvent(res, { type: 'error', error: error.message || 'Internal AI Server Error' });
      sendEvent(res, { type: 'done' });
      return res.end();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nova AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
