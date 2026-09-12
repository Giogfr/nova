# NOVA — Defect Ledger (`NOVA_DEFECTS.md`)

| Defect ID | Severity | Feature Area | Description | Resolution Plan |
| :--- | :--- | :--- | :--- | :--- |
| **DEF-001** | **P0 (Critical)** | AI Gateway | `server.ts` hardcodes Gemini API and fails if `GEMINI_API_KEY` is not present, ignoring user-configured providers. | Build dynamic proxy route supporting multi-provider configuration (OpenAI, Anthropic, Gemini, Ollama, OpenRouter, etc.). |
| **DEF-002** | **P0 (Critical)** | Stream Handling | Client streaming fails to handle structured events (reasoning tokens, tool calls, errors). | Implement normalized SSE/Chunk parser for `text_delta`, `reasoning_delta`, `tool_call`, and `usage`. |
| **DEF-003** | **P1 (Major)** | Interactive Controls | Composer buttons for Thinking, Tools, and Voice trigger raw browser `alert()` dialogs. | Wire buttons to active tool state toggles, reasoning selector, and dictation parser. |
| **DEF-004** | **P1 (Major)** | Slash Commands | Selecting slash command inserts text but triggers no real workflow or prompt injection. | Implement dynamic command registry that executes actions or formats input context. |
| **DEF-005** | **P1 (Major)** | Artifact Panel | Clicking artifact button opens empty side panel with no code execution or HTML rendering capabilities. | Create live artifact renderer with iframe sandbox, source toggle, copy/download, and versioning. |
| **DEF-006** | **P1 (Major)** | Provider Testing | "Test Connection" button in Provider Settings only checks string length without making network test. | Implement backend `/api/providers/test` endpoint that performs real API ping. |
| **DEF-007** | **P2 (Normal)** | Projects System | Projects page displays static cards ("Nova OS Redesign") with no file attachment or custom instructions. | Build functional project state machine with instruction injection and chat assignment. |
| **DEF-008** | **P2 (Normal)** | Ollama Integration | Ollama settings do not discover installed local models or check endpoint status. | Build Ollama health check & `/api/tags` model fetch backend proxy. |
| **DEF-009** | **P2 (Normal)** | TopBar Actions | TopBar "Share" button shows static `alert()` instead of functional export or copy link. | Implement chat export (Markdown / JSON) and clean link handler. |
| **DEF-010** | **P3 (Polish)** | Secondary Views | Prompts, Tools, Agents, and Library views look like disconnected static dashboards. | Restyle secondary views with unified design tokens and functional actions. |
