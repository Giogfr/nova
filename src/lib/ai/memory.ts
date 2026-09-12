import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface MemoryEntry {
  id: string;
  scope: 'global' | 'project';
  projectId?: string;
  content: string;
  source?: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export function saveMemory(content: string, scope: 'global' | 'project' = 'global', projectId?: string, source = 'user'): MemoryEntry {
  const id = `mem_${uuidv4()}`;
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO memories (id, scope, project_id, content, source, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `);
  stmt.run(id, scope, projectId || null, content, source, now, now);
  return { id, scope, projectId, content, source, enabled: true, createdAt: now, updatedAt: now };
}

export function getRelevantMemories(query: string, scope: 'global' | 'project' = 'global', projectId?: string): MemoryEntry[] {
  let rows: any[] = [];
  if (scope === 'project' && projectId) {
    rows = db.prepare("SELECT * FROM memories WHERE enabled = 1 AND (scope = 'global' OR project_id = ?)").all(projectId);
  } else {
    rows = db.prepare("SELECT * FROM memories WHERE enabled = 1 AND scope = 'global'").all();
  }

  const queryTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return rows.slice(0, 5);

  const scored = rows.map(r => {
    const text = r.content.toLowerCase();
    let score = 0;
    for (const t of queryTokens) {
      if (text.includes(t)) score += 1;
    }
    return { row: r, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.row);
}
