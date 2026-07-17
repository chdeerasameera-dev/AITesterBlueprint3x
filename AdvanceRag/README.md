# RAG Explorer — QA Test Case Architect

RAG Explorer is an educational visual dashboard designed to interface with the `Ecom RAG` Langflow pipeline. It lets users upload an e-commerce requirements document, automatically ingests it through the Langflow API, and traces every stage of the Retrieval-Augmented Generation (RAG) pipeline (Ingestion → Chunking → Embedding → Vector DB Storage → Semantic Retrieval → LLM Prompt Assembly & Generation) using real execution logs.

---

## Technical Stack
- **Frontend**: React (Vite), Lucide-React, Glassmorphism CSS styling.
- **Backend Proxy**: Node.js/Express, Multer (file uploading), Axios (Langflow REST connector), Dotenv.

---

## Getting Started

### 1. Installation
In your terminal, navigate to the `AdvanceRag` directory and install the dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Inside `.env`, you can customize the configuration:
- `PORT`: Express backend port (Default: `5000`).
- `LANGFLOW_BASE_URL`: Base URL of your Langflow instance (Default: `http://localhost:7860`).
- `LANGFLOW_FLOW_ID`: Flow ID of `Ecom RAG.json` (Default: `a605c3cc-9e0d-42d9-92ca-5ef4277d2b38`).
- `LANGFLOW_API_KEY`: API Key/Token for Langflow Cloud or authenticated instances.
- `MOCK_MODE`: Set to `true` (default) to run the application in a local high-fidelity simulation mode. Change to `false` to connect to a live running Langflow instance.

### 3. Run the Application
You can run both the frontend development server (Vite) and the backend Express proxy using a single command:
```bash
npm start
```
Alternatively, you can run them in separate terminal sessions:
- Frontend: `npm run dev` (running on `http://localhost:5173`)
- Backend: `npm run server` (running on `http://localhost:5000`)

---

## Known Flow Issues & Fixes (in Langflow)

Before wiring this UI to a live Langflow server, ensure the following corrections are made inside the Langflow graph builder to prevent unexpected output or exceptions:

1. **Unconnected Prompt Template Variable (`{question}`)**:
   - **Issue**: The `Prompt Template` component expects a `{question}` variable, but no node edge is feeding it. Only `{context}` is populated.
   - **Fix**: Inside Langflow, drag a connector edge from `ChatInput-OWb4Q`'s `message` output and connect it to the `Prompt Template-34feA`'s `question` input field. This ensures the user's specific query is correctly integrated alongside the requirement context.

2. **Incorrect SplitText Separator edge**:
   - **Issue**: `ChatInput-OWb4Q` is currently connected to `SplitText-6Zp0J`'s `separator` parameter. This is a severe design bug in the flow; it means the user's search query string would override the paragraph divider character (`\n`), causing chunking failure on subsequent runs.
   - **Fix**: Delete the edge between `ChatInput-OWb4Q` and `SplitText-6Zp0J`'s `separator` field inside Langflow. The `separator` parameter should be statically defined as `\n` in the component configuration. Ensure `ChatInput` is only connected to `Chroma-OkqjA`'s `search_query` field.

3. **API Key Security**:
   - **Issue**: The exported `Ecom RAG.json` contains hardcoded Mistral and Groq API keys inside the component parameters.
   - **Fix**: Rotate the exposed keys and migrate them into Langflow Global Variables (e.g., as secrets `MISTRAL_API_KEY` and `GROQ_API_KEY`) and reference those variable names in the components instead of hardcoding raw strings.

---

## Alignment Decisions & Documentation

The following architectural adjustments were made to reconcile discrepancies between original acceptance criteria and the actual `Ecom RAG.json` parameters:

### A. Retrieval Chunks Count (`number_of_results` = 10)
- **Decision**: The RAG Explorer retrieves and displays **10 candidates** instead of 4.
- **Rationale**: The Chroma DB component in the provided `Ecom RAG.json` has `number_of_results` explicitly hardcoded to `10`. To represent the flow exactly as it is configured, we maintain this count. The visual citations badge and citation overlays gracefully list all 10 chunks.

### B. LLM Generation Model (`llama-3.1-8b-instant`)
- **Decision**: Run text generation on Groq using the **`llama-3.1-8b-instant`** model.
- **Rationale**: The Groq node in `Ecom RAG.json` is set to `llama-3.1-8b-instant`. The model `openai/gpt-oss-120b` (specified in some documents) is not a real or standard model supported on the Groq API.
