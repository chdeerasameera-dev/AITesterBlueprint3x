# QABuddy.AI Architecture

This document describes the offline ingestion and online retrieval pipelines of QABuddy.AI.

## Ingestion Pipeline (Offline/CI CLI job)

1. **Cloning Repositories:** Clones the POM frameworks into `data/01_selenium_framework` and `data/02_playwright_framework` using `scripts/fetch_repos.sh`.
2. **Scaffolding Data:** Source data files are parsed using source-specific structures (classes/methods for Java, test blocks for TS/JS, rows for CSV, PDF page extraction).
3. **Dual Embedding Encoding:** Generates dense (1024d) and sparse lexical weights using `BAAI/bge-m3`.
4. **Idempotent Upsert:** Writes to Qdrant Cloud collection. IDs are stable hashes of chunk contents (`sha256(source + path + content)`).

## ASK Retrieval Pipeline (Vercel Serverless Function)

1. **Query Expansion:** Expands query into 3 variations using llama-3.3-70b-versatile.
2. **Dense/Sparse Search:** Performs query embedding, runs dense and sparse retrieval passes over Qdrant.
3. **RRF Fusion:** Blends results from both passes using Reciprocal Rank Fusion (k=60).
4. **Cross-Encoder Reranking:** Computes final alignment scores with `BAAI/bge-reranker-v2-m3`.
5. **Threshold Gate:** Validates if top scores are >= 0.22. Below threshold returns "not found in KB".
6. **LLM Generation:** Synthesizes answer in Groq gpt-oss-120b using top 6 valid chunks.
