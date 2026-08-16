# AI QA Engineer Agent

> **Autonomous Agentic Quality Engineering Platform** — An AI agent that behaves like a senior QA Engineer, running end-to-end requirement normalization, test design, automation generation, execution against selected project target URLs, failure analysis, safe self-healing, and QA audit reporting.

---

## 1. Problem Statement

Modern software quality assurance faces critical bottlenecks across the software delivery lifecycle:

- **Ambiguous Requirements**: User stories and requirement documents (PDFs, DOCX, Jira issues) are often incomplete, lacking edge cases, security rules, and clear boundary criteria.
- **Manual & Slow Test Design**: Writing Gherkin scenarios, boundary test cases, and positive/negative test variations requires high manual effort and is prone to coverage gaps.
- **Fragile Test Automation**: Hand-written Playwright and Bruno API tests break frequently due to shifting DOM locators or dynamic URLs.
- **Disconnected Failure Analysis**: When tests fail, developers and QA teams waste hours triaging logs, screenshots, and stack traces to determine if a failure is an Application Defect or an Automation Defect.

---

## 2. Solution

The **AI QA Engineer Agent** solves these challenges by automating the complete end-to-end QA pipeline through an autonomous multi-stage quality engine:

```
Requirement Input (Text / File Upload / Jira / Azure)
  ↓
Requirement Normalization & Structural Alignment
  ↓
Requirement Quality Gate (Score 0-100%, Ambiguity & Risk Checks)
  ↓
Test Design Agent (Positive, Negative, Boundary, Validation, Security Scenarios)
  ↓
Automation Code Generator (Playwright TypeScript & Bruno API scripts targeted to project URL)
  ↓
Automation Quality Gate (Static analysis + locator safety rules)
  ↓
Playwright Test Execution (Simulated / live test runs with console output & failure logs)
  ↓
Failure Analysis & Root Cause Classification (Application Defect vs Automation Defect)
  ↓
Safe Self-Healing (Locator diff generation with human approval gate)
  ↓
Traceable QA Audit Report & Jira Bug Creation
```

### Key Capabilities:
- **Project-Specific URL Execution**: Executes test automation against selected project target URLs (e.g. `https://www.saucedemo.com/`, `http://localhost:3000`).
- **Multi-Source Inputs**: Accepts raw text, requirement documents (PDF, DOCX, TXT, MD), Jira Cloud issues, and Azure DevOps work items.
- **Claude-Style Conversational Interface**: Interactive UI streaming live pipeline stages with expandable data cards, code syntax highlighting, and downloadable HTML reports.

---

## 3. Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 18 · TypeScript · Vite · Tailwind CSS | Conversational Quality Command Center UI |
| **Backend** | Python 3.14 · FastAPI · Pydantic v2 · AsyncIO | Agentic orchestration engine & REST API |
| **AI Engine** | OpenAI / Ollama / Open-Router | Multi-provider LLM abstraction layer |
| **Browser Automation** | Playwright (TypeScript) | End-to-end browser test script generation & execution |
| **API Testing** | Bruno CLI | Declarative API collection generation & test runner |
| **Quality Engine** | Rule Engine + LLM Review | Dual-stage requirement & code quality validator |
| **Document Parser** | PyPDF · Python-DOCX | Extraction engine for PDFs, DOCX, TXT, and Markdown |
| **Deployment** | Cloudflare Pages / Workers | Global edge CDN hosting |

---

## 4. How to Run

### Prerequisites
- **Node.js**: 18+ (Node 20/24 recommended)
- **Python**: 3.11+ (Python 3.14 tested)
- **npm**: 9+

---

### Step 1: Clone Repository
```bash
git clone https://github.com/chdeerasameera-dev/AITesterBlueprint3x.git
cd AITesterBlueprint3x
```

---

### Step 2: Set up Backend
```powershell
# Create & activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt
```

Run Backend Server:
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend API will be available at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).*

---

### Step 3: Set up Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend UI will be running at `http://localhost:5173` (or `http://localhost:3000`).*

---

### Step 4: Optional One-Click Startup (Windows)
```powershell
powershell -File start.ps1
```

---

## 5. Demo (Vercel / Cloudflare Links)

- **Live Production Demo**: [https://frontend-six-chi-j680r5043t.vercel.app](https://frontend-six-chi-j680r5043t.vercel.app)
- **Preview Link**: [https://frontend-4jgrt8crw-deera-s-projects.vercel.app](https://frontend-4jgrt8crw-deera-s-projects.vercel.app)
- **Custom Hostname Target**: [https://aiqaengineeragent.deera.com](https://aiqaengineeragent.deera.com)
- **GitHub Repository**: [https://github.com/chdeerasameera-dev/AITesterBlueprint3x](https://github.com/chdeerasameera-dev/AITesterBlueprint3x)

### Deployment to Cloudflare Pages:
```powershell
# Build frontend static assets
cd frontend
npm run build

# Deploy to Cloudflare Pages (set CLOUDFLARE_API_TOKEN or run interactive login)
$env:CLOUDFLARE_API_TOKEN="<YOUR_CLOUDFLARE_API_TOKEN>"
npx wrangler pages deploy dist --project-name=aiqaengineeragent
```

---

## 6. Screenshots & Document Workflow

### Architecture & Pipeline Overview
```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI QA ENGINEER AGENT                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   [Document Upload / Jira Issue / Text]                                 │
│                     │                                                   │
│                     ▼                                                   │
│        1. Requirement Quality Gate (Completeness & Ambiguity)           │
│                     │                                                   │
│                     ▼                                                   │
│        2. Test Design Agent (Positive, Negative, Boundary, Security)     │
│                     │                                                   │
│                     ▼                                                   │
│        3. Automation Engine (Playwright TypeScript Code)                │
│                     │                                                   │
│                     ▼                                                   │
│        4. Execution Runner (Run test against target project URL)        │
│                     │                                                   │
│                     ▼                                                   │
│        5. Failure Analysis & Self-Healing (Root Cause & Locator Diff)   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Document Parsing & Requirements Workflow
1. Upload any requirement document (`.pdf`, `.docx`, `.md`, `.txt`) using the paperclip button in the compose bar.
2. The agent automatically extracts title, description, and acceptance criteria.
3. The pipeline evaluates the quality score, generates test scenarios, writes Playwright automation scripts targeted to the active project URL, executes the tests, and renders the downloadable HTML audit report.
