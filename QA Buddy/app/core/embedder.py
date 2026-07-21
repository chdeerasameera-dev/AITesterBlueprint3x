import os
import requests
import hashlib
import re

try:
    from FlagEmbedding import BGEM3FlagModel
    HAS_LOCAL = True
except ImportError:
    HAS_LOCAL = False

class BGEM3Embedder:
    def __init__(self, use_local=False, hf_token=None):
        self.use_local = use_local and HAS_LOCAL
        self.hf_token = hf_token or os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN")
        self.model = None
        
        if self.use_local:
            try:
                # Load local model (CPU inference)
                # BAAI/bge-m3
                self.model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=False)
            except Exception as e:
                print(f"Error loading local BGE-M3 model: {e}. Falling back to hosted API.")
                self.use_local = False
                
    def _local_encode(self, texts, return_dense=True, return_sparse=True):
        if not isinstance(texts, list):
            texts = [texts]
        
        output = self.model.encode(
            texts, 
            return_dense=return_dense, 
            return_sparse=return_sparse,
            return_colbert_vecs=False
        )
        
        results = []
        for i in range(len(texts)):
            res = {}
            if return_dense:
                # dense is a list of floats
                res["dense"] = output["dense"][i].tolist()
            if return_sparse:
                # sparse is a dict of {str(token_id): weight}
                # Qdrant expects indices (ints) and values (floats)
                lexical = output["lexical_weights"][i]
                indices = []
                values = []
                for k, v in lexical.items():
                    try:
                        # token_id might be string or int
                        indices.append(int(k))
                        values.append(float(v))
                    except ValueError:
                        # hash string to int if not an int token id
                        h = int(hashlib.md5(str(k).encode()).hexdigest(), 16) % (2**31 - 1)
                        indices.append(h)
                        values.append(float(v))
                res["sparse"] = {"indices": indices, "values": values}
            results.append(res)
        return results

    def _api_encode_dense(self, texts):
        # Queries Hugging Face Inference API for dense embeddings
        url = "https://api-inference.huggingface.co/models/BAAI/bge-m3"
        headers = {}
        if self.hf_token:
            headers["Authorization"] = f"Bearer {self.hf_token}"
            
        payload = {"inputs": texts, "options": {"wait_for_model": True}}
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            embeddings = response.json()
            if isinstance(embeddings, list) and len(embeddings) > 0:
                # Sometimes HF API returns a dictionary with 'error' or a list of list of float
                if isinstance(embeddings[0], list):
                    return embeddings
                elif isinstance(embeddings[0], dict):
                    # Handle unexpected dict outputs
                    raise Exception(f"HF API returned unexpected format: {embeddings}")
            return embeddings
        else:
            raise Exception(f"Hugging Face API Error {response.status_code}: {response.text}")

    def _generate_deterministic_sparse(self, text):
        # A lightweight TF-IDF-like deterministic sparse vector generator
        # Used as a fallback when running in serverless/API mode
        # Extract alphanumeric words of length >= 2
        words = re.findall(r'\b\w{2,}\b', text.lower())
        word_counts = {}
        for w in words:
            word_counts[w] = word_counts.get(w, 0) + 1
            
        indices = []
        values = []
        for word, count in word_counts.items():
            # Hash word deterministically to a 32-bit positive integer index for Qdrant
            idx = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16) % (2**31 - 1)
            # Log-frequency weight
            weight = float(1.0 + count * 0.5)
            indices.append(idx)
            values.append(weight)
            
        # Normalize weights
        total = sum(values)
        if total > 0:
            values = [v / total for v in values]
            
        return {"indices": indices, "values": values}

    def _generate_mock_dense(self, text, dimension=1024):
        # A mock dense embedding generator
        h = hashlib.md5(text.encode('utf-8')).hexdigest()
        seed = int(h, 16) % 1000000
        import random
        rng = random.Random(seed)
        vec = [rng.uniform(-1.0, 1.0) for _ in range(dimension)]
        import math
        mag = math.sqrt(sum(x*x for x in vec))
        return [x / mag for x in vec] if mag > 0 else vec

    def encode(self, texts, return_dense=True, return_sparse=True):
        if not isinstance(texts, list):
            texts = [texts]
            
        if self.use_local:
            try:
                return self._local_encode(texts, return_dense, return_sparse)
            except Exception as e:
                print(f"Local encode failed: {e}. Falling back to API/Mock.")
                
        # Hosted API / Mock path
        results = []
        dense_embeddings = None
        
        if return_dense:
            try:
                dense_embeddings = self._api_encode_dense(texts)
            except Exception as e:
                print(f"API dense embedding failed: {e}. Generating mock dense embeddings.")
                dense_embeddings = [self._generate_mock_dense(t) for t in texts]
                
        for i, text in enumerate(texts):
            res = {}
            if return_dense:
                res["dense"] = dense_embeddings[i]
            if return_sparse:
                res["sparse"] = self._generate_deterministic_sparse(text)
            results.append(res)
            
        return results
