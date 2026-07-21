import os
import yaml
import requests
import json
import traceback

from app.core.embedder import BGEM3Embedder
from app.core.store import QABuddyStore
from app.core.fusion import reciprocal_rank_fusion
from app.core.reranker import BGEM3Reranker

class QABuddyRetrievalPipeline:
    def __init__(self, config_path=None):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if not config_path:
            config_path = os.path.join(base_dir, "config.yaml")
            
        with open(config_path, "r", encoding="utf-8") as f:
            self.config = yaml.safe_load(f)
            
        self.embedding_config = self.config.get("embedding", {})
        self.retrieval_config = self.config.get("retrieval", {})
        self.qdrant_config = self.config.get("qdrant", {})
        
        # Initialize Core Pipeline parts
        self.embedder = BGEM3Embedder(
            use_local=self.embedding_config.get("use_local", False)
        )
        
        qdrant_url = os.getenv("QDRANT_URL")
        qdrant_key = os.getenv("QDRANT_API_KEY")
        
        if self.qdrant_config.get("prefer_cloud", True) and qdrant_url:
            self.store = QABuddyStore(
                collection_name=self.qdrant_config["collection_name"],
                url=qdrant_url,
                api_key=qdrant_key
            )
        else:
            self.store = QABuddyStore(
                collection_name=self.qdrant_config["collection_name"],
                path=self.qdrant_config["local_path"]
            )
            
        self.reranker = BGEM3Reranker(
            use_local=self.config.get("reranker", {}).get("use_local", False)
        )

    def rewrite_query(self, query):
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key or not self.retrieval_config.get("rewrite_query", True):
            return [query]
            
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        
        # Ask LLM to generate 3 alternative query variations to capture synonyms
        system_prompt = (
            "You are an expert search engine query expansion assistant. "
            "Generate exactly 3 alternative search queries for the user's question. "
            "Make them capture different keywords, synonyms, and variations. "
            "Provide the output as a simple JSON array of strings, and nothing else."
        )
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Query: {query}"}
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                # Parse JSON
                parsed = json.loads(content)
                # The LLM output could be {"queries": [...]} or similar
                if isinstance(parsed, dict):
                    for k, v in parsed.items():
                        if isinstance(v, list):
                            return [query] + v[:3]
                elif isinstance(parsed, list):
                    return [query] + parsed[:3]
        except Exception as e:
            print(f"Query rewrite failed: {e}. Using original query only.")
            
        return [query]

    def search(self, query, source_filter=None):
        # 1. Rewrite queries
        queries = self.rewrite_query(query)
        print(f"Retrieval queries (expanded): {queries}")
        
        all_dense_results = []
        all_sparse_results = []
        
        # 2. Embed queries and run hybrid search for each variant
        for q in queries:
            try:
                emb = self.embedder.encode(q, return_dense=True, return_sparse=True)[0]
                
                # Retrieve dense
                dense_hits = self.store.search_dense(
                    dense_vector=emb["dense"],
                    top_n=self.retrieval_config.get("top_n_hybrid", 20),
                    source_filter=source_filter
                )
                all_dense_results.extend(dense_hits)
                
                # Retrieve sparse
                sparse_hits = self.store.search_sparse(
                    sparse_vector=emb["sparse"],
                    top_n=self.retrieval_config.get("top_n_hybrid", 20),
                    source_filter=source_filter
                )
                all_sparse_results.extend(sparse_hits)
            except Exception as e:
                print(f"Search pass failed for query '{q}': {e}")
                traceback.print_exc()
                
        if not all_dense_results and not all_sparse_results:
            return [], []
            
        # Deduplicate results per query variant
        # (Since the same point can be retrieved for multiple query variants, we keep it)
        # Reciprocal Rank Fusion handles duplicates naturally as we group by ID.
        
        # 3. Fuse dense and sparse results using RRF
        fused = reciprocal_rank_fusion(
            all_dense_results,
            all_sparse_results,
            k=self.retrieval_config.get("rrf_k", 60)
        )
        
        # Slice to candidates to rerank
        candidates = fused[:self.retrieval_config.get("rerank_candidates", 12)]
        
        # 4. Rerank top candidates using Cross-Encoder
        reranked = self.reranker.rerank(
            query=query,
            candidates=candidates,
            top_n=self.retrieval_config.get("top_k", 6)
        )
        
        # 5. Threshold Gate
        threshold = self.retrieval_config.get("relevance_threshold", 0.22)
        
        # Filter by threshold
        valid_chunks = []
        for chunk in reranked:
            if chunk["relevance_score"] >= threshold:
                valid_chunks.append(chunk)
                
        # If the highest score is below threshold, return empty
        if reranked and reranked[0]["relevance_score"] < threshold:
            print(f"Top candidate score {reranked[0]['relevance_score']} below threshold {threshold}. Gated.")
            return [], reranked  # Return empty valid chunks, but include all reranked for visualization/debugging
            
        return valid_chunks, reranked
