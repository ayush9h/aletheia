import json
import uuid
from typing import Dict, Optional

from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer


class PineconeRetriever:

    def __init__(
        self,
        api_key: str,
        index_name: str = "aletheiamemories",
        model_name: str = "all-MiniLM-L6-v2",
        dimension: int = 384,
    ):
        self.pc = Pinecone(api_key=api_key)
        self.model = SentenceTransformer(model_name)

        if index_name not in [i["name"] for i in self.pc.list_indexes()]:
            self.pc.create_index(
                name=index_name,
                dimension=dimension,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1",
                ),
            )

        self.index = self.pc.Index(index_name)

    def add_document(
        self,
        document: str,
        metadata: Dict,
        doc_id: str,
        user_id: str,
        session_id: str,
    ):

        enhanced_document = document

        if metadata.get("context") and metadata["context"] != "General":
            enhanced_document += f" context: {metadata['context']}"

        if metadata.get("keywords"):
            keywords = metadata["keywords"]
            if isinstance(keywords, str):
                keywords = json.loads(keywords)
            enhanced_document += f" keywords: {', '.join(keywords)}"

        if metadata.get("tags"):
            tags = metadata["tags"]
            if isinstance(tags, str):
                tags = json.loads(tags)
            enhanced_document += f" tags: {', '.join(tags)}"

        vector = self.model.encode(enhanced_document).tolist()

        processed_metadata = {
            k: json.dumps(v) if isinstance(v, (list, dict)) else str(v)
            for k, v in metadata.items()
        }
        processed_metadata["user_id"] = user_id
        processed_metadata["session_id"] = session_id

        if not doc_id:
            doc_id = str(uuid.uuid4())

        self.index.upsert(
            [
                {"id": doc_id, "values": vector, "metadata": processed_metadata},
            ]
        )

    def delete_document(self, doc_id: str):
        self.index.delete(ids=[doc_id])

    def search(
        self,
        query: str,
        user_id: str,
        session_id: Optional[str] = None,
        k: int = 5,
    ):

        vector = self.model.encode(query).tolist()

        filter_dict = {"user_id": {"$eq": user_id}}

        if session_id:
            filter_dict["session_id"] = {"$eq": session_id}

        results = self.index.query(
            vector=vector,
            top_k=k,
            include_metadata=True,
            filter=filter_dict,  # type:ignore
        )

        for match in results["matches"]:  # type:ignore
            meta = match.get("metadata", {})
            for key, value in meta.items():
                try:
                    if isinstance(value, str) and (
                        value.startswith("[") or value.startswith("{")
                    ):
                        meta[key] = json.loads(value)
                except:
                    pass

        return results

    def fetch(self, doc_id: str):
        return self.index.fetch(ids=[doc_id])
