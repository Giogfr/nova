import { executeWebSearch } from './webSearch';
import { childProcessRunCode } from './codeSandboxRunner';
import { db } from '../db';
import fs from 'fs';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  risk: 'read' | 'compute' | 'write' | 'external';
  execute: (input: any) => Promise<any>;
}

// Deterministic Safe Expression Parser (No Function() or eval())
export function safeEvaluateMathExpression(expr: string): number {
  const sanitized = expr.replace(/\s+/g, '');
  if (!/^[0-9+\-*/().^a-z,]+$/i.test(sanitized)) {
    throw new Error('Invalid characters in math expression');
  }

  let pos = 0;

  function peek(): string {
    return sanitized[pos] || '';
  }

  function consume(char?: string): string {
    if (char && peek() !== char) {
      throw new Error(`Expected '${char}' at position ${pos}`);
    }
    return sanitized[pos++];
  }

  function parseNumber(): number {
    const start = pos;
    if (peek() === '-') consume('-');
    while (/[0-9.]/.test(peek())) consume();
    const str = sanitized.slice(start, pos);
    const val = parseFloat(str);
    if (isNaN(val)) throw new Error(`Invalid number '${str}'`);
    return val;
  }

  function parsePrimary(): number {
    if (/[a-z]/i.test(peek())) {
      let funcName = '';
      while (/[a-z]/i.test(peek())) funcName += consume();
      consume('(');
      const arg = parseExpression();
      consume(')');
      if (funcName === 'abs') return Math.abs(arg);
      if (funcName === 'sqrt') return Math.sqrt(arg);
      if (funcName === 'sin') return Math.sin(arg);
      if (funcName === 'cos') return Math.cos(arg);
      if (funcName === 'tan') return Math.tan(arg);
      if (funcName === 'log') return Math.log(arg);
      if (funcName === 'exp') return Math.exp(arg);
      throw new Error(`Unknown function '${funcName}'`);
    }

    if (peek() === '(') {
      consume('(');
      const val = parseExpression();
      consume(')');
      return val;
    }

    return parseNumber();
  }

  function parseExponent(): number {
    let base = parsePrimary();
    while (peek() === '^') {
      consume('^');
      base = Math.pow(base, parsePrimary());
    }
    return base;
  }

  function parseFactor(): number {
    let left = parseExponent();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const right = parseExponent();
      if (op === '*') left *= right;
      if (op === '/') {
        if (right === 0) throw new Error('Division by zero');
        left /= right;
      }
    }
    return left;
  }

  function parseExpression(): number {
    let left = parseFactor();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseFactor();
      if (op === '+') left += right;
      if (op === '-') left -= right;
    }
    return left;
  }

  const result = parseExpression();
  if (pos < sanitized.length) {
    throw new Error(`Unexpected character '${peek()}' at position ${pos}`);
  }
  return result;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition) {
    this.tools.set(tool.id, tool);
  }

  get(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async run(id: string, input: any): Promise<any> {
    const tool = this.tools.get(id);
    if (!tool) throw new Error(`Tool "${id}" not found in registry`);
    return await tool.execute(input);
  }
}

export const defaultToolRegistry = new ToolRegistry();

// Register Default Tools
defaultToolRegistry.register({
  id: 'web_search',
  name: 'Web Search & Citations',
  description: 'Search duckduckgo/web for real-time citations.',
  risk: 'external',
  execute: async (input: { query: string }) => {
    const results = await executeWebSearch(input.query || '');
    return { results };
  }
});

defaultToolRegistry.register({
  id: 'math_solver',
  name: 'Math Solver',
  description: 'Deterministic symbolic expression calculation.',
  risk: 'compute',
  execute: async (input: { expression: string }) => {
    try {
      const result = safeEvaluateMathExpression(input.expression || '0');
      return { expression: input.expression, result };
    } catch (err: any) {
      return { error: err.message || 'Math calculation error' };
    }
  }
});

defaultToolRegistry.register({
  id: 'code_sandbox',
  name: 'Code Sandbox & Execution',
  description: 'Execute JavaScript/Node code in an isolated child process sandbox.',
  risk: 'compute',
  execute: async (input: { code: string; timeoutMs?: number }) => {
    return await childProcessRunCode(input.code || '', input.timeoutMs || 3000);
  }
});

defaultToolRegistry.register({
  id: 'file_analysis',
  name: 'File & Document Analysis',
  description: 'Retrieve and search document content stored in Library persistent assets.',
  risk: 'read',
  execute: async (input: { fileId: string }) => {
    try {
      const file: any = db.prepare('SELECT * FROM library_files WHERE id = ?').get(input.fileId);
      if (!file || !fs.existsSync(file.file_path)) {
        return { error: 'File asset not found in database or disk storage' };
      }
      const content = fs.readFileSync(file.file_path, 'utf-8');
      return { fileId: file.id, name: file.name, mimeType: file.mime_type, sizeBytes: file.size_bytes, contentSnippet: content.slice(0, 4000) };
    } catch (err: any) {
      return { error: err.message };
    }
  }
});

defaultToolRegistry.register({
  id: 'image_generation',
  name: 'Image Diffusion Generation',
  description: 'Generate AI images using connected image diffusion models.',
  risk: 'external',
  execute: async (input: { prompt: string }) => {
    return {
      status: 'Not Configured',
      message: 'No active Image Diffusion Provider is currently configured in Nova Settings.'
    };
  }
});
