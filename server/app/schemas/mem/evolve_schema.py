from typing import Literal

from pydantic import BaseModel


class EvolveSchema(BaseModel):
    should_evolve: bool
    actions: Literal["strengthen", "update_neighbor"]
    suggested_connections: list[str]

    new_context_neighborhood: list[str]
    tags_to_update: list[str]
    new_tags_neighborhood: list[str]
