from pydantic import BaseModel


class NoteSchema(BaseModel):
    keywords: list[str]
    context: str
    tags: list[str]
