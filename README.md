<div align="center">

# Aletheia

**A conversational AI platform with real-time streaming, persistent memory, personalization, and graph-based agent workflow.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-20232a?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

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
    src="https://github.com/user-attachments/assets/fffb57ba-0f07-4d9d-9a35-f5b8cb07dc55"
    alt="Aletheia home page"
    width="900"
  />
</p>

### Personalization Controls

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/cd8e4f57-66bd-49cf-96b8-fad4a2992cb6"
    alt="Aletheia personalization settings"
    width="900"
  />
</p>

### Conversational Interface

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/c4b55742-995d-4508-b999-ce60c151106b"
    alt="Aletheia chat interface"
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


## Getting Started

### Prerequisites

Install or provision the following:

- Node.js 18 or newer
- npm
- Python 3.13 recommended (`pyproject.toml` declares Python 3.11+)
- [uv](https://docs.astral.sh/uv/)
- PostgreSQL or a NeonDB database
- Redis
- Docker and Docker Compose, when using containers
- API credentials for the enabled integrations

### 1. Clone the Repository

```bash
git clone https://github.com/ayush9h/aletheia.git
cd aletheia
```

### 2. Configure the Frontend

Create `client/.env.local`:

```dotenv
# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=

# FastAPI server
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Install dependencies and start the client:

```bash
cd client
npm ci
npm run dev
```

The frontend is available at:

```text
http://localhost:3000
```

### 3. Configure the Backend

Create `server/.env`.

> The backend validates its configuration at startup. The current `Settings` class requires every variable listed below.

```dotenv
# Core infrastructure
DB_POSTGRES_URL=postgresql+asyncpg://USER:PASSWORD@HOST/DATABASE
REDIS_URL=redis://localhost:6379/0

# AI, memory, and search providers
GROQ_API_KEY=
GROQ_ORG_ID=
PINECONE_API_KEY=
VOYAGE_API_KEY=
TAVILY_API_KEY=

# Application-level chat limits
CHAT_STREAM_REQUESTS_PER_MINUTE=10
CHAT_STREAM_REQUESTS_PER_HOUR=100

# Groq provider quotas
GROQ_OPENAI_RPM=30
GROQ_OPENAI_TPM=8000
GROQ_META_RPM=30
GROQ_META_TPM=8000

# Tavily provider quota
TAVILY_SEARCH_RPM=20

# Langfuse observability
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_BASE_URL=https://cloud.langfuse.com

# Remote logging
PAPERTRAIL_ENDPOINT=
PAPERTRAIL_TOKEN=
```

The quota values above are development examples. Set them according to the limits of your provider accounts and deployment requirements.

Install dependencies and start the API:

```bash
cd server
uv sync
uv run uvicorn wsgi:app --reload --host 0.0.0.0 --port 8080
```

The backend is available at:

```text
http://localhost:8080
```

FastAPI documentation is available at:

- `http://localhost:8080/docs`
- `http://localhost:8080/redoc`

## Running with Docker

The included Compose configuration expects an image named `aletheiaserver:latest`.

```bash
cd server
docker build -t aletheiaserver:latest .
docker compose up
```

The API is exposed on port `8080`.

To run the image without Compose:

```bash
cd server
docker build -t aletheia-server .
docker run --rm \
  --env-file .env \
  -p 8080:8080 \
  aletheia-server
```

## API Overview

### Chat

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/v1/chat/stream` | Run the agent and stream plan, token, final, or error events |
| `GET` | `/v1/chats` | Retrieve stored chat history for a user and session |

The streaming endpoint accepts a payload containing the selected model, user query, user ID, optional session ID, preferences, and enabled tools.

### Sessions

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/v1/sessions` | List a user's chat sessions |
| `DELETE` | `/v1/sessions/{session_id}` | Delete one session |
| `POST` | `/v1/sessions/{session_id}/toggle-pin-session` | Pin or unpin a session |
| `DELETE` | `/v1/sessions/all-chats/{user_id}` | Delete all chats and sessions for a user |

### User Preferences

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/v1/users/preferences` | Retrieve preferences for a user |
| `POST` | `/v1/users/preferences` | Create or update preferences |

Preferences include custom instructions, nickname, personal context, occupation, base tone, and memory enablement.

## Streaming Events

`POST /v1/chat/stream` emits structured SSE messages:

| Event | Description |
| --- | --- |
| `plan` | Planner output containing the generated execution steps |
| `token` | Incremental model output for real-time rendering |
| `final` | Completed response and associated metadata |
| `error` | Structured failure information |

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

Frontend checks:

```bash
cd client
npm run lint
npm run build
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

## Development Commands

### Client

```bash
npm run dev      # Start Next.js with Turbopack
npm run build    # Create a production build
npm run start    # Start the production server
npm run lint     # Run frontend linting
```

### Server

```bash
uv sync                                      # Install locked dependencies
uv run uvicorn wsgi:app --reload --port 8080 # Start the development API
uv run pytest                                # Run tests
uv run pytest --cov=app                      # Run tests with coverage
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
