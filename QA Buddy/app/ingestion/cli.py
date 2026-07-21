import os
import sys
import argparse
import yaml
import traceback

# Add QA Buddy root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.embedder import BGEM3Embedder
from app.core.store import QABuddyStore
from app.ingestion.parsers import (
    parse_java_code,
    parse_typescript_code,
    parse_csv_test_cases,
    parse_jira_tickets,
    parse_pdf_document,
    parse_markdown_document,
    parse_meeting_transcripts,
    parse_jenkins_logs
)

# Load configuration settings
def load_config():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    config_path = os.path.join(base_dir, "config.yaml")
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file config.yaml not found at: {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def get_source_folders(base_dir):
    data_dir = os.path.join(base_dir, "data")
    folders = [f for f in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, f))]
    # Sort folders so 01 is first, then 02...
    folders.sort()
    return folders

def process_source(folder_name, data_path, embedder, store):
    chunks = []
    
    print(f"\nProcessing folder: {folder_name}")
    for root, _, files in os.walk(data_path):
        for file in files:
            file_path = os.path.join(root, file)
            # Skip README files
            if file.lower() == "readme.md":
                continue
                
            print(f"  Parsing file: {file}")
            try:
                # 01 Selenium Framework
                if folder_name.startswith("01_"):
                    if file.endswith(".java"):
                        chunks.extend(parse_java_code(file_path, "SeleniumFramework"))
                # 02 Playwright Framework
                elif folder_name.startswith("02_"):
                    if file.endswith(".ts") or file.endswith(".js"):
                        chunks.extend(parse_typescript_code(file_path, "PlaywrightFramework"))
                # 03 Test Cases
                elif folder_name.startswith("03_"):
                    if file.endswith(".csv"):
                        chunks.extend(parse_csv_test_cases(file_path))
                # 04 Jira Tickets
                elif folder_name.startswith("04_"):
                    if file.endswith(".json"):
                        chunks.extend(parse_jira_tickets(file_path))
                # 05 Company Docs
                elif folder_name.startswith("05_"):
                    if file.endswith(".pdf"):
                        chunks.extend(parse_pdf_document(file_path, "05_company_docs"))
                    elif file.endswith(".md"):
                        chunks.extend(parse_markdown_document(file_path, "05_company_docs"))
                # 06 Figma Designs (Placeholder)
                elif folder_name.startswith("06_"):
                    if file.endswith(".md"):
                        chunks.extend(parse_markdown_document(file_path, "06_figma_designs"))
                # 07 Meeting Notes
                elif folder_name.startswith("07_"):
                    if file.endswith(".txt") or file.endswith(".log"):
                        chunks.extend(parse_meeting_transcripts(file_path))
                # 08 Lucid Charts
                elif folder_name.startswith("08_"):
                    if file.endswith(".pdf"):
                        chunks.extend(parse_pdf_document(file_path, "08_lucid_charts"))
                    elif file.endswith(".md"):
                        chunks.extend(parse_markdown_document(file_path, "08_lucid_charts"))
                # 09 PRD/SRS
                elif folder_name.startswith("09_"):
                    if file.endswith(".pdf"):
                        chunks.extend(parse_pdf_document(file_path, "09_prd_srs"))
                    elif file.endswith(".md"):
                        chunks.extend(parse_markdown_document(file_path, "09_prd_srs"))
                # 10 Jenkins Logs
                elif folder_name.startswith("10_"):
                    if file.endswith(".log") or file.endswith(".txt"):
                        chunks.extend(parse_jenkins_logs(file_path))
            except Exception as e:
                print(f"    Error parsing {file}: {e}")
                traceback.print_exc()

    if not chunks:
        print(f"No chunks extracted from folder {folder_name}.")
        return 0
        
    print(f"Extracted {len(chunks)} chunks. Generating embeddings...")
    
    # Process and upsert in batches of 50 to avoid API rate limits / RAM overhead
    batch_size = 50
    total_upserted = 0
    
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i : i + batch_size]
        batch_texts = [c["text"] for c in batch_chunks]
        
        try:
            # Generate embeddings
            embeddings = embedder.encode(batch_texts, return_dense=True, return_sparse=True)
            # Store in Qdrant
            store.upsert_chunks(batch_chunks, embeddings)
            total_upserted += len(batch_chunks)
            print(f"  Batch {i//batch_size + 1}/{(len(chunks)-1)//batch_size + 1} uploaded.")
        except Exception as e:
            print(f"  Failed batch upload: {e}")
            traceback.print_exc()
            
    print(f"Completed {folder_name}. Total upserted: {total_upserted} chunks.")
    return total_upserted

def main():
    parser = argparse.ArgumentParser(description="QABuddy.AI Ingestion CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    ingest_parser = subparsers.add_parser("ingest", help="Ingest documents from data source directories")
    ingest_parser.add_argument("--source", type=str, default="all", help="Target source number (01 to 10) or 'all'")
    ingest_parser.add_argument("--local", action="store_true", help="Force local BGE-M3 embedding generation")
    ingest_parser.add_argument("--reset", action="store_true", help="Recreate Qdrant collection before uploading")
    
    args = parser.parse_args()
    
    if args.command == "ingest":
        config = load_config()
        
        # Initialize Core components
        use_local_embed = args.local or config.get("embedding", {}).get("use_local", False)
        print(f"Initializing Embedder (use_local={use_local_embed})...")
        embedder = BGEM3Embedder(use_local=use_local_embed)
        
        # Initialize Store connection
        qdrant_url = os.getenv("QDRANT_URL")
        qdrant_key = os.getenv("QDRANT_API_KEY")
        
        if config.get("qdrant", {}).get("prefer_cloud", True) and qdrant_url:
            store = QABuddyStore(
                collection_name=config["qdrant"]["collection_name"],
                url=qdrant_url,
                api_key=qdrant_key
            )
        else:
            store = QABuddyStore(
                collection_name=config["qdrant"]["collection_name"],
                path=config["qdrant"]["local_path"]
            )
            
        if args.reset:
            print("Recreating Qdrant collection...")
            store.recreate_collection()
            
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        folders = get_source_folders(base_dir)
        
        # Filter folders if a specific source is requested
        target_source = args.source.strip()
        if target_source.lower() != "all":
            # Map source numbers like '01', '1', etc.
            padded_source = target_source.zfill(2)
            folders = [f for f in folders if f.startswith(padded_source)]
            if not folders:
                print(f"Error: Source '{target_source}' does not exist in data directory.")
                sys.exit(1)
                
        print(f"Targeting data sources: {folders}")
        
        total_chunks = 0
        for folder in folders:
            data_path = os.path.join(base_dir, "data", folder)
            total_chunks += process_source(folder, data_path, embedder, store)
            
        print(f"\n--- Ingestion Job Completed ---")
        print(f"Total chunks successfully processed and upserted: {total_chunks}")

if __name__ == "__main__":
    main()
