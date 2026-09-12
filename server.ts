import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db, FILES_DIR } from './src/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { executeWebSearch } from './src/lib/ai/webSearch';
import { defaultToolRegistry } from './src/lib/ai/tools';
import { saveMemory, getRelevantMemories } from './src/lib/ai/memory';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.raw({ type: ['application/octet-stream', 'image/*', 'application/pdf', 'application/zip'], limit: '100mb' }));

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
          isPinned: Boolean(conv.is_pinned),
          isArchived: Boolean(conv.is_archived),
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
        INSERT INTO conversations (id, title, created_at, updated_at, is_temporary, is_pinned, is_archived, parent_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          updated_at = excluded.updated_at,
          is_temporary = excluded.is_temporary,
          is_pinned = excluded.is_pinned,
          is_archived = excluded.is_archived
      `);

      insertConv.run(
        conversation.id,
        conversation.title || 'New Chat',
        conversation.createdAt || Date.now(),
        conversation.updatedAt || Date.now(),
        conversation.isTemporary ? 1 : 0,
        conversation.isPinned ? 1 : 0,
        conversation.isArchived ? 1 : 0,
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

  // Global SQLite Query Search Endpoint
  app.get('/api/storage/search', (req, res) => {
    try {
      const q = (req.query.q as string || '').trim().toLowerCase();
      if (!q) return res.json({ results: [] });

      const term = `%${q}%`;
      const chatMatches = db.prepare(`
        SELECT DISTINCT c.id, c.title, 'chat' as type FROM conversations c
        LEFT JOIN messages m ON m.conversation_id = c.id
        WHERE LOWER(c.title) LIKE ? OR LOWER(m.parts_json) LIKE ?
        LIMIT 10
      `).all(term, term);

      const projectMatches = db.prepare(`
        SELECT id, name as title, 'project' as type FROM projects
        WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(instructions) LIKE ?
        LIMIT 10
      `).all(term, term, term);

      const fileMatches = db.prepare(`
        SELECT id, name as title, 'file' as type FROM library_files
        WHERE LOWER(name) LIKE ? OR LOWER(mime_type) LIKE ?
        LIMIT 10
      `).all(term, term);

      return res.json({ results: [...chatMatches, ...projectMatches, ...fileMatches] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Memories Endpoints
  app.get('/api/storage/memories', (req, res) => {
    try {
      const memories = db.prepare('SELECT * FROM memories ORDER BY created_at DESC').all();
      return res.json({ memories });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/storage/memories', (req, res) => {
    try {
      const { content, scope, projectId } = req.body;
      const mem = saveMemory(content, scope || 'global', projectId);
      return res.json({ success: true, memory: mem });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/storage/memories/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM memories WHERE id = ?').run(req.params.id);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Tools Configuration Endpoints
  app.get('/api/storage/tools', (req, res) => {
    try {
      const tools = db.prepare('SELECT * FROM tools_config').all();
      return res.json({ tools });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/storage/tools', (req, res) => {
    try {
      const { toolId, enabled } = req.body;
      const stmt = db.prepare(`
        INSERT INTO tools_config (tool_id, enabled, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(tool_id) DO UPDATE SET
          enabled = excluded.enabled,
          updated_at = excluded.updated_at
      `);
      stmt.run(toolId, enabled ? 1 : 0, Date.now());
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Persistent Artifact System Endpoints
  app.get('/api/storage/artifacts/:id', (req, res) => {
    try {
      const artifact: any = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(req.params.id);
      if (!artifact) return res.status(404).json({ error: 'Artifact not found' });
      const versions = db.prepare('SELECT * FROM artifact_versions WHERE artifact_id = ? ORDER BY version_number ASC').all(req.params.id);
      return res.json({ artifact, versions });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/storage/artifacts', (req, res) => {
    try {
      const { id, conversationId, type, title, content, mimeType, sourceMessageId } = req.body;
      const artifactId = id || uuidv4();
      const now = Date.now();

      const existingArtifact: any = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(artifactId);

      if (!existingArtifact) {
        const versionId = uuidv4();
        db.prepare(`
          INSERT INTO artifacts (id, conversation_id, type, title, current_version_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(artifactId, conversationId || null, type || 'html', title || 'Artifact Workspace', versionId, now, now);

        db.prepare(`
          INSERT INTO artifact_versions (id, artifact_id, version_number, content, mime_type, source_message_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(versionId, artifactId, 1, content, mimeType || 'text/html', sourceMessageId || null, now);

        return res.json({ success: true, artifactId, versionId, versionNumber: 1 });
      } else {
        const lastVersion: any = db.prepare('SELECT MAX(version_number) as max_v FROM artifact_versions WHERE artifact_id = ?').get(artifactId);
        const nextVersionNum = (lastVersion?.max_v || 0) + 1;
        const versionId = uuidv4();

        db.prepare(`
          INSERT INTO artifact_versions (id, artifact_id, version_number, content, mime_type, source_message_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(versionId, artifactId, nextVersionNum, content, mimeType || 'text/html', sourceMessageId || null, now);

        db.prepare(`
          UPDATE artifacts SET current_version_id = ?, updated_at = ? WHERE id = ?
        `).run(versionId, now, artifactId);

        return res.json({ success: true, artifactId, versionId, versionNumber: nextVersionNum });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/storage/artifacts/:id/restore', (req, res) => {
    try {
      const { versionId } = req.body;
      const oldVersion: any = db.prepare('SELECT * FROM artifact_versions WHERE id = ? AND artifact_id = ?').get(versionId, req.params.id);
      if (!oldVersion) return res.status(404).json({ error: 'Version not found' });

      const lastVersion: any = db.prepare('SELECT MAX(version_number) as max_v FROM artifact_versions WHERE artifact_id = ?').get(req.params.id);
      const nextVersionNum = (lastVersion?.max_v || 0) + 1;
      const newVersionId = uuidv4();
      const now = Date.now();

      db.prepare(`
        INSERT INTO artifact_versions (id, artifact_id, version_number, content, mime_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(newVersionId, req.params.id, nextVersionNum, oldVersion.content, oldVersion.mime_type, now);

      db.prepare(`
        UPDATE artifacts SET current_version_id = ?, updated_at = ? WHERE id = ?
      `).run(newVersionId, now, req.params.id);

      return res.json({ success: true, versionId: newVersionId, versionNumber: nextVersionNum });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Binary-Safe File & Library Endpoints
  app.get('/api/storage/library', (req, res) => {
    try {
      const files = db.prepare('SELECT * FROM library_files ORDER BY created_at DESC').all();
      return res.json({ files });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/storage/library/upload/binary', (req, res) => {
    try {
      const fileName = (req.query.name as string) || 'unnamed_file';
      const mimeType = (req.query.mimeType as string) || req.headers['content-type'] || 'application/octet-stream';

      const buffer = req.body instanceof Buffer ? req.body : Buffer.from(req.body);
      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: 'Empty file buffer received' });
      }

      const fileId = uuidv4();
      const safeFilename = `${fileId}_${path.basename(fileName).replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const diskPath = path.join(FILES_DIR, safeFilename);

      fs.writeFileSync(diskPath, buffer);
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
      const sizeBytes = buffer.length;

      const stmt = db.prepare(`
        INSERT INTO library_files (id, name, file_path, mime_type, size_bytes, checksum, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(fileId, fileName, diskPath, mimeType, sizeBytes, checksum, Date.now());

      return res.json({
        success: true,
        file: { id: fileId, name: fileName, filePath: diskPath, mimeType, sizeBytes, checksum, createdAt: Date.now() }
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

      const isTextual = file.mime_type?.startsWith('text/') ||
                        file.mime_type?.includes('json') ||
                        file.mime_type?.includes('csv') ||
                        file.name?.endsWith('.txt') ||
                        file.name?.endsWith('.md') ||
                        file.name?.endsWith('.json') ||
                        file.name?.endsWith('.csv') ||
                        file.name?.endsWith('.ts') ||
                        file.name?.endsWith('.js') ||
                        file.name?.endsWith('.py');

      if (isTextual) {
        const content = fs.readFileSync(file.file_path, 'utf-8');
        return res.json({ file, content, isBinary: false });
      } else {
        return res.json({ file, content: '[Binary Data - Cannot render directly as text]', isBinary: true });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/storage/library/file/:id/download', (req, res) => {
    try {
      const file: any = db.prepare('SELECT * FROM library_files WHERE id = ?').get(req.params.id);
      if (!file || !fs.existsSync(file.file_path)) {
        return res.status(404).json({ error: 'File not found' });
      }
      res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
      const fileStream = fs.createReadStream(file.file_path);
      fileStream.pipe(res);
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

  // Projects Relational Endpoints
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
      const { id, name, description, instructions, icon, color, memoryMode, defaultModel } = req.body;
      const stmt = db.prepare(`
        INSERT INTO projects (id, name, description, instructions, icon, color, memory_mode, default_model, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          instructions = excluded.instructions,
          icon = excluded.icon,
          color = excluded.color,
          memory_mode = excluded.memory_mode,
          default_model = excluded.default_model,
          updated_at = excluded.updated_at
      `);
      const now = Date.now();
      stmt.run(id, name, description || '', instructions || '', icon || 'Folder', color || '#3b82f6', memoryMode || 'default', defaultModel || null, now, now);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/storage/projects/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM project_files WHERE project_id = ?').run(req.params.id);
      db.prepare('DELETE FROM project_conversations WHERE project_id = ?').run(req.params.id);
      db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/storage/projects/:id/files', (req, res) => {
    try {
      const files = db.prepare(`
        SELECT lf.* FROM library_files lf
        JOIN project_files pf ON pf.library_file_id = lf.id
        WHERE pf.project_id = ?
        ORDER BY pf.added_at DESC
      `).all(req.params.id);
      return res.json({ files });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/storage/projects/:id/files', (req, res) => {
    try {
      const { libraryFileId } = req.body;
      const stmt = db.prepare(`
        INSERT INTO project_files (project_id, library_file_id, added_at)
        VALUES (?, ?, ?)
        ON CONFLICT(project_id, library_file_id) DO NOTHING
      `);
      stmt.run(req.params.id, libraryFileId, Date.now());
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/storage/projects/:id/files/:fileId', (req, res) => {
    try {
      db.prepare('DELETE FROM project_files WHERE project_id = ? AND library_file_id = ?').run(req.params.id, req.params.fileId);
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

  // Main Streaming Universal Chat Proxy API
  app.post('/api/chat', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const { modelId, providerConfig, messages, reasoningEffort, systemInstruction, toolsEnabled } = req.body;

      const providerType = providerConfig?.type || 'gemini';
      const apiKey = providerConfig?.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;

      const lastUserMsg = messages[messages.length - 1]?.content || '';

      if (toolsEnabled && (lastUserMsg.toLowerCase().startsWith('research:') || lastUserMsg.toLowerCase().includes('search web'))) {
        const searchQuery = lastUserMsg.replace(/^research:\s*/i, '').replace(/search web\s*/i, '').trim();
        sendEvent(res, { type: 'tool_start', toolCall: { id: uuidv4(), name: 'Web Search', args: JSON.stringify({ query: searchQuery }) } });

        const searchResults = await executeWebSearch(searchQuery);
        sendEvent(res, { type: 'tool_complete', toolCall: { id: uuidv4(), name: 'Web Search', result: JSON.stringify(searchResults) } });

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
