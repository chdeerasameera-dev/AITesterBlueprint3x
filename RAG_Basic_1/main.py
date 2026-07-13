import os
import re
import math
import random
import requests
import shutil
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_settings import BaseSettings
import pypdf
import chromadb
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    nomic_api_key: str = os.getenv("NOMIC_API_KEY", "")
    chroma_db_path: str = "/tmp/chroma_db" if os.getenv("VERCEL") == "1" else "./chroma_db"
    collection_name: str = "vwo_prd_collection"

settings = Settings()

app = FastAPI(title="RAG Explorer Backend", description="A demo RAG pipeline backend using ChromaDB, Nomic Embed, and Groq.")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the Vite development port (e.g. http://localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ChromaDB persistent client
chroma_client = chromadb.PersistentClient(path=settings.chroma_db_path)

# Data models
class IngestConfig(BaseModel):
    chunk_size: int = 500       # target characters per chunk
    chunk_overlap: int = 100    # overlap in characters
    nomic_key_override: Optional[str] = None
    filename: Optional[str] = None

class QueryRequest(BaseModel):
    query: str
    nomic_key_override: Optional[str] = None
    groq_key_override: Optional[str] = None

# Global memory to store current pipeline state for visual inspection
pipeline_state = {
    "ingested_file": None,
    "file_size_bytes": 0,
    "pages_count": 0,
    "total_characters": 0,
    "chunks": [],
    "embedding_mode": "mock",  # 'nomic' or 'mock'
    "embedding_dimension": 768,
    "collection_name": settings.collection_name,
    "stored_chunks_count": 0,
    "status_message": "Ready",
    "active_step": 0
}

# --- PIPELINE STAGE 1 & 2: Parsing & Chunking ---

def parse_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    STAGE 1: Ingestion / Parsing
    Reads the PDF page by page and extracts text, keeping track of page numbers.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found at: {file_path}")
    
    pages_data = []
    reader = pypdf.PdfReader(file_path)
    for idx, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        pages_data.append({
            "page_num": idx + 1,
            "text": text
        })
    return pages_data

def chunk_text(pages_data: List[Dict[str, Any]], chunk_size: int, chunk_overlap: int) -> List[Dict[str, Any]]:
    """
    STAGE 2: Chunking
    Splits the extracted page texts into smaller overlapping segments.
    Preserves page number metadata so we know where each chunk originated.
    """
    chunks = []
    chunk_index = 0
    
    for page in pages_data:
        text = page["text"]
        page_num = page["page_num"]
        
        # Strip duplicate white spaces
        text = re.sub(r'\s+', ' ', text).strip()
        if not text:
            continue
            
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = min(start + chunk_size, text_length)
            chunk_content = text[start:end]
            
            chunks.append({
                "chunk_id": f"chunk_{chunk_index}",
                "page_num": page_num,
                "text": chunk_content,
                "char_count": len(chunk_content),
                "start_char": start,
                "end_char": end
            })
            
            chunk_index += 1
            start += chunk_size - chunk_overlap
            
            # Prevent infinite loop if overlap is larger than size
            if chunk_size <= chunk_overlap:
                break
                
    return chunks

# --- PIPELINE STAGE 3: Embeddings ---

def get_nomic_embeddings(texts: List[str], api_key: str, task_type: str = "search_document") -> List[List[float]]:
    """
    STAGE 3: Embedding Generation
    Generates high-dimensional vector embeddings using the Nomic Embed Cloud API.
    Falls back to a warning/mock mode if no key is available.
    """
    url = "https://api-atlas.nomic.ai/v1/embedding/text"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Nomic embedding expects a model. v1.5 is standard, supports search task types
    payload = {
        "model": "nomic-embed-text-v1.5",
        "texts": texts,
        "task_type": task_type
    }
    
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code, 
            detail=f"Nomic Embed API error: {response.text}"
        )
        
    data = response.json()
    # The response contains embeddings in the 'embeddings' key
    return data.get("embeddings", [])

def generate_mock_embeddings(texts: List[str], dimension: int = 768) -> List[List[float]]:
    """
    Fallback mock embedding generator. Generates deterministic normalized vectors
    based on character content MD5 hashes to support query matching without Nomic API Key.
    This remains completely stable across server process restarts.
    """
    embeddings = []
    for text in texts:
        # Create a stable hash of the text
        h = hashlib.md5(text.encode('utf-8')).hexdigest()
        # Convert hex signature to a stable seed value
        seed = int(h, 16) % 1000000
        rng = random.Random(seed)
        
        # Generate raw components
        vec = [rng.uniform(-1.0, 1.0) for _ in range(dimension)]
        
        # Normalize to unit length (cosine similarity relies on unit vectors)
        magnitude = math.sqrt(sum(x * x for x in vec))
        normalized_vec = [x / magnitude for x in vec] if magnitude > 0 else vec
        
        embeddings.append(normalized_vec)
    return embeddings

# --- PIPELINE STAGE 4: Vector Storage (ChromaDB) ---

def store_in_chromadb(chunks: List[Dict[str, Any]], embeddings: List[List[float]], pdf_path: str, pages_count: int, total_chars: int):
    """
    STAGE 4: Vector Storage
    Saves text chunks, their vector representations, and metadata in ChromaDB.
    Re-creates the collection on each ingestion to ensure idempotency.
    """
    # Delete existing collection to avoid duplicates
    try:
        chroma_client.delete_collection(settings.collection_name)
    except Exception:
        pass
        
    collection = chroma_client.create_collection(
        name=settings.collection_name,
        metadata={
            "hnsw:space": "cosine",
            "ingested_file": os.path.basename(pdf_path),
            "file_size_bytes": os.path.getsize(pdf_path),
            "pages_count": pages_count,
            "total_characters": total_chars
        }
    )
    
    # Prepare batch data for ChromaDB upload
    ids = [c["chunk_id"] for c in chunks]
    documents = [c["text"] for c in chunks]
    metadatas = [{"page_num": c["page_num"], "char_count": c["char_count"]} for c in chunks]
    
    # Add items to database
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas
    )

# --- PIPELINE STAGE 5, 6 & 7: Retrieval & Generation ---

def get_answer_from_groq(query: str, context_chunks: List[Dict[str, Any]], api_key: str) -> Dict[str, Any]:
    """
    STAGE 7: LLM Generation
    Sends query and retrieved context chunks to Groq API.
    Attempts Groq's openai/gpt-oss-120b model first, falling back to Llama-3.3 if it fails.
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Assemble retrieved context
    formatted_context = ""
    for idx, chunk in enumerate(context_chunks):
        formatted_context += f"--- Context Chunk {idx+1} (Page {chunk['page']}) ---\n"
        formatted_context += f"{chunk['text']}\n\n"
        
    system_message = (
        "You are an expert technical assistant demonstrating a Retrieval-Augmented Generation (RAG) system. "
        "Your task is to answer the user's question using ONLY the provided context blocks. "
        "Ensure your response is highly detailed, well-structured, and links facts directly to the pages mentioned in the context. "
        "If the context does not contain the answer, state clearly that the information is not found in the documents."
    )
    
    user_message = (
        f"Retrieved Document Context:\n{formatted_context}\n"
        f"User Question: {query}\n\n"
        f"Provide a comprehensive answer based on the context above."
    )
    
    # Primary model requested: openai/gpt-oss-120b
    # Fallback model: llama-3.3-70b-versatile
    models_to_try = ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
    
    last_error = ""
    model_used = ""
    generated_text = ""
    full_prompt = f"System:\n{system_message}\n\nUser:\n{user_message}"
    
    for model in models_to_try:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.2,
            "max_tokens": 1024
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=20)
            if response.status_code == 200:
                data = response.json()
                generated_text = data["choices"][0]["message"]["content"]
                model_used = model
                break
            else:
                last_error = f"HTTP {response.status_code}: {response.text}"
        except Exception as e:
            last_error = str(e)
            
    if not generated_text:
        raise HTTPException(
            status_code=502, 
            detail=f"Failed to generate answer from Groq. Errors tried: {last_error}"
        )
        
    return {
        "answer": generated_text,
        "model_used": model_used,
        "prompt": full_prompt
    }

# --- REST API Endpoints ---

@app.get("/api/status")
def get_status():
    """
    Fetch the general status of the vector database and active pipeline metrics.
    """
    # 1. Fetch ChromaDB collection metrics
    try:
        collection = chroma_client.get_collection(settings.collection_name)
        count = collection.count()
        pipeline_state["stored_chunks_count"] = count
        
        # Load persistent ingestion metrics from metadata
        meta = collection.metadata
        if meta and "ingested_file" in meta:
            pipeline_state["database_pdf"] = meta.get("ingested_file")
            pipeline_state["ingested_file"] = meta.get("ingested_file")
            pipeline_state["file_size_bytes"] = meta.get("file_size_bytes", 0)
            pipeline_state["pages_count"] = meta.get("pages_count", 0)
            pipeline_state["total_characters"] = meta.get("total_characters", 0)
    except Exception:
        pipeline_state["stored_chunks_count"] = 0
        pipeline_state["database_pdf"] = None
        
    # Check if API Keys are configured
    pipeline_state["has_groq_key"] = bool(settings.groq_api_key)
    pipeline_state["has_nomic_key"] = bool(settings.nomic_api_key)
    
    # 2. Find all available PDFs on disk
    pdfs = []
    data_dirs = ["/tmp/Data", "./Data", "./data/data", "../Data", "../data/data"]
    active_pdf = None
    
    for directory in data_dirs:
        if os.path.exists(directory):
            files = [f for f in os.listdir(directory) if f.lower().endswith(".pdf")]
            pdfs.extend(files)
            if files and not active_pdf:
                # Sort files by modification time descending to find the newest
                files.sort(key=lambda x: os.path.getmtime(os.path.join(directory, x)), reverse=True)
                active_pdf = files[0]
                
    # Remove duplicates and set lists
    pipeline_state["available_pdfs"] = sorted(list(set(pdfs)))
    pipeline_state["active_pdf"] = active_pdf
    
    # If database has no record of ingested file, default database_pdf to None
    if pipeline_state.get("stored_chunks_count", 0) == 0:
        pipeline_state["database_pdf"] = None
        pipeline_state["ingested_file"] = None
        
    return pipeline_state

@app.post("/api/upload")
def upload_pdf(file: UploadFile = File(...)):
    """
    Endpoint to upload a PDF file.
    Saves it in the './Data' directory with the pattern '<original_name>_<current_date_and_time>.pdf'
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        # Create Data folder if not exists
        data_dir = "/tmp/Data" if os.getenv("VERCEL") == "1" else "./Data"
        os.makedirs(data_dir, exist_ok=True)
        
        # Format current date and time
        now_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        
        # Get filename components
        filename_only = os.path.basename(file.filename)
        base, ext = os.path.splitext(filename_only)
        
        # Clean the base name to remove spaces or special characters
        base_clean = re.sub(r'[^a-zA-Z0-9_\-\s]', '', base).strip()
        new_filename = f"{base_clean}_{now_str}{ext}"
        
        target_path = os.path.join(data_dir, new_filename)
        
        # Save file to disk
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Update pipeline state to reflect the new file is available for ingestion
        pipeline_state.update({
            "ingested_file": new_filename,
            "file_size_bytes": os.path.getsize(target_path),
            "status_message": f"New file uploaded: {new_filename}. Ready to process.",
            "active_step": 0
        })
        
        return {
            "status": "success",
            "filename": new_filename,
            "message": f"Successfully uploaded and saved as '{new_filename}'"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@app.post("/api/ingest")
def trigger_ingestion(config: IngestConfig):
    """
    Triggers the end-to-end PDF Ingestion, Chunking, Embedding, and Storage flow.
    """
    # 1. Locate PDF file
    pipeline_state["status_message"] = "Locating PDF document..."
    pipeline_state["active_step"] = 1
    
    data_dirs = ["/tmp/Data", "./Data", "./data/data", "../Data", "../data/data"]
    pdf_path = None
    
    if config.filename:
        # Check if specified filename exists in any data directory
        for directory in data_dirs:
            p = os.path.join(directory, config.filename)
            if os.path.exists(p):
                pdf_path = p
                break
        if not pdf_path:
            raise HTTPException(status_code=404, detail=f"Specified PDF '{config.filename}' not found on server.")
    else:
        # Default to newest PDF
        for directory in data_dirs:
            if os.path.exists(directory):
                pdf_files = [f for f in os.listdir(directory) if f.lower().endswith(".pdf")]
                if pdf_files:
                    pdf_files.sort(key=lambda x: os.path.getmtime(os.path.join(directory, x)), reverse=True)
                    pdf_path = os.path.join(directory, pdf_files[0])
                    break
                    
    if not pdf_path:
        pipeline_state["status_message"] = "PDF document not found"
        pipeline_state["active_step"] = 0
        raise HTTPException(
            status_code=404, 
            detail="No PDF file found in './Data' or './data/data' directories. Please upload a PDF."
        )
        
    # Get Nomic API key
    nomic_key = config.nomic_key_override or settings.nomic_api_key
    embedding_mode = "nomic" if nomic_key else "mock"
    
    try:
        # Step 1: Parse Raw PDF text
        pipeline_state["status_message"] = f"Parsing PDF: {os.path.basename(pdf_path)}..."
        pipeline_state["active_step"] = 1
        pages_data = parse_pdf(pdf_path)
        total_chars = sum(len(p["text"]) for p in pages_data)
        
        # Step 2: Chunk raw text
        pipeline_state["status_message"] = f"Parsed {len(pages_data)} pages. Chunking text..."
        pipeline_state["active_step"] = 2
        chunks = chunk_text(pages_data, config.chunk_size, config.chunk_overlap)
        
        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="The PDF document does not contain any extractable text chunks. Please verify that the PDF is not empty and contains selectable text."
            )
        
        # Step 3: Generate embeddings
        pipeline_state["status_message"] = f"Generated {len(chunks)} chunks. Generating vector embeddings ({embedding_mode} mode)..."
        pipeline_state["active_step"] = 2
        chunk_texts = [c["text"] for c in chunks]
        
        if embedding_mode == "nomic":
            embeddings = get_nomic_embeddings(chunk_texts, nomic_key, "search_document")
        else:
            embeddings = generate_mock_embeddings(chunk_texts, pipeline_state["embedding_dimension"])
            
        # Step 4: Store in ChromaDB
        pipeline_state["status_message"] = f"Storing {len(chunks)} vectors and texts in local ChromaDB collection..."
        pipeline_state["active_step"] = 3
        store_in_chromadb(chunks, embeddings, pdf_path, len(pages_data), total_chars)
        
        # Update pipeline status
        pipeline_state.update({
            "ingested_file": os.path.basename(pdf_path),
            "file_size_bytes": os.path.getsize(pdf_path),
            "pages_count": len(pages_data),
            "total_characters": total_chars,
            "chunks": chunks,
            "embedding_mode": embedding_mode,
            "stored_chunks_count": len(chunks),
            "status_message": "ChromaDB Ready",
            "active_step": 3
        })
        
        return {
            "status": "success",
            "message": f"Successfully parsed and ingested '{os.path.basename(pdf_path)}'",
            "metrics": {
                "file": os.path.basename(pdf_path),
                "pages": len(pages_data),
                "chunks": len(chunks),
                "characters": total_chars,
                "mode": embedding_mode
            }
        }
    except Exception as e:
        pipeline_state["status_message"] = f"Ingestion failed: {str(e)}"
        pipeline_state["active_step"] = 0
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@app.post("/api/query")
def run_query(request: QueryRequest):
    """
    Triggers the Query Embedding, Database Retrieval, and LLM Generation flow.
    """
    # Verify database has chunks
    try:
        collection = chroma_client.get_collection(settings.collection_name)
        if collection.count() == 0:
            raise HTTPException(status_code=400, detail="Vector database is empty. Please run ingestion first.")
    except Exception:
        raise HTTPException(status_code=400, detail="Database collection does not exist. Please run ingestion first.")
        
    nomic_key = request.nomic_key_override or settings.nomic_api_key
    groq_key = request.groq_key_override or settings.groq_api_key
    
    if not groq_key:
        raise HTTPException(status_code=400, detail="Groq API key is missing. Add it to .env or input in UI.")
        
    embedding_mode = "nomic" if nomic_key else "mock"
    
    try:
        # STAGE 5: Embed the query
        if embedding_mode == "nomic":
            query_embeddings = get_nomic_embeddings([request.query], nomic_key, "search_query")
            query_vector = query_embeddings[0]
        else:
            query_embeddings = generate_mock_embeddings([request.query], pipeline_state["embedding_dimension"])
            query_vector = query_embeddings[0]
            
        # STAGE 6: Retrieve nearest matches (ChromaDB query)
        # Fetch top 4 results
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=4
        )
        
        # Format the retrieved documents for response
        retrieved_chunks = []
        if results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            ids = results["ids"][0]
            # ChromaDB cosine returns distance. Cosine similarity = 1 - distance
            distances = results["distances"][0] if "distances" in results else [0.0]*len(docs)
            
            for idx in range(len(docs)):
                similarity = 1.0 - distances[idx] # Convert distance to similarity score
                retrieved_chunks.append({
                    "id": ids[idx],
                    "text": docs[idx],
                    "page": metas[idx].get("page_num", 0),
                    "char_count": metas[idx].get("char_count", 0),
                    "score": round(similarity, 4)
                })
                
        # Handle case where nothing was retrieved
        if not retrieved_chunks:
            raise HTTPException(status_code=404, detail="No relevant context chunks found in database.")
            
        # STAGE 7: LLM Generation via Groq
        generation_response = get_answer_from_groq(request.query, retrieved_chunks, groq_key)
        
        # Return complete pipeline trace for visual inspection
        return {
            "query": request.query,
            "query_embedding_sample": query_vector[:15], # Return first 15 dimensions as sample
            "embedding_mode": embedding_mode,
            "retrieved_chunks": retrieved_chunks,
            "prompt_sent": generation_response["prompt"],
            "generated_answer": generation_response["answer"],
            "model_used": generation_response["model_used"]
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Query execution failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Start the dev server on port 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)
