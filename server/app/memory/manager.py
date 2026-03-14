from typing import Any, Dict, List

from app.db_service.retriever import PineconeRetriever
from app.memory.note import MemoryNote
from app.prompts.mem import ANALYSE_PROMPT, EVOLUTION_PROMPT
from app.schemas.mem.evolve_schema import EvolveSchema
from app.schemas.mem.note_schema import NoteSchema
from app.utils.config import settings
from langchain_groq import ChatGroq


class MemoryManager:
    def __init__(self, llm_client: ChatGroq, evo_threshold: int = 100):
        self.llm_client = llm_client
        self.retriever = PineconeRetriever(
            api_key=settings.PINECONE_API_KEY,
        )
        self.evo_threshold = evo_threshold
        self.memories = {}
        self.evo_cnt = 0

    async def analyze_content(self, content: str) -> Dict:
        try:
            content_with_prompt = ANALYSE_PROMPT + content

            resp = await self.llm_client.ainvoke(
                content_with_prompt, response_format={"type": "json_object"}
            )

            parsed = NoteSchema.model_validate_json(resp.content)  # type:ignore

            return parsed.model_dump()  # type:ignore

        except Exception as e:
            print(f"Error occured during analyzing content:{e}")
            return {
                "keywords": [],
                "context": "General",
                "tags": [],
            }

    async def add_note(self, content: str, time: str, **kwargs) -> str:
        if time is not None:
            kwargs["timestamp"] = time

        note = MemoryNote(content=content, **kwargs)

        needs_analysis = not note.keywords or note.context == "General" or not note.tags

        if needs_analysis:
            analysis = await self.analyze_content(content)

            print(f"Got the analysis:{analysis}")

            # Update if not present
            if not note.keywords:
                note.keywords = analysis.get("keywords", [])

            if note.context == "General":
                note.context = analysis.get("context", "")

            if not note.tags:
                note.tags = analysis.get("tags", [])

        evo_label, note = await self.process_memory(note)
        self.memories[note.id] = note

        metadata = {
            "id": note.id,
            "content": note.content,
            "keywords": note.keywords,
            "links": note.links,
            "retrieval_count": note.retrieval_count,
            "timestamp": note.timestamp,
            "context": note.context,
            "evolution_history": note.evolution_history,
            "category": note.category,
            "tags": note.tags,
        }

        self.retriever.add_document(note.content, metadata, note.id)

        if evo_label == True:
            self.evo_cnt += 1
            if self.evo_cnt % self.evo_threshold == 0:
                # Consolidate memories when threshold is reached
                self.consolidate_memories()

        return note.id

    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search memories using Pinecone hybrid retrieval."""

        try:
            results = self.retriever.search(query, k)

            memories = []

            for match in results["matches"]:
                meta = match["metadata"]
                doc_id = meta["id"]

                memory = self.memories.get(doc_id)

                if memory:
                    memories.append(
                        {
                            "id": doc_id,
                            "content": memory.content,
                            "context": memory.context,
                            "keywords": memory.keywords,
                            "tags": memory.tags,
                            "score": match["score"],
                        }
                    )
            return memories[:k]

        except Exception as e:
            print(f"Error in memory search: {str(e)}")
            return []

    def consolidate_memories(self):
        for memory in self.memories.values():
            metadata = {
                "id": memory.id,
                "content": memory.content,
                "keywords": memory.keywords,
                "links": memory.links,
                "retrieval_count": memory.retrieval_count,
                "timestamp": memory.timestamp,
                "last_accessed": memory.last_accessed,
                "context": memory.context,
                "evolution_history": memory.evolution_history,
                "category": memory.category,
                "tags": memory.tags,
            }
            self.retriever.add_document(memory.content, metadata, memory.id)

    def find_related_memories(self, query: str, k: int = 5) -> tuple[str, List[str]]:
        if not self.memories:
            return "", []

        try:
            results = self.retriever.search(query, k)

            memory_str = ""
            memory_ids = []

            for match in results["matches"]:
                meta = match["metadata"]
                doc_id = meta["id"]

                memory_str += (
                    f"memory_id:{doc_id}\t"
                    f"time:{meta.get('timestamp','')}\t"
                    f"content:{meta.get('content','')}\t"
                    f"context:{meta.get('context','')}\t"
                    f"keywords:{meta.get('keywords',[])}\t"
                    f"tags:{meta.get('tags',[])}\n"
                )

                memory_ids.append(doc_id)

            return memory_str, memory_ids
        except Exception as e:
            print(f"Error in find_related_memories: {str(e)}")
            return "", []

    async def process_memory(self, note: MemoryNote) -> tuple[bool, MemoryNote]:
        """Process a memory note and determine if it should evolve"""

        if not self.memories:
            return False, note

        try:
            neighbors_text, memory_ids = self.find_related_memories(note.content, k=5)

            if not neighbors_text or not memory_ids:
                return False, note

            prompt = EVOLUTION_PROMPT.format(
                content=note.content,
                context=note.context,
                keywords=note.keywords,
                nearest_neighbors=neighbors_text,
                neighbor_number=len(memory_ids),
            )

            try:

                resp = await self.llm_client.ainvoke(
                    prompt, response_format={"type": "json_object"}
                )

                resp_json = EvolveSchema.model_validate_json(resp.content).model_dump()  # type: ignore
                should_evolve = resp_json["should_evolve"]

                if should_evolve:
                    actions = resp_json["actions"]
                    for action in actions:
                        if action == "strengthen":
                            suggest_connections = resp_json["suggested_connections"]
                            new_tags = resp_json["tags_to_update"]

                            note.links.extend(suggest_connections)  # type:ignore
                            note.tags = new_tags

                        elif action == "update_neighbor":
                            new_context_neighborhood = resp_json[
                                "new_context_neighborhood"
                            ]
                            new_tags_neighborhood = resp_json["new_tags_neighborhood"]

                            for i in range(
                                min(len(memory_ids), len(new_tags_neighborhood))
                            ):
                                memory_id = memory_ids[i]
                                if memory_id not in self.memories:
                                    continue

                                neighbor_memory = self.memories[memory_id]

                                if i < len(new_tags_neighborhood):
                                    neighbor_memory.tags = new_tags_neighborhood[i]

                                # Update context
                                if i < len(new_context_neighborhood):
                                    neighbor_memory.context = new_context_neighborhood[
                                        i
                                    ]

                                # Save the updated memory back
                                self.memories[memory_id] = neighbor_memory

                return should_evolve, note

            except Exception as e:
                print(f"Error occured due to {e}")
                return False, note

        except Exception as e:
            print(e)
            return False, note
