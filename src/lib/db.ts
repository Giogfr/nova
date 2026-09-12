import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES_DIR = path.join(DATA_DIR, 'files');
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'nova.db');
const db = new Database(DB_PATH);

// Enable WAL mode & foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema Migration System
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at INTEGER NOT NULL
  );
`);

function runMigrations() {
  const currentVersionRow: any = db.prepare('SELECT MAX(version) as max_version FROM schema_migrations').get();
  const currentVersion = currentVersionRow?.max_version || 0;

  const migrations = [
    {
      version: 1,
      name: 'initial_sqlite_schema',
      up: () => {
        db.exec(`
          CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            is_temporary INTEGER DEFAULT 0,
            is_pinned INTEGER DEFAULT 0,
            is_archived INTEGER DEFAULT 0,
            parent_id TEXT
          );

          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            parts_json TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            instructions TEXT,
            icon TEXT DEFAULT 'Folder',
            color TEXT DEFAULT '#3b82f6',
            memory_mode TEXT DEFAULT 'default',
            default_model TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE TABLE IF NOT EXISTS project_conversations (
            project_id TEXT NOT NULL,
            conversation_id TEXT NOT NULL,
            added_at INTEGER NOT NULL,
            PRIMARY KEY (project_id, conversation_id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS library_files (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            mime_type TEXT,
            size_bytes INTEGER,
            checksum TEXT,
            created_at INTEGER NOT NULL
          );

          CREATE TABLE IF NOT EXISTS project_files (
            project_id TEXT NOT NULL,
            library_file_id TEXT NOT NULL,
            added_at INTEGER NOT NULL,
            PRIMARY KEY (project_id, library_file_id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (library_file_id) REFERENCES library_files(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS artifacts (
            id TEXT PRIMARY KEY,
            conversation_id TEXT,
            type TEXT NOT NULL DEFAULT 'html',
            title TEXT NOT NULL,
            current_version_id TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
          );

          CREATE TABLE IF NOT EXISTS artifact_versions (
            id TEXT PRIMARY KEY,
            artifact_id TEXT NOT NULL,
            version_number INTEGER NOT NULL,
            content TEXT NOT NULL,
            mime_type TEXT DEFAULT 'text/html',
            source_message_id TEXT,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            scope TEXT NOT NULL DEFAULT 'global',
            project_id TEXT,
            content TEXT NOT NULL,
            source TEXT,
            enabled INTEGER DEFAULT 1,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS tools_config (
            tool_id TEXT PRIMARY KEY,
            enabled INTEGER DEFAULT 1,
            updated_at INTEGER NOT NULL
          );

          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS provider_secrets (
            provider_id TEXT PRIMARY KEY,
            encrypted_key TEXT NOT NULL,
            updated_at INTEGER NOT NULL
          );

          CREATE TABLE IF NOT EXISTS usage_events (
            id TEXT PRIMARY KEY,
            conversation_id TEXT,
            model_id TEXT NOT NULL,
            provider_id TEXT NOT NULL,
            prompt_tokens INTEGER DEFAULT 0,
            completion_tokens INTEGER DEFAULT 0,
            total_tokens INTEGER DEFAULT 0,
            duration_ms INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL
          );
        `);
      }
    },
    {
      version: 2,
      name: 'fts_search_indexes',
      up: () => {
        db.exec(`
          CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
          CREATE INDEX IF NOT EXISTS idx_conv_updated ON conversations(updated_at DESC);
          CREATE INDEX IF NOT EXISTS idx_artifacts_conv ON artifacts(conversation_id);
          CREATE INDEX IF NOT EXISTS idx_art_versions_art ON artifact_versions(artifact_id);
        `);
      }
    }
  ];

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      db.transaction(() => {
        migration.up();
        db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
          migration.version,
          migration.name,
          Date.now()
        );
      })();
    }
  }
}

runMigrations();

export { db, DATA_DIR, FILES_DIR };
