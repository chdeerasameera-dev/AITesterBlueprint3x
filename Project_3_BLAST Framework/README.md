# README — Test Plan Buddy

**Test Plan Buddy** is a lightweight React application that connects to Jira and automatically generates formal, professional QA Test Plans using AI (GROQ LLM).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Jira Cloud account with API token
- GROQ API key

### Installation

1. **Clone/navigate to the project:**
   ```bash
   cd Project_3_BLAST\ Framework
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.sample .env
   ```
   
   Then edit `.env` with your credentials:
   - `JIRA_URL`: Your Atlassian domain
   - `JIRA_EMAIL`: Your Jira account email
   - `JIRA_TOKEN`: API token from https://id.atlassian.com/manage-profile/security/api-tokens
   - `GROQ_KEY`: API key from https://console.groq.com

4. **Run the handshake test:**
   ```bash
   npm run handshake
   ```
   
   This verifies all credentials are working.

### Development

**Start the dev server:**
```bash
npm run dev
```

This starts:
- **Vite frontend** on `http://localhost:5173`
- **Proxy API** on `http://localhost:3000` (configured in vite.config.js)

### Production Build

**Build for production:**
```bash
npm run build
```

This creates an optimized `dist/` folder.

**Run production server:**
```bash
npm run server
```

Or all at once:
```bash
npm run all
```

---

## 📋 How It Works

### 3-Layer Architecture (A.N.T.)

**Layer 1 — Architecture (`architecture/`):**
- `jira-fetch.md` — How to fetch Jira issues
- `groq-generate.md` — How to generate test plans via GROQ
- `test-plan-template.md` — How to render Markdown
- `handshake.md` — How to verify connectivity

**Layer 2 — Navigation (`server.js`, `api/generate.js`):**
- Routes requests through the tool pipeline
- Handles CORS (Jira blocks direct browser requests)
- Exposes `/api/generate` endpoint

**Layer 3 — Tools (`tools/`):**
- `jiraClient.js` — Fetch and normalize Jira issues
- `groqClient.js` — Call GROQ LLM API
- `testPlan.js` — Render to Markdown
- `handshake.js` — Verify all systems

### Frontend (React)

- **Generator** — Enter Jira issue ID, trigger generation
- **Settings** — Configure credentials (stored locally)
- **TestPlanView** — Display generated test plan
- **Download** — Save as `.md` file

---

## 🔌 API Endpoints

### `POST /api/generate`

**Request:**
```json
{
  "jiraId": "VWO-48",
  "config": {
    "jiraUrl": "...",
    "jiraEmail": "...",
    "jiraToken": "...",
    "groqKey": "..."
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "testPlan": { ... },
  "markdown": "# Test Plan...",
  "filename": "test-plan-VWO-48.md"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Missing Jira credentials"
}
```

---

## 📂 Project Structure

```
Project_3_BLAST Framework/
├── architecture/           # Layer 1: SOPs (technical docs)
│   ├── jira-fetch.md
│   ├── groq-generate.md
│   ├── test-plan-template.md
│   └── handshake.md
├── tools/                  # Layer 3: Atomic scripts
│   ├── jiraClient.js
│   ├── groqClient.js
│   ├── testPlan.js
│   └── handshake.js
├── src/                    # React frontend
│   ├── components/
│   │   ├── Generator.jsx
│   │   ├── Settings.jsx
│   │   └── TestPlanView.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── api/                    # Vercel serverless functions
│   └── generate.js
├── output/                 # Downloaded test plans
├── .tmp/                   # Temporary files (intermediates)
├── server.js               # Express proxy (Layer 2)
├── package.json
├── vite.config.js
├── index.html
├── LLM.md                  # Project Constitution
├── task_plan.md            # Progress tracker
├── progress.md             # Execution log
└── findings.md             # Research log
```

---

## 🛠️ Self-Annealing (Error Recovery)

When something fails:

1. **Read the error message** in the console or `.tmp/handshake-error.log`
2. **Identify the root cause** (missing credentials, API error, etc.)
3. **Fix the issue** (update `.env`, check API key, etc.)
4. **Update the docs** in `architecture/` to prevent future errors
5. **Re-run the handshake** to verify the fix

---

## 🚀 Deployment

### Local Testing
```bash
npm install
npm run dev          # or npm run server
```

### Vercel Deployment
1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard:
   - `JIRA_URL`
   - `JIRA_EMAIL`
   - `JIRA_TOKEN`
   - `GROQ_KEY`
4. Deploy

---

## 📝 Configuration Files

### `.env` (your credentials, never commit)
```
JIRA_URL=...
JIRA_EMAIL=...
JIRA_TOKEN=...
GROQ_KEY=...
```

### `.env.sample` (template, safe to commit)
Committed to repo for onboarding reference.

### `LLM.md` (Project Constitution)
Single source of truth for schema, rules, architecture. Update when major changes occur.

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing Jira credentials" | Check `.env` file and Settings panel |
| "GROQ API error" | Verify GROQ_KEY is valid at console.groq.com |
| "Jira issue not found" | Double-check issue ID (e.g., VWO-48) |
| CORS errors | Use the Express proxy (not direct browser fetch) |
| Build fails | Run `npm install` to ensure all dependencies |

---

## 📞 Support

For issues, check:
1. `architecture/*.md` — Technical SOPs
2. `findings.md` — Known issues and solutions
3. `progress.md` — Execution log and error traces
4. `.tmp/handshake-error.log` — Last error details

---

## 📜 License

MIT

---

**Built with B.L.A.S.T. Framework (Blueprint, Link, Architect, Stylize, Trigger)**
