import os
import requests

try:
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    import torch
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False

class BGEM3Reranker:
    def __init__(self, use_local=False, hf_token=None):
        self.use_local = use_local and HAS_TRANSFORMERS
        self.hf_token = hf_token or os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN")
        self.tokenizer = None
        self.model = None
        
        if self.use_local:
            try:
                # Load cross-encoder locally on CPU
                print("Loading local Cross-Encoder BAAI/bge-reranker-v2-m3...")
                self.tokenizer = AutoTokenizer.from_pretrained("BAAI/bge-reranker-v2-m3")
                self.model = AutoModelForSequenceClassification.from_pretrained("BAAI/bge-reranker-v2-m3")
                self.model.eval()
            except Exception as e:
                print(f"Error loading local cross-encoder: {e}. Falling back to API/Fallback mode.")
                self.use_local = False
                
    def _local_rerank(self, query, texts):
        pairs = [[query, text] for text in texts]
        with torch.no_grad():
            inputs = self.tokenizer(pairs, padding=True, truncation=True, return_tensors='pt', max_length=512)
            scores = self.model(**inputs).logits.view(-1,).float()
            # Sigmoid/normalize scores if needed, BGE reranker returns raw logits
            # We can convert logits to probabilities
            probs = torch.sigmoid(scores).tolist()
        return probs

    def _api_rerank(self, query, texts):
        url = "https://api-inference.huggingface.co/models/BAAI/bge-reranker-v2-m3"
        headers = {}
        if self.hf_token:
            headers["Authorization"] = f"Bearer {self.hf_token}"
            
        # Call HF API
        payload = {
            "inputs": {
                "source_sentence": query,
                "sentences": texts
            },
            "options": {"wait_for_model": True}
        }
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        if response.status_code == 200:
            scores = response.json()
            # HF API might return list of floats or list of dicts with score
            if isinstance(scores, list):
                if len(scores) > 0 and isinstance(scores[0], dict):
                    # Sort matches by index to align with input texts
                    # HF sometimes returns scores sorted by score value
                    sorted_scores = [0.0] * len(texts)
                    for item in scores:
                        # Sometimes index/label is returned
                        idx = item.get("label") or item.get("index")
                        if isinstance(idx, str) and idx.startswith("LABEL_"):
                            idx = int(idx.split("_")[1])
                        sorted_scores[idx] = item["score"]
                    return sorted_scores
                return scores
            raise Exception("Unexpected response format from HF Reranker API")
        else:
            raise Exception(f"HF Reranker API Error {response.status_code}: {response.text}")

    def _fallback_rerank(self, query, texts):
        import re
        query_words = set(re.findall(r'\b\w{2,}\b', query.lower()))
        if not query_words:
            return [0.0] * len(texts)
        scores = []
        for text in texts:
            text_words = set(re.findall(r'\b\w{2,}\b', text.lower()))
            intersection = query_words.intersection(text_words)
            coverage = len(intersection) / len(query_words)
            scores.append(coverage)
        return scores

    def compute_scores(self, query, texts):
        if not texts:
            return []
            
        if self.use_local:
            try:
                return self._local_rerank(query, texts)
            except Exception as e:
                print(f"Local reranking failed: {e}. Trying API.")
                
        try:
            return self._api_rerank(query, texts)
        except Exception as e:
            print(f"API reranking failed: {e}. Using token overlap similarity fallback.")
            return self._fallback_rerank(query, texts)

    def rerank(self, query, candidates, top_n=6):
        """
        candidates: list of dicts with {"id", "score", "payload"} from RRF fusion
        """
        if not candidates:
            return []
            
        texts = [c["payload"]["text"] for c in candidates]
        scores = self.compute_scores(query, texts)
        
        # Merge scores back and sort
        reranked = []
        for c, score in zip(candidates, scores):
            reranked.append({
                "id": c["id"],
                "rrf_score": c["score"],
                "relevance_score": score,
                "payload": c["payload"]
            })
            
        # Sort descending by relevance score
        reranked.sort(key=lambda x: x["relevance_score"], reverse=True)
        return reranked[:top_n]
