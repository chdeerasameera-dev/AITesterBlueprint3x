# Prompt: RAG Explorer — Frontend for the "Ecom RAG" Langflow Pipeline

## Role
You are a senior full-stack engineer building an educational RAG (Retrieval-Augmented Generation) demo application. The RAG pipeline itself already exists as a **Langflow flow** (`Ecom RAG.json`). Your job is to build a React UI + thin backend that **executes this existing flow via the Langflow API** and visualizes every stage — you are not building a new RAG pipeline from scratch.

## Context
- The RAG logic lives entirely inside `Ecom RAG.json`, a Langflow flow with 9 components already wired together.
- Source document: a PRD-style file (e.g. `Ecommerce_Requirements_Document.pdf`) fed into the flow's `Read File` component.
- This is a local, single-user demo, not a production service. Favor transparency of intermediate state over scale or security.
- **Known flow issue to fix before wiring the UI:** the `Prompt Template` component references `{question}`, but no edge currently feeds that variable — only `{context}` is populated (via the Parser). Confirm in Langflow whether `ChatInput` should be connected to the Prompt Template's `question` field, or whether the template should be simplified to context-only. Do this fix in Langflow itself; don't try to patch it from the frontend.
- **Known wiring oddity:** `ChatInput` is currently connected to `SplitText`'s `separator` field, not just to `Chroma`'s `search_query` field. This is very likely a mistake in the flow — a user's query would override the chunking separator. Flag this to whoever owns the flow; don't silently route around it in app code.
- **Security:** the flow JSON has a Mistral API key and a Groq API key hardcoded in component params. Before deploying anywhere, move both to Langflow Global Variables (or environment variables if calling the API directly) and rotate the exposed keys.

## Actual Pipeline (as defined in `Ecom RAG.json`)

| Stage | Component | Key config |
|---|---|---|
| Ingestion | `Read File` (`File-CAEnz`) | Local file upload; supports text formats natively, PDFs/Office/images via Docling ("Advanced Parser") |
| Chunking | `Split Text` (`SplitText-6Zp0J`) | `chunk_size=1000`, `chunk_overlap=200`, separator=`\n` (LangChain `CharacterTextSplitter`) |
| Embedding | `MistralAI Embeddings` (`MistalAIEmbeddings-74O34`) | model=`mistral-embed`, endpoint `https://api.mistral.ai/v1/` |
| Storage | `Chroma DB` (`Chroma-OkqjA`) | local persistent Chroma, `collection_name=langflow`, `persist_directory` currently set to `/chromd.db` (verify this path — looks like a typo) |
| Query input | `Chat Input` (`ChatInput-OWb4Q`) | feeds `Chroma`'s `search_query` |
| Retrieval | `Chroma DB` search | `search_type=Similarity`, `number_of_results=10` |
| Context formatting | `Parser` (`ParserComponent-Kid70`) | mode=`Stringify`, converts retrieved chunks to plain text |
| Prompt assembly | `Prompt Template` (`Prompt Template-34feA`) | "Senior QA Test Architect" template — generates structured **test cases** (ID, Requirement ID, Module, Title, Preconditions, Steps, Expected Result, Priority, Severity, Test Type, Automation Candidate) from retrieved context only |
| Generation | `Groq` (`GroqModel-JoFFZ`) | model=`llama-3.1-8b-instant`, temperature=`0.1`, streaming off |
| Output | `Chat Output` (`ChatOutput-dIMIK`) | returns final message |

Note this flow's actual purpose: given a requirements doc, it retrieves relevant requirement text and asks Groq to draft QA test cases from it — not a general-purpose Q&A answerer. Design the UI copy around that ("Generate test cases from your requirements doc"), not around generic question-answering.

## Objective
Build a React "RAG Explorer" application that:
1. Calls the Langflow **Run API** for this flow (`POST /api/v1/run/{flow_id}`) rather than reimplementing chunking/embedding/retrieval/generation in app code.
2. Lets the user upload a requirements file, which is passed as a `tweak` to the `Read File` component (or pre-placed and selected, per your Langflow file-upload setup).
3. Visually surfaces every pipeline stage (ingest → chunk → embed → store → retrieve → generate) using data returned in the Langflow run response, so the flow is self-explanatory to a non-technical viewer.

## Functional Requirements

### 1. Ingestion
- Upload the requirements file through Langflow's file upload endpoint, then reference it via a `tweak` on `File-CAEnz`'s `path`/`file_path_str` field when triggering the run.
- Show ingestion status in the UI (e.g., "Loaded `Ecommerce_Requirements_Document.pdf`").

### 2. Chunking
- Chunking happens inside `SplitText-6Zp0J` — you do not implement this. Surface its output in the UI: chunk index, character count, text preview. Pull this from the flow's intermediate vertex outputs (Langflow's run response includes per-component outputs when `stream=False` with full logs, or via the `/api/v1/build` streaming endpoint).
- Display the configured `chunk_size` (1000) and `chunk_overlap` (200) as read-only info, not editable in this UI (they're set in the flow, not the app).

### 3. Embedding
- Embedding happens inside `MistalAIEmbeddings-74O34` using `mistral-embed`. Show embedding progress/status if the Langflow run trace exposes it; otherwise show a simple "Embedding via Mistral (`mistral-embed`)" indicator once the Chroma stage completes.

### 4. Storage
- Storage happens inside `Chroma-OkqjA`. UI should display: collection name (`langflow`), chunk count stored (from the Chroma component's status output), and an option to re-trigger the flow's ingestion path if the source file changes.
- Note: `allow_duplicates=False` in the flow, so re-running ingestion on the same file should be idempotent already — verify this holds when the app re-triggers the run.

### 5. Query Interface
- A text input where the user asks about the requirements doc. This maps to `ChatInput-OWb4Q`'s `input_value`, sent as a `tweak` when calling the run endpoint.
- **Blocked on the known flow issue above** — confirm the `question` variable is actually wired into the Prompt Template before relying on this to produce doc-specific answers instead of context-only test cases.

### 6. Retrieval
- Retrieval happens inside `Chroma-OkqjA`'s search (triggered by `search_query`), returning `number_of_results=10` matches — not top 4. Either adjust `number_of_results` to 4 directly in the Langflow flow to match the original acceptance criteria, or update the UI/acceptance criteria to reflect 10. Decide and document which.
- Display retrieved chunks with distance/similarity scores and metadata, pulled from `Chroma-OkqjA`'s output, before or alongside the generated answer.

### 7. Answer Generation
- Generation happens inside `GroqModel-JoFFZ`, currently configured for `llama-3.1-8b-instant` (not `openai/gpt-oss-120b` as originally spec'd). Either change the model in the Langflow node to match the original requirement, or update the requirement to reflect the model actually in use.
- Display the generated test cases clearly. Add a collapsible "View prompt" panel showing the assembled `Prompt Template` output (the QA Test Architect prompt + retrieved context) for transparency.

### 8. Pipeline Visualization
- Present the flow as a horizontal stepper: Ingest → Chunk → Embed → Store → Retrieve → Generate, highlighting the active stage as the Langflow run progresses (use Langflow's streaming/build endpoint to get per-vertex status events if you want live stage highlighting; otherwise poll and show stages sequentially based on run completion).
- Each stage should be clickable/expandable to show that component's actual output as returned by Langflow (chunk list, embedding confirmation, retrieval results with scores, final assembled prompt).

## Suggested Tech Stack
- **Frontend:** React (Vite), simple component-based structure.
- **Backend:** Node.js/Express (or lightweight FastAPI) acting as a thin proxy to your Langflow server — handles file upload forwarding, triggers the flow run, and relays/normalizes the response for the frontend. Do not duplicate chunking/embedding/retrieval/generation logic here; that all lives in the Langflow flow.
- **Langflow integration:** call your self-hosted (or Langflow Cloud) instance's REST API — `POST /api/v1/run/{flow_id}` for a single-shot run, or the streaming build endpoint if you want live per-stage progress in the stepper UI.
- **Vector store / embeddings / LLM:** already defined inside the flow (Chroma local, Mistral embeddings, Groq generation) — the app does not call these providers directly.

## Constraints
- Never hardcode the Mistral or Groq API keys in frontend or backend app code — they belong in Langflow Global Variables, referenced by the flow, not duplicated into this app.
- Treat the Langflow flow as the source of truth for pipeline config (chunk size, top-k, model choice, prompt). If those need to change, change them in Langflow, not by adding parallel logic in the app.
- Keep the implementation simple and readable — this is a teaching tool.

## Deliverables
1. Working React frontend with the pipeline visualization and query interface described above.
2. Thin backend/proxy service handling file upload relay and Langflow run invocation — no independent chunking/embedding/retrieval/generation logic.
3. README covering: how to point the app at your Langflow instance (base URL, flow ID, API key/auth), how to resolve the two known flow issues (unconnected `question` variable, `ChatInput`→`SplitText.separator` wiring), and how to run the app.
4. A short note documenting the two decisions you made above: (a) whether `number_of_results` stays at 10 or is changed to 4, and (b) whether the Groq model stays `llama-3.1-8b-instant` or is changed to `openai/gpt-oss-120b`.

## Acceptance Criteria
- [ ] Uploading a requirements file and starting the app triggers the Langflow flow's ingest → chunk → embed → store path automatically.
- [ ] The UI shows chunk count, sample chunks, and Chroma storage confirmation pulled from the flow's actual run output.
- [ ] Submitting a query triggers the flow and returns the retrieved chunks (count matches whatever `number_of_results` is set to) with visible scores.
- [ ] The final output is the flow's generated QA test cases via Groq, using only the retrieved chunks as context.
- [ ] Every pipeline stage is visible/inspectable in the UI, sourced from real Langflow run data — not simulated or hardcoded in the frontend.
- [ ] The two known flow issues (unconnected `question` variable, `ChatInput`→`SplitText.separator` wiring) are either fixed in the flow or explicitly documented as open issues.
