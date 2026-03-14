from typing import List, Literal

from pydantic import BaseModel


class EvolveSchema(BaseModel):
    should_evolve: bool
    actions: Literal["strengthen", "update_neighbor"]
    suggested_connections: List[str]

    new_context_neighborhood: List[str]
    tags_to_update: List[str]
    new_tags_neighborhood: List[str]
