<div align="center">

# Aletheia

**A conversational AI platform with real-time streaming, persistent memory, personalization, and graph-based agent workflow.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://github.com/ayush9h/aletheia/actions/workflows/tests.yml/badge.svg)](https://github.com/ayush9h/aletheia/actions/workflows/tests.yml)
[![Coverage](https://codecov.io/gh/ayush9h/aletheia/branch/main/graph/badge.svg)](https://codecov.io/gh/ayush9h/aletheia)

[Live Demo](https://www.ayuar.dev/aletheia) ·
[DeepWiki](https://deepwiki.com/ayush9h/aletheia) ·
[Report an Issue](https://github.com/ayush9h/aletheia/issues)

</div>


## Overview

Aletheia is a full-stack conversational combining Next.js interface with a FastAPI backend, LangGraph-based agent workflows, multi-model inference, real-time Server-Sent Events, and structured long-term memory.

The platform supports authenticated chat sessions, personalized assistant behavior, tool-enabled reasoning, persistent conversation history, and memory retrieval across interactions.

## Key Features

- **Real-time response streaming** through Server-Sent Events.
- **Multi-model chat** using Groq-hosted OpenAI-compatible models.
- **Agentic orchestration** with LangGraph and ReWOO-style planning.
- **Persistent conversational memory** using Voyage AI embeddings and Pinecone.
- **Web search tools** powered by TinyFish.
- **OAuth authentication** with GitHub and Google through NextAuth/Auth.js.
- **Personalized responses** using nicknames, occupations, custom instructions, tone, and memory preferences.
- **Session management** with history retrieval, pinning, deletion, and bulk cleanup.
- **PostgreSQL persistence** through SQLModel and NeonDB.
- **Redis-backed rate limiting** for chat and provider quotas.
- **LLM observability** through Langfuse and structured application logging.

## Product Interface

### Login & Home Page


<p align="center">
  <img
    src="https://github.com/user-attachments/assets/00ef8398-e383-4993-be1c-7c42f37ccb8e"
    alt="Aletheia home page"
    width="900"
  />
</p>

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/0361ea73-3c47-4f2e-aa1c-aeb3351e7fd8"
    alt="Aletheia home page"
    width="900"
  />
</p>

### Settings and Personalization


<p align="center">
  <img
    src="https://github.com/user-attachments/assets/1a814c14-765b-41db-861a-4cc29185d4b4"
    alt="Aletheia personalization settings"
    width="900"
  />
</p>

### Connectors

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/8df40a87-f163-43e7-9025-e7707743915c"
    alt="Aletheia connectors interface"
    width="900"
  />
</p>


## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 15, TypeScript, Tailwind CSS 4, Radix UI, Motion |
| Authentication | NextAuth/Auth.js v5, GitHub OAuth, Google OAuth |
| Backend | FastAPI, Uvicorn, Pydantic, SQLModel |
| Agent system | LangGraph, LangChain, Groq |
| Planning and tools | ReWOO-style planning, TinyFish web search |
| Relational database | PostgreSQL, NeonDB, SQLAlchemy, Alembic |
| Memory | Pinecone, Voyage AI embeddings |
| Rate limiting | Redis sliding-window limits |
| Observability | Langfuse, structlog, Papertrail |
| Tooling | npm, uv, Docker, Docker Compose, pytest |
| CI/CD | GitHub Actions, Render deployment hook |


## Memory System

Aletheia implements a structured conversational memory workflow into persistent memory for conversational AI systems.

The memory layer provides:

- Context-aware retrieval of relevant prior information
- Long-term interaction persistence
- Memory-note creation and summarization
- Memory evolution when new information strengthens or supersedes older notes
- User-controlled memory enablement

Research reference: [Persistent Memory for Conversational AI Systems](https://arxiv.org/pdf/2502.12110)

## Testing

Backend tests use `pytest` and `pytest-cov`.

```bash
cd server
uv sync
uv run pytest
```

Run tests with application coverage:

```bash
uv run pytest --cov=app
```

## CI/CD

The repository includes GitHub Actions workflows for the backend:

- Pull requests targeting `main` run backend tests and coverage checks when `server/**` changes.
- Pushes to `main` run tests before triggering a Render deployment hook.
- The production backend image uses a multi-stage Python 3.13 Docker build with a locked `uv` environment.

The deployment workflow requires a repository secret named:

```text
RENDER_DEPLOY_HOOK_URL
```

## Contributing

1. Fork the repository.
2. Create a focused branch:

   ```bash
   git checkout -b feat/your-change
   ```

3. Install the relevant client or server dependencies.
4. Add tests for behavior changes.
5. Run the test, lint, and build commands.
6. Commit your changes using a clear message.
7. Open a pull request against `main`.

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
