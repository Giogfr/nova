# NOVA — Remaining Gaps & Future Roadmap (`NOVA_GAPS.md`)

## Pass 2 Completed Items
- **Durable Server Store:** Implemented JSON database engine (`data/nova_store.json`) via `/api/storage` endpoints.
- **ChatGPT-Style Context Menus:** Added conversation renaming and soft/hard deletion with persistent state in sidebar.
- **Message Tree Branching:** Implemented `branchConversation()` enabling forking chat trees at any message node.
- **Real Global Search:** Search filter across chat titles, message text, and workspace subpages in `CommandPalette.tsx`.
- **Temporary Chat Mode:** Non-persisted temporary chat state isolated from long-term memory.
- **Huge Paste Auto-Conversion:** Composer detects pasted text > 1500 chars and converts it to attached text document.
- **Document Chunking & Web Search:** Built `retrieval.ts` for text chunking and `webSearch.ts` for live citation retrieval.

---

## Remaining Gaps
1. **Multi-User Role-Based Authentication:** Currently single-tenant local/self-hosted deployment without OAuth/JWT login required.
2. **Local Embedding Vector DB:** Keyword-based document chunking search is active. Vector embedding search (e.g. via local ONNX/Ollama embeddings) can be wired for massive 10,000+ page libraries.
