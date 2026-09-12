# NOVA — Comprehensive Audit Report (`NOVA_AUDIT.md`)

## Executive Summary
Nova is currently a single-page Vite + React 19 web application backed by a lightweight Express server (`server.ts`). While the central home and chat composer styling are visually clean and modern, many secondary views and features were left incomplete, mock-heavy, or non-functional by the previous AI implementation.

---

## Architecture & Tech Stack
- **Frontend Framework:** React 19 with Vite 6 & React Router v7.
- **State Management:** Zustand with `localStorage` persistence (`nova-storage`).
- **Styling:** Tailwind CSS v4, Lucide React icons, Radix UI primitives.
- **Backend:** Express server running on port 3000 handling SPA routing and direct Google Gemini streaming via `@google/genai`.
- **Markdown & Math:** `react-markdown`, `remark-math`, `rehype-katex`, `react-syntax-highlighter`.

---

## 1. Existing Features Status

### Working / Solid Features
- **Main Home & Chat Shell:** Central clean composer with suggested prompt chips and multiline auto-resize text input.
- **Markdown Rendering:** Code blocks with language labels and basic copy buttons, math equation rendering via KaTeX.
- **Client Persistence:** Conversations and provider metadata saved to Zustand `localStorage`.

### Partial / Flawed Features
- **AI Streaming:** Direct streaming from server backend exists, but hardcoded to Gemini (`gemini-2.5-flash`). No normalization for OpenAI, Anthropic, Ollama, OpenRouter, etc.
- **Model Selector:** Dropdown displays hardcoded/store models but does not switch dynamic API calls.
- **Slash Commands Menu:** Pops up `/` overlay, but inserting command text does not perform real execution.
- **Right Artifact Drawer:** Exists as an overlay in `ChatContainer.tsx`, but stays empty with static placeholder text ("No active artifact").
- **Settings Modal:** Basic UI tabs exist, but saving provider keys does not test real API connectivity.

### Fake / Decorative / Broken Features
- **Thinking / Tools Buttons in Composer:** Trigger browser `alert('Thinking mode toggled')` / `alert('Tools toggled')`.
- **Voice Button:** Triggers `alert('Voice input activated')`.
- **TopBar Share Button:** Triggers `alert('Link copied to clipboard!')`.
- **Projects View:** Displays static mock projects ("Nova OS Redesign", "Quantum Compiler"). Cannot add files or link active chat conversations.
- **Models & Compare Views:** Card grid with static badges. Compare view uses dummy alert or un-routed logic.
- **Tools, Prompts, Agents, Library Views:** Static search boxes and mock cards with no real tool execution engines or attachment search.

---

## 2. Identified Architectural Risks
1. **Single-Provider Coupling:** `server.ts` hardcodes `GoogleGenAI` with `GEMINI_API_KEY`.
2. **Missing Universal Adapter Layer:** Client has no normalized stream format for tool calls, reasoning deltas, or token usage.
3. **Storage Security:** Secret API keys are partially stored unencrypted in state or checked client-side.
4. **No Code / Web Execution Engine:** Tools buttons are completely disconnected from web search APIs or sandboxed JS/Python execution.

---

## 3. Remediation Strategy & Next Steps
- Establish backend Proxy Gateway supporting OpenAI, Anthropic, Gemini, Ollama, OpenRouter, and generic OpenAI-compatible APIs.
- Build robust `ProviderAdapter` and event stream normalizer.
- Wire all dead buttons to functional state machines.
- Create real sandboxed artifact viewer and live web/file tools.
- Overhaul settings and secondary pages to match top-level visual polish.
