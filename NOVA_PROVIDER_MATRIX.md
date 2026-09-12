# NOVA — Universal Provider Capability Matrix (`NOVA_PROVIDER_MATRIX.md`)

| Provider | Authentication | Connection Test | Model Discovery | Streaming | Reasoning | Tools | Vision | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Gemini** | API Key / Env | `/api/providers/test` | Native API | SSE Stream | Supported | Supported | Supported | **ACTIVE** |
| **OpenAI** | API Key (`Bearer`) | `/api/providers/test` | Native API | SSE Stream | Supported (`reasoning_effort`) | Native Functions | Supported | **ACTIVE** |
| **Anthropic** | API Key (`x-api-key`) | `/api/providers/test` | Configured List | SSE Stream | Extended Thinking | Tool Use | Supported | **ACTIVE** |
| **Ollama (Local)** | None (Local Endpoint) | `/api/providers/test` | `/api/tags` | SSE Chunk Stream | Supported | Supported | Local Vision | **ACTIVE** |
| **OpenRouter** | API Key (`Bearer`) | `/api/providers/test` | `/api/v1/models` | SSE Stream | Multi-Model | Native Tools | Supported | **ACTIVE** |
| **DeepSeek** | API Key (`Bearer`) | `/api/providers/test` | OpenAI compatible | SSE Stream | `reasoning_content` | Native Tools | Text Only | **ACTIVE** |
| **Groq / Together / Fireworks** | API Key (`Bearer`) | `/api/providers/test` | OpenAI compatible | SSE Stream | Supported | Supported | Supported | **ACTIVE** |
| **LM Studio / llama.cpp** | Local Endpoint | `/api/providers/test` | `/v1/models` | SSE Stream | Supported | Supported | Supported | **ACTIVE** |
| **Generic OpenAI Compatible** | Base URL + Key | `/api/providers/test` | `/v1/models` | SSE Stream | Parameter Pass | Custom Schema | Optional | **ACTIVE** |
