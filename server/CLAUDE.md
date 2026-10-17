# CLAUDE.md

Behavioral guidelines for the Aletheia server (FastAPI, Python 3.11, SQLModel + asyncpg, Alembic, LangChain/LangGraph on Groq, Redis, Pinecone, structlog). Merge with any repo-level instructions.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.
- Check where code belongs (see Project Structure) before creating a file.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Reuse what exists: `get_session`, `settings`, the rate limiters in `utils/rate_limiters`, and `AGENT_REGISTRY` before adding a library or a parallel mechanism.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.
- Don't edit existing files in `alembic/versions/`; add a new migration instead.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add an endpoint" → "It's routed, has a test, and the suite passes"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Verify from `server/`:
- `.venv/Scripts/python -m pytest -q tests` - full suite
- `.venv/Scripts/python -m pytest -q tests/<path>` - a single area
- `alembic upgrade head` - after adding or changing a model

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Project Structure

**Layered. Routes stay thin.**

```
app/
├── api/          FastAPI routers only: validate, call services/db, map errors to HTTPException
├── db_service/   engine, get_session, retriever; models/ holds SQLModel tables
├── schemas/      Pydantic request/response models, grouped by domain (connectors/, workflows/, mem/)
├── services/
│   ├── agents/   one folder per agent: agent.py, client.py, tools/; registered in AGENT_REGISTRY
│   └── workflows/ ReWOO graph: planner, executor, memory retrieval, orchestration
├── memory/       long-term memory manager and notes
├── prompts/      prompt templates, kept out of business logic
└── utils/        config (settings), logger, redis, rate_limiters, shared dependencies
tests/            mirrors app/: test_api, test_services/test_agents, test_utils, ...
wsgi.py           app factory, lifespan, router registration
```

- Code used by one module lives in that module. Promote to `utils/` only when a second module needs it.
- New agent: `services/agents/<name>/{agent.py,client.py,tools/}`, add an `AgentSpec` to `AGENT_REGISTRY`, and name it in the planner schema description.
- Tools are `@tool` functions built by a `create_<x>_tools(session, user_id)` factory, return compact JSON via `json.dumps`, and truncate long text.
- Connector tokens live in `UserConnectors`; clients mark the row `reauth` on auth failure.
- New env vars go in `utils/config.py` `Settings`; never read `os.environ` directly.
- Imports are absolute from `app.`. Naming: snake_case modules, `*_router` for routers, `test_<module>.py` for tests.

## 6. Async & Data

**Async all the way. Fail loudly at the edges.**

- Use `AsyncSession` and `httpx.AsyncClient`; never block the event loop with sync I/O.
- Write SQL with `sqlmodel.select`; commit in the route or service that owns the transaction, roll back on `DatabaseError`.
- Rate-limit endpoints and external APIs through the existing limiters, not ad-hoc sleeps.
- Endpoints called by the client's server routes check `X-Connector-Secret` with `secrets.compare_digest`.
- Never log or return access tokens or secrets.

## 7. Logging & Errors

**structlog only. Structured fields, not f-string blobs.**

- `logger = structlog.get_logger(__name__)` per module; pass context as keyword fields (`user_id=...`).
- Use `logger.exception` inside `except` blocks; raise `HTTPException(...) from e`.
- Error details returned to the client stay generic ("Failed to fetch connectors").

## 8. Tests

- Every new endpoint, client, and tool gets a test under the mirrored `tests/` path.
- Mock the network and the DB session (`AsyncMock`, `patch`); tests never hit real services.
- Use `@pytest.mark.asyncio` for async tests.

## 9. Comments

- One-line `#` comments only, and only where the "why" isn't obvious.
- No multi-line docstrings except on `@tool` functions, where the docstring is the tool description the LLM reads.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
