import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings


class QdrantVectorStore:
    """
    Asynchronous Qdrant Vector DB client using native HTTP REST API.
    Guarantees pure async non-blocking calls directly to port 6333.
    """

    def __init__(self, host: Optional[str] = None, port: Optional[int] = None):
        self.host = host or settings.QDRANT_HOST
        self.port = port or settings.QDRANT_PORT
        self.base_url = f"http://{self.host}:{self.port}"

    async def is_healthy(self) -> bool:
        """Check if Qdrant service is responding."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/collections")
                return res.status_code == 200
        except Exception:
            return False

    async def ensure_collection(self, collection_name: str, vector_size: int = 768) -> bool:
        """Create collection if it does not already exist."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Check if collection exists
                res = await client.get(f"{self.base_url}/collections/{collection_name}")
                if res.status_code == 200:
                    return True

                # Create collection with Cosine distance
                create_payload = {
                    "vectors": {
                        "size": vector_size,
                        "distance": "Cosine",
                    }
                }
                put_res = await client.put(f"{self.base_url}/collections/{collection_name}", json=create_payload)
                return put_res.status_code == 200
        except Exception as e:
            print(f"Error ensuring Qdrant collection {collection_name}: {e}")
            return False

    async def upsert_documents(self, collection_name: str, points: List[Dict[str, Any]]) -> bool:
        """
        Insert or update points in Qdrant.
        points format: [{"id": 1, "vector": [...], "payload": {...}}, ...]
        """
        try:
            await self.ensure_collection(collection_name)
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.put(
                    f"{self.base_url}/collections/{collection_name}/points",
                    json={"points": points},
                )
                return res.status_code == 200
        except Exception as e:
            print(f"Error upserting into Qdrant {collection_name}: {e}")
            return False

    async def search(
        self,
        collection_name: str,
        query_vector: List[float],
        limit: int = 4,
        score_threshold: float = 0.35,
    ) -> List[Dict[str, Any]]:
        """
        Search for top matching vectors.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                search_payload = {
                    "vector": query_vector,
                    "limit": limit,
                    "with_payload": True,
                    "score_threshold": score_threshold,
                }
                res = await client.post(
                    f"{self.base_url}/collections/{collection_name}/points/search",
                    json=search_payload,
                )
                if res.status_code == 200:
                    data = res.json()
                    return data.get("result", [])
                return []
        except Exception as e:
            print(f"Error querying Qdrant {collection_name}: {e}")
            return []


# Global singleton instance
vector_store = QdrantVectorStore()
