import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'nova_store.json');

interface StorageSchema {
  conversations: Record<string, any>;
  projects: any[];
  library: any[];
  settings: Record<string, any>;
}

function loadDb(): StorageSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to read storage DB file:', err);
  }
  return { conversations: {}, projects: [], library: [], settings: {} };
}

function saveDb(data: StorageSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save storage DB file:', err);
  }
}

export const db = {
  get: () => loadDb(),
  update: (updater: (draft: StorageSchema) => void) => {
    const current = loadDb();
    updater(current);
    saveDb(current);
    return current;
  }
};
