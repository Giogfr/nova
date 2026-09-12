# NOVA — Feature Matrix (`NOVA_FEATURE_MATRIX.md`)

| Feature Area | UI Implementation | Backend / Gateway | Persistence | Error Handling | Automated Tests | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Main Chat & Composer** | Polished modern UI | Partial (Gemini only) | Zustand LocalStorage | Basic | None | PARTIAL |
| **Universal Providers (OpenAI, Anthropic, Gemini, OpenRouter, DeepSeek, etc.)** | Model selector exists | Missing adapters | API key stored in store | Missing | None | IN PROGRESS |
| **Local Models (Ollama, LM Studio, llama.cpp)** | Tab in settings | Missing backend discovery & ping | Endpoint stored | Missing | None | IN PROGRESS |
| **Reasoning / Thinking UI** | Fake `alert()` button | Missing stream events | None | None | None | IN PROGRESS |
| **Slash Commands (`/`)** | Menu popup exists | None | None | None | None | IN PROGRESS |
| **Global Command Palette (`Ctrl+K`)** | Dialog component exists | Keyboard triggers active | Keybindings stored | None | None | IN PROGRESS |
| **Right-side Artifact Panel** | UI Drawer present | Missing renderer & versioning | None | None | None | IN PROGRESS |
| **Tools & Web Search** | Fake `alert()` button | Missing search API integration | None | None | None | IN PROGRESS |
| **Code Execution & HTML Preview** | Code block renderer | Missing sandboxed iframe | Artifact store | Handled | None | IN PROGRESS |
| **File Uploads & Context** | Upload button exists | Missing parser pipeline | Local attachment store | Missing | None | IN PROGRESS |
| **Projects & Project Context** | Mock cards UI | Missing instruction injection | Local store | Missing | None | IN PROGRESS |
| **Memory & Personalization** | Mock settings UI | Missing prompt builder | Local store | Missing | None | IN PROGRESS |
| **File Library** | Mock files UI | Missing file manager | Local store | Missing | None | IN PROGRESS |
| **Settings Overhaul** | Tabs modal UI | Missing real test connection | Local store | Missing | None | IN PROGRESS |
| **Model Comparison** | Dual prompt inputs UI | Missing side-by-side stream | None | Missing | None | IN PROGRESS |
