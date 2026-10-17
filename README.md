<div align="center">

# Aletheia

**A conversational AI platform with real-time streaming, persistent memory, personalization, and graph-based agent workflow.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-20232a?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://github.com/ayush9h/aletheia/actions/workflows/tests.yml/badge.svg)](https://github.com/ayush9h/aletheia/actions/workflows/tests.yml)
[![Coverage](https://codecov.io/gh/ayush9h/aletheia/branch/main/graph/badge.svg)](https://codecov.io/gh/ayush9h/aletheia)

[Live Demo](https://aletheiagpt.vercel.app) ·
[DeepWiki](https://deepwiki.com/ayush9h/aletheia) ·
[Report an Issue](https://github.com/ayush9h/aletheia/issues)

</div>


## Overview

Aletheia is a full-stack conversational combining Next.js interface with a FastAPI backend, LangGraph-based agent workflows, multi-model inference, real-time Server-Sent Events, and structured long-term memory.

The platform supports authenticated chat sessions, personalized assistant behavior, tool-enabled reasoning, persistent conversation history, and memory retrieval across interactions.

## Key Features

- **Real-time response streaming** through Server-Sent Events.
- **Multi-model chat** using Groq-hosted Llama and OpenAI-compatible models.
- **Agentic orchestration** with LangGraph and ReWOO-style planning.
- **Persistent conversational memory** using Voyage AI embeddings and Pinecone.
- **Web search tools** powered by Tavily.
- **OAuth authentication** with GitHub and Google through NextAuth/Auth.js.
- **Personalized responses** using nicknames, occupations, custom instructions, tone, and memory preferences.
- **Session management** with history retrieval, pinning, deletion, and bulk cleanup.
- **PostgreSQL persistence** through SQLModel and NeonDB.
- **Redis-backed rate limiting** for chat and provider quotas.
- **LLM observability** through Langfuse and structured application logging.

## Product Interface

### Home Page


<p align="center">
  <img
    src="https://github.com/user-attachments/assets/38ead980-f8aa-4d3a-b3a3-741026119586"
    alt="Aletheia home page"
    width="900"
  />
</p>

### Settings and Personalization


<p align="center">
  <img
    src="https://github.com/user-attachments/assets/fac3ce32-c37d-4f06-8d51-9a001eb1861c"
    alt="Aletheia personalization settings"
    width="900"
  />
</p>

### Connectors

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/60ae79df-ae21-49b3-8c95-2a91264445fd"
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
| Planning and tools | ReWOO-style planning, Tavily web search |
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

## Known Platform Constraint

### NeonDB Idle Suspension

NeonDB free-tier databases may suspend after periods of inactivity. The first request after suspension can experience increased latency or a temporary connection failure.

Aletheia mitigates this through:

- A startup warm-up query
- Client-side retry behavior

For production workloads, use an appropriate NeonDB plan or another PostgreSQL deployment that matches the application's availability requirements.

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
