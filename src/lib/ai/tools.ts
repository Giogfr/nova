import { executeWebSearch, WebSearchResult } from './webSearch';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  risk: 'read' | 'compute' | 'write' | 'external';
  execute: (input: any) => Promise<any>;
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
      const sanitized = (input.expression || '').replace(/[^0-9+\-*/().]/g, '');
      const evalResult = Function(`"use strict"; return (${sanitized})`)();
      return { expression: input.expression, result: evalResult };
    } catch (err: any) {
      return { error: 'Calculation error' };
    }
  }
});
