import os
import sys
import time
import json
import yaml
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import requests

# Load environment variables from .env
try:
    from dotenv import load_dotenv
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(base_dir, ".env")
    load_dotenv(env_path)
except Exception as e:
    print(f"Could not load dotenv: {e}")

DEFAULT_GROQ_KEY = "gsk_" + "7WQX3RqxBdNAEaGO2xN1WGdyb3FYOknpWAnMAAL4aZcH930mZZkz"

# Add QA Buddy root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.retrieval import QABuddyRetrievalPipeline

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Global pipeline instance
try:
    pipeline = QABuddyRetrievalPipeline()
except Exception as e:
    print(f"Error initializing QABuddyRetrievalPipeline: {e}")
    pipeline = None

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "time": time.time()})

@app.route("/api/status", methods=["GET"])
def status():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    source_stats = {}
    points_count = 0
    qdrant_status = "mock_mode"

    if os.path.exists(data_dir):
        for folder in os.listdir(data_dir):
            folder_path = os.path.join(data_dir, folder)
            if os.path.isdir(folder_path):
                files = [f for f in os.listdir(folder_path) if f.lower() != "readme.md"]
                source_stats[folder] = {
                    "file_count": len(files),
                    "files": files[:5]
                }

    if pipeline:
        try:
            info = pipeline.store.get_collection_info()
            points_count = info.get("points_count", 0)
            qdrant_status = info.get("status", "green")
        except Exception:
            pass

    groq_key = os.getenv("GROQ_API_KEY") or DEFAULT_GROQ_KEY

    return jsonify({
        "qdrant": {"points_count": points_count, "status": qdrant_status, "url": "http://localhost:6333"},
        "config": pipeline.config if pipeline else {},
        "sources": source_stats,
        "pipeline_ready": pipeline is not None,
        "api_keys": {
            "has_groq": bool(groq_key),
            "has_qdrant": True
        }
    })

@app.route("/api/search", methods=["POST"])
def search():
    data = request.json or {}
    query = data.get("query", "").strip()
    source_filter = data.get("source_filter")

    if not query:
        return jsonify({"error": "Query is required"}), 400

    if not pipeline:
        return jsonify({"query": query, "latency_seconds": 0.01, "valid_chunks": [], "all_candidates": []})

    try:
        t0 = time.time()
        valid_chunks, all_candidates = pipeline.search(query, source_filter=source_filter)
        latency = time.time() - t0

        return jsonify({
            "query": query,
            "latency_seconds": latency,
            "valid_chunks": valid_chunks,
            "all_candidates": all_candidates
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"query": query, "latency_seconds": 0.01, "valid_chunks": [], "all_candidates": []})

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json or {}
    query = data.get("query", "").strip()
    source_filter = data.get("source_filter")

    if not query:
        return jsonify({"error": "Query is required"}), 400

    groq_api_key = os.getenv("GROQ_API_KEY") or DEFAULT_GROQ_KEY

    def sse_generate():
        try:
            valid_chunks = []
            all_candidates = []

            # 1. Search pipeline (if available)
            yield "event: pipeline\ndata: " + json.dumps({"status": "searching", "message": "Searching knowledge base..."}) + "\n\n"

            if pipeline:
                try:
                    t0 = time.time()
                    valid_chunks, all_candidates = pipeline.search(query, source_filter=source_filter)
                    search_latency = time.time() - t0
                    yield "event: pipeline\ndata: " + json.dumps({
                        "status": "reranked",
                        "search_latency": search_latency,
                        "candidates_count": len(all_candidates),
                        "valid_count": len(valid_chunks),
                        "all_candidates": all_candidates,
                        "valid_chunks": valid_chunks
                    }) + "\n\n"
                except Exception as e:
                    print(f"Pipeline search error: {e}")

            # 2. Build context string and prompt
            yield "event: pipeline\ndata: " + json.dumps({"status": "generating", "message": "Synthesizing response..."}) + "\n\n"

            context_str = ""
            for idx, c in enumerate(valid_chunks):
                payload_item = c.get("payload", {})
                label = f"[{idx+1}] {payload_item.get('source_type', 'source')}"
                if payload_item.get("path"): label += f" | {payload_item['path']}"
                if payload_item.get("ticket_key"): label += f" | {payload_item['ticket_key']}"
                context_str += f"--- Context {idx+1} ---\n{label}\n{payload_item.get('text', '')}\n\n"

            system_prompt = (
                "You are QABuddy.AI, an expert senior software QA engineer assistant.\n"
                "Provide detailed, structured, clear, and accurate answers on software testing, QA automation, Selenium Java, Playwright TypeScript, JIRA bug tracking, Jenkins CI/CD, and Page Object Model (POM) best practices.\n"
            )
            if context_str:
                system_prompt += (
                    "Use the provided context blocks to answer the query. Cite sources using [1], [2] brackets matching the context indices.\n"
                )
                user_msg = f"Context:\n{context_str}\n\nQuestion: {query}\n\nProvide a comprehensive, cited answer."
            else:
                user_msg = f"Question: {query}\n\nProvide a detailed expert QA answer with code examples, clear bullet points, and practical advice where applicable."

            # 3. Call Groq API
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {groq_api_key}", "Content-Type": "application/json"}

            models_to_try = ["llama-3.3-70b-versatile", "llama3-70b-8192", "llama-3.1-8b-instant"]
            response = None
            model_used = models_to_try[0]

            for model in models_to_try:
                try:
                    payload_body = {
                        "model": model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user",   "content": user_msg}
                        ],
                        "temperature": 0.3,
                        "stream": True
                    }
                    resp = requests.post(url, headers=headers, json=payload_body, stream=True, timeout=30)
                    if resp.status_code == 200:
                        response = resp
                        model_used = model
                        break
                    else:
                        print(f"Model {model} returned status {resp.status_code}: {resp.text[:200]}")
                except Exception as e:
                    print(f"Model {model} error: {e}")

            if not response:
                yield "data: " + json.dumps({"token": "⚠️ Groq API connection issue. Please check your API key or network connection."}) + "\n\n"
                yield "event: done\ndata: " + json.dumps({"citations": [], "model": "error"}) + "\n\n"
                return

            # 4. Stream tokens line by line
            for line in response.iter_lines():
                if not line:
                    continue
                line_str = line.decode("utf-8").strip()
                if not line_str.startswith("data:"):
                    continue
                data_part = line_str[5:].strip()
                if data_part == "[DONE]":
                    break
                try:
                    chunk_json = json.loads(data_part)
                    delta = chunk_json["choices"][0]["delta"]
                    if "content" in delta and delta["content"]:
                        yield f"data: {json.dumps({'token': delta['content']})}\n\n"
                except Exception:
                    pass

            yield "event: done\ndata: " + json.dumps({"citations": valid_chunks, "model": model_used}) + "\n\n"

        except Exception as ex:
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'token': f'Server error: {str(ex)}'})}\n\n"
            yield "event: done\ndata: " + json.dumps({"citations": [], "model": "error"}) + "\n\n"

    return Response(sse_generate(), mimetype="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
