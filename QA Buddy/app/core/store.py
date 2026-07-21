import os
from qdrant_client import QdrantClient
from qdrant_client.http import models

class QABuddyStore:
    def __init__(self, collection_name="qabuddy_collection", url=None, api_key=None):
        self.collection_name = collection_name
        self.url = url or os.getenv("QDRANT_URL", "http://localhost:6333")
        self.api_key = api_key or os.getenv("QDRANT_API_KEY")
        
        try:
            print(f"Connecting to Qdrant at: {self.url}")
            self.client = QdrantClient(url=self.url, api_key=self.api_key or None, timeout=3.0)
            # Test connection
            self.client.get_collections()
            print("Successfully connected to Qdrant at", self.url)
        except Exception as e:
            print(f"Could not connect to Qdrant at {self.url} ({e}). Falling back to in-memory Qdrant instance.")
            self.client = QdrantClient(location=":memory:")

    def recreate_collection(self):
        try:
            self.client.recreate_collection(
                collection_name=self.collection_name,
                vectors_config={
                    "dense": models.VectorParams(
                        size=1024,
                        distance=models.Distance.COSINE
                    )
                }
            )
            print(f"Recreated collection: {self.collection_name}")
        except Exception as e:
            print(f"Error recreating collection: {e}")
        
    def get_collection_info(self):
        try:
            info = self.client.get_collection(self.collection_name)
            return {
                "status": str(info.status),
                "points_count": info.points_count,
                "vectors_count": info.vectors_count or 0,
                "url": self.url
            }
        except Exception as e:
            return {"error": str(e), "points_count": 0, "url": self.url}

    def upsert_chunks(self, chunks, embeddings):
        points = []
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            import uuid
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.get("sha256", str(i))))
            
            vector_data = {
                "dense": emb["dense"]
            }
            
            payload = {
                "text": chunk.get("text", ""),
                "source_type": chunk.get("source_type"),
                "path": chunk.get("path"),
                "repo": chunk.get("repo"),
                "line_start": chunk.get("line_start"),
                "line_end": chunk.get("line_end"),
                "page": chunk.get("page"),
                "ticket_key": chunk.get("ticket_key"),
                "tc_id": chunk.get("tc_id"),
                "build_id": chunk.get("build_id"),
                "sha256": chunk.get("sha256")
            }
            
            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=vector_data,
                    payload=payload
                )
            )
            
        batch_size = 100
        for idx in range(0, len(points), batch_size):
            self.client.upsert(
                collection_name=self.collection_name,
                points=points[idx : idx + batch_size]
            )
        print(f"Upserted {len(points)} chunks into {self.collection_name}")

    def search_dense(self, dense_vector, top_n=20, source_filter=None):
        query_filter = None
        if source_filter:
            query_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="source_type",
                        match=models.MatchValue(value=source_filter)
                    )
                ]
            )
            
        try:
            results = self.client.query_points(
                collection_name=self.collection_name,
                using="dense",
                query=dense_vector,
                limit=top_n,
                query_filter=query_filter,
                with_payload=True
            )
            return results.points
        except Exception as e:
            print(f"Qdrant search error: {e}")
            return []
