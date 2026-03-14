from typing import Dict, List

from pydantic import BaseModel


class NoteSchema(BaseModel):
    keywords: List[str]
    context: str
    tags: List[str]
