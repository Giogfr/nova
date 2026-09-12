# NOVA — System Audit & Status (`NOVA_GAPS.md`)

## Pass 4 Completed Systems
1. **SQLite Database Engine with Versioned Migrations:**
   - WAL mode enabled with `PRAGMA foreign_keys = ON;`.
   - Table schemas for `conversations`, `messages`, `projects`, `project_conversations`, `library_files`, `project_files`, `artifacts`, `artifact_versions`, `memories`, `tools_config`, `settings`, `provider_secrets`, and `usage_events`.

2. **Binary-Safe File & Library Management:**
   - Raw binary uploads (`/api/storage/library/upload/binary`) write Buffer streams to `data/files/` with SHA-256 checksums.
   - Text preview, binary downloads, and file-to-project attachments.

3. **Persistent Multi-Version Artifact Workspace:**
   - `artifacts` and `artifact_versions` tables track every version created or modified.
   - Resizable workspace with drag handle, stored width, fullscreen mode, Preview/Source/Versions tabs, old version restoration, and sandboxed iframe preview.

4. **Central Tool Registry & Settings Integration:**
   - Safe math solver (recursive descent parser without `eval()`).
   - Isolated Node child-process code sandbox runner (`childProcessRunCode`).
   - Tool enablement synchronized between `ToolsView.tsx` and SQLite `tools_config`.

5. **Relational Projects & Sidebar Context Actions:**
   - Relational Project Workspace with Chats, Files, Instructions, and Settings tabs.
   - Sidebar actions for Pin/Unpin, Archive/Restore, Rename, Delete, and Fork Branch.

6. **Real Memory System & Search Scaling:**
   - Global and project-scoped memory retrieval (`saveMemory`, `getRelevantMemories`).
   - Scalable search via SQLite `/api/storage/search` across chats, messages, projects, and library files.
   - Complete 16-command slash registry (`SlashCommandMenu.tsx`).

---

## Technical Notes
- Multi-user authentication remains optional for local single-tenant desktop/server deployment.
