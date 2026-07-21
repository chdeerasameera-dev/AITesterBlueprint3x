import os
import re
import csv
import json
import hashlib
import pypdf

def get_sha256(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def chunk_by_words_with_overlap(text, chunk_size=512, overlap=76):
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk_text = " ".join(words[start:end])
        chunks.append({
            "text": chunk_text,
            "char_count": len(chunk_text)
        })
        start += chunk_size - overlap
        if chunk_size <= overlap:
            break
    return chunks

# 1. Java Code Parser (Selenium POM)
def parse_java_code(file_path, repo_name="SeleniumFramework"):
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        
    chunks = []
    filename = os.path.basename(file_path)
    
    # Structure aware chunking: Class definitions and method blocks
    # Simple regex parsing for classes and methods
    class_matches = list(re.finditer(r"(public|private|protected)?\s*class\s+(\w+)", content))
    
    if not class_matches:
        # Fallback to simple line-based chunking
        words = content.split()
        for idx, word_chunk in enumerate(chunk_by_words_with_overlap(content, 300, 0)):
            text = f"File: {filename}\nSource: {repo_name}\n\n{word_chunk['text']}"
            chunks.append({
                "text": text,
                "source_type": "01_selenium_framework",
                "path": file_path,
                "repo": repo_name,
                "line_start": idx * 15 + 1,
                "line_end": (idx + 1) * 15 + 1,
                "sha256": get_sha256(text)
            })
        return chunks
        
    for i, class_match in enumerate(class_matches):
        class_name = class_match.group(2)
        start_pos = class_match.start()
        end_pos = class_matches[i+1].start() if i+1 < len(class_matches) else len(content)
        class_block = content[start_pos:end_pos]
        
        # Extract methods in this class
        method_matches = list(re.finditer(r"(public|private|protected|static|\s) +[\w\<\>\[\]]+\s+(\w+) *\([^\)]*\) *\{", class_block))
        
        # Calculate line number helper
        lines_before = content[:start_pos].count("\n") + 1
        
        # Class header chunk
        class_header = class_block[:method_matches[0].start()] if method_matches else class_block
        header_text = f"Repo: {repo_name}\nFile: {filename}\nClass: {class_name}\n\n{class_header.strip()}"
        chunks.append({
            "text": header_text,
            "source_type": "01_selenium_framework",
            "path": file_path,
            "repo": repo_name,
            "line_start": lines_before,
            "line_end": lines_before + class_header.count("\n"),
            "sha256": get_sha256(header_text)
        })
        
        for j, method_match in enumerate(method_matches):
            method_name = method_match.group(2)
            m_start = start_pos + method_match.start()
            m_end = start_pos + (method_matches[j+1].start() if j+1 < len(method_matches) else len(class_block))
            method_content = content[m_start:m_end]
            
            m_lines_before = content[:m_start].count("\n") + 1
            method_text = f"Repo: {repo_name}\nFile: {filename}\nClass: {class_name}\nMethod: {method_name}\n\n{method_content.strip()}"
            
            chunks.append({
                "text": method_text,
                "source_type": "01_selenium_framework",
                "path": file_path,
                "repo": repo_name,
                "line_start": m_lines_before,
                "line_end": m_lines_before + method_content.count("\n"),
                "sha256": get_sha256(method_text)
            })
            
    return chunks

# 2. TypeScript Code Parser (Playwright Spec)
def parse_typescript_code(file_path, repo_name="PlaywrightFramework"):
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        
    chunks = []
    filename = os.path.basename(file_path)
    
    # Match test() blocks or describe() blocks
    test_matches = list(re.finditer(r"(test|describe)\s*\(\s*['\"`]([^'\"`]+)['\"`]", content))
    
    if not test_matches:
        # Fallback to simple line-based chunking
        for idx, word_chunk in enumerate(chunk_by_words_with_overlap(content, 300, 0)):
            text = f"File: {filename}\nSource: {repo_name}\n\n{word_chunk['text']}"
            chunks.append({
                "text": text,
                "source_type": "02_playwright_framework",
                "path": file_path,
                "repo": repo_name,
                "line_start": idx * 15 + 1,
                "line_end": (idx + 1) * 15 + 1,
                "sha256": get_sha256(text)
            })
        return chunks
        
    for i, match in enumerate(test_matches):
        block_type = match.group(1)
        block_name = match.group(2)
        start_pos = match.start()
        end_pos = test_matches[i+1].start() if i+1 < len(test_matches) else len(content)
        block_content = content[start_pos:end_pos]
        
        lines_before = content[:start_pos].count("\n") + 1
        text = f"Repo: {repo_name}\nFile: {filename}\nType: {block_type}\nName: {block_name}\n\n{block_content.strip()}"
        
        chunks.append({
            "text": text,
            "source_type": "02_playwright_framework",
            "path": file_path,
            "repo": repo_name,
            "line_start": lines_before,
            "line_end": lines_before + block_content.count("\n"),
            "sha256": get_sha256(text)
        })
        
    return chunks

# 3. CSV/XLSX Test Cases
def parse_csv_test_cases(file_path):
    chunks = []
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tc_id = row.get("Test Case ID") or row.get("tc_id") or "UNKNOWN"
            priority = row.get("Priority") or "Medium"
            summary = row.get("Summary") or ""
            module = row.get("Module") or ""
            steps = row.get("Test Steps") or ""
            expected = row.get("Expected Result") or ""
            
            text_lines = []
            for k, v in row.items():
                if v:
                    text_lines.append(f"{k}: {v.strip()}")
            text = "\n".join(text_lines)
            
            chunks.append({
                "text": text,
                "source_type": "03_test_cases",
                "path": file_path,
                "tc_id": tc_id,
                "sha256": get_sha256(text)
            })
    return chunks

# 4. JIRA Tickets JSON
def parse_jira_tickets(file_path):
    chunks = []
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        data = json.load(f)
        
    tickets = data if isinstance(data, list) else [data]
    
    for ticket in tickets:
        key = ticket.get("key") or ticket.get("Ticket ID") or "UNKNOWN"
        summary = ticket.get("summary") or ticket.get("fields", {}).get("summary") or ""
        desc = ticket.get("description") or ticket.get("fields", {}).get("description") or ""
        comments = ticket.get("comments") or []
        
        text = f"JIRA Ticket: {key}\nSummary: {summary}\nDescription: {desc}"
        if comments:
            text += "\n\nComments:\n" + "\n".join([f"- {c}" for c in comments])
            
        chunks.append({
            "text": text,
            "source_type": "04_jira_tickets",
            "path": file_path,
            "ticket_key": key,
            "sha256": get_sha256(text)
        })
    return chunks

# 5. Documents (PDF/MD/Transcripts/Charts)
def parse_pdf_document(file_path, source_type="05_company_docs"):
    chunks = []
    reader = pypdf.PdfReader(file_path)
    filename = os.path.basename(file_path)
    
    for idx, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        page_text_clean = re.sub(r'\s+', ' ', page_text).strip()
        if not page_text_clean:
            continue
            
        # Recursive splitter helper
        for word_chunk in chunk_by_words_with_overlap(page_text_clean, 512, 76):
            text = f"Document: {filename}\nPage: {idx + 1}\n\n{word_chunk['text']}"
            chunks.append({
                "text": text,
                "source_type": source_type,
                "path": file_path,
                "page": idx + 1,
                "sha256": get_sha256(text)
            })
    return chunks

def parse_markdown_document(file_path, source_type="05_company_docs"):
    chunks = []
    filename = os.path.basename(file_path)
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        
    # Split based on headings
    headings = list(re.finditer(r"^(#+)\s+(.*)$", content, re.MULTILINE))
    
    if not headings:
        # Fallback to simple split
        for word_chunk in chunk_by_words_with_overlap(content, 512, 76):
            text = f"Document: {filename}\n\n{word_chunk['text']}"
            chunks.append({
                "text": text,
                "source_type": source_type,
                "path": file_path,
                "sha256": get_sha256(text)
            })
        return chunks
        
    for i, heading in enumerate(headings):
        h_name = heading.group(2)
        start_pos = heading.start()
        end_pos = headings[i+1].start() if i+1 < len(headings) else len(content)
        block_content = content[start_pos:end_pos]
        
        for word_chunk in chunk_by_words_with_overlap(block_content, 512, 76):
            text = f"Document: {filename}\nSection: {h_name}\n\n{word_chunk['text']}"
            chunks.append({
                "text": text,
                "source_type": source_type,
                "path": file_path,
                "sha256": get_sha256(text)
            })
    return chunks

# 7. Meeting notes / speaker-turn transcripts
def parse_meeting_transcripts(file_path):
    chunks = []
    filename = os.path.basename(file_path)
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        
    # Speaker turn parsing (e.g. "Speaker A: blah blah")
    # Let's chunk every 10 lines to keep dialogue context together
    lines = [line.strip() for line in content.split("\n") if line.strip()]
    
    chunk_size_lines = 15
    overlap_lines = 3
    
    start = 0
    while start < len(lines):
        end = min(start + chunk_size_lines, len(lines))
        chunk_lines = lines[start:end]
        text = f"Transcript: {filename}\n\n" + "\n".join(chunk_lines)
        
        chunks.append({
            "text": text,
            "source_type": "07_meeting_notes",
            "path": file_path,
            "sha256": get_sha256(text)
        })
        start += chunk_size_lines - overlap_lines
        if chunk_size_lines <= overlap_lines:
            break
            
    return chunks

# 10. Jenkins Logs & Results
def parse_jenkins_logs(file_path):
    chunks = []
    filename = os.path.basename(file_path)
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        
    # 1. Error block extraction (e.g. failure stacktrace/exception lines)
    # Search for blocks containing Exception, Error, Failure, FAILED, Build Failed
    lines = content.split("\n")
    error_blocks = []
    
    current_block = []
    in_error = False
    
    for line in lines:
        if re.search(r"(Exception|Error|Failure|FAILED|fatal|severe)", line, re.IGNORECASE):
            in_error = True
            current_block.append(line)
        elif in_error:
            # Capture up to 5 lines of context following an error
            if len(current_block) < 6:
                current_block.append(line)
            else:
                error_blocks.append("\n".join(current_block))
                current_block = []
                in_error = False
        else:
            # Capture lines starting with tab/spaces (often stack trace context)
            if line.startswith("   ") or line.startswith("\t"):
                if error_blocks:
                    # Append stack trace lines to the last block
                    error_blocks[-1] += "\n" + line
                    
    if current_block:
        error_blocks.append("\n".join(current_block))
        
    # Limit number of error blocks
    for i, block in enumerate(error_blocks[:20]):
        text = f"Build Log: {filename}\nError Failure Block:\n{block}"
        chunks.append({
            "text": text,
            "source_type": "10_jenkins_logs",
            "path": file_path,
            "build_id": filename.replace(".log", ""),
            "sha256": get_sha256(text)
        })
        
    # 2. Build summary chunk
    summary_lines = []
    for line in lines:
        if re.search(r"(Finished:|BUILD STATUS:|Tests run:|SUCCESS|FAILURE)", line, re.IGNORECASE):
            summary_lines.append(line)
            
    if summary_lines:
        summary_text = f"Build Log Summary: {filename}\nSummary:\n" + "\n".join(summary_lines)
        chunks.append({
            "text": summary_text,
            "source_type": "10_jenkins_logs",
            "path": file_path,
            "build_id": filename.replace(".log", ""),
            "sha256": get_sha256(summary_text)
        })
        
    # Fallback if no errors/summaries extracted
    if not chunks:
        # Just create simple chunks
        for idx, word_chunk in enumerate(chunk_by_words_with_overlap(content, 512, 100)):
            text = f"Build Log: {filename}\nLog Segment:\n{word_chunk['text']}"
            chunks.append({
                "text": text,
                "source_type": "10_jenkins_logs",
                "path": file_path,
                "build_id": filename.replace(".log", ""),
                "sha256": get_sha256(text)
            })
            
    return chunks
