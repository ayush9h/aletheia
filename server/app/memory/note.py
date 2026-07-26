import uuid
from datetime import datetime


class MemoryNote:
    def __init__(
        self,
        content: str,
        id: str | None = None,
        keywords: list[str] | None = None,
        links: dict | None = None,
        retrieval_count: int | None = None,
        timestamp: str | None = None,
        last_accessed: str | None = None,
        context: str | None = None,
        evolution_history: list | None = None,
        category: str | None = None,
        tags: list[str] | None = None,
    ):
        self.content = content
        self.id = id or str(uuid.uuid4())

        current_time = datetime.now().strftime("%Y%m%d%H%M")
        self.timestamp = timestamp or current_time
        self.last_accessed = last_accessed or current_time

        self.keywords = keywords or []
        self.links = links or []
        self.context = context or "General"
        self.category = category or "Uncategorized"
        self.tags = tags or []

        self.retrieval_count = retrieval_count or 0
        self.evolution_history = evolution_history or []
