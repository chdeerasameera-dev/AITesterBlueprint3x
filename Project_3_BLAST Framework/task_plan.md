# Task Plan — Jira → Test Plan Generator (B.L.A.S.T.)

## 🟢 Protocol 0: Initialization — ✅ COMPLETE

- [x] LLM.md (Project Constitution) — **DEFINED & LOCKED**
- [x] task_plan.md (this file) — **CREATED & UPDATED**
- [x] findings.md (Research & Discoveries) — **CREATED**
- [x] progress.md (Execution Log) — **CREATED & UPDATED**

---

## 🏗️ Phase 1: B — Blueprint — ✅ COMPLETE

**All 5 discovery questions answered and locked in LLM.md:**

1. ✅ **North Star:** Auto-generate formal QA Test Plans from Jira issues
2. ✅ **Integrations:** Jira Cloud REST API + GROQ LLM (free tier)
3. ✅ **Source of Truth:** Single Jira issue, live fetch (no cache)
4. ✅ **Delivery Payload:** On-screen Markdown + downloadable `.md`
5. ✅ **Behavioral Rules:** Formal QA tone, deterministic, emit TBD on gaps

**Deliverables:**
- [x] Data schemas defined (JSON input/output)
- [x] UI wireframe (React components)
- [x] Architecture model (A.N.T. 3-layer)

---

## ⚡ Phase 2: L — Link — ✅ READY FOR TESTING

**Connectivity verification prepared (awaiting credentials):**

- [x] `.env.sample` created with required keys
- [x] Handshake script ready: `tools/handshake.js`
- [x] Setup instructions in README.md
- [ ] **Next:** Add JIRA_TOKEN + GROQ_KEY to `.env`, then run `npm run handshake`

---

## ⚙️ Phase 3: A — Architect — ✅ COMPLETE

**3-Layer A.N.T. Architecture fully built:**

**Layer 1 — Architecture SOPs (`architecture/`):**
- [x] `jira-fetch.md` — Jira API integration SOP
- [x] `groq-generate.md` — GROQ LLM SOP
- [x] `test-plan-template.md` — Markdown rendering SOP
- [x] `handshake.md` — Verification protocol SOP

**Layer 2 — Navigation (Routing & Request Pipeline):**
- [x] `server.js` — Express proxy (CORS bypass, API routes)
- [x] `api/generate.js` — Vercel serverless function
- [x] Route: `POST /api/generate` → Jira → GROQ → Markdown

**Layer 3 — Tools (Atomic Scripts):**
- [x] `tools/jiraClient.js` — Fetch & normalize Jira issues
- [x] `tools/groqClient.js` — Call GROQ LLM, parse JSON
- [x] `tools/testPlan.js` — Render JSON to Markdown
- [x] `tools/handshake.js` — End-to-end verification

---

## ✨ Phase 4: S — Stylize — ✅ COMPLETE

**React Frontend fully implemented:**

- [x] `src/App.jsx` — Main app controller & state management
- [x] `src/components/Generator.jsx` — Jira ID input form
- [x] `src/components/Settings.jsx` — Credential configuration panel
- [x] `src/components/TestPlanView.jsx` — Test plan display & sections
- [x] `src/styles.css` — Professional, responsive styling
- [x] Download to `.md` functionality
- [x] Browser localStorage for credential caching

---

## 🛰️ Phase 5: T — Trigger — ✅ COMPLETE

**Deployment & documentation ready:**

- [x] Express server configured: `server.js`
- [x] Vite build setup: `vite.config.js`
- [x] HTML entry point: `index.html`
- [x] Package scripts:
  - `npm run dev` — Start dev server
  - `npm run build` — Production build
  - `npm run server` — Run production
  - `npm run handshake` — Verify connectivity
  - `npm run all` — Build + run
- [x] Documentation: `README.md` (setup, deployment, troubleshooting)
- [x] Environment template: `.env.sample`

---

## 📊 Quick Reference: Files to Maintain

| File | Purpose | Updated By |
|------|---------|-----------|
| `LLM.md` | Constitutional rules & architecture | Architect (on major changes) |
| `task_plan.md` | Phase checklists & progress tracking | Navigator (every milestone) |
| `progress.md` | Execution log, errors, results | Executor (after each build step) |
| `findings.md` | Research, constraints, discoveries | Researcher (continuous) |
| `prompt.md` | Conversation history | Manual append (end of session) |

---

## 📊 Project Completion Status

| Phase | Status | Completion |
|-------|--------|-----------|
| **Protocol 0: Initialization** | ✅ COMPLETE | 100% |
| **Phase 1: Blueprint** | ✅ COMPLETE | 100% |
| **Phase 2: Link** | 🔌 READY (awaiting credentials) | 95% |
| **Phase 3: Architect** | ✅ COMPLETE | 100% |
| **Phase 4: Stylize** | ✅ COMPLETE | 100% |
| **Phase 5: Trigger** | ✅ COMPLETE | 100% |
| **Overall** | **⚡ READY TO TEST** | **95%** |

---

## 🚀 Getting Started (5 minutes)

```bash
# 1. Navigate to project
cd "AI Session Practice/AITesterBlueprint3x/Project_3_BLAST Framework"

# 2. Create .env with your credentials
cp .env.sample .env
# Edit .env with:
# - JIRA_URL (Atlassian domain)
# - JIRA_EMAIL (your email)
# - JIRA_TOKEN (https://id.atlassian.com/manage-profile/security/api-tokens)
# - GROQ_KEY (https://console.groq.com)

# 3. Test connectivity
npm install
npm run handshake

# 4. Start development
npm run dev
# Open http://localhost:5173
```

---

## 📁 Complete File Structure Created

```
Project_3_BLAST Framework/
├── 📂 architecture/          [Layer 1 — SOPs]
│   ├── jira-fetch.md
│   ├── groq-generate.md
│   ├── test-plan-template.md
│   └── handshake.md
├── 📂 tools/                 [Layer 3 — Atomic Scripts]
│   ├── jiraClient.js
│   ├── groqClient.js
│   ├── testPlan.js
│   └── handshake.js
├── 📂 src/                   [React Frontend]
│   ├── 📂 components/
│   │   ├── Generator.jsx
│   │   ├── Settings.jsx
│   │   └── TestPlanView.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── 📂 api/                   [Vercel Serverless]
│   └── generate.js
├── 📂 output/                [Generated test plans]
├── 📂 .tmp/                  [Temporary files]
├── 🔧 server.js              [Express proxy — Layer 2]
├── 📋 package.json           [Dependencies & scripts]
├── ⚙️  vite.config.js          [Build configuration]
├── 📄 index.html             [HTML entry point]
├── 🔑 .env.sample            [Credential template]
├── 📖 README.md              [Full documentation]
├── 📋 LLM.md                 [Project Constitution]
├── 📋 task_plan.md           [This file]
├── 📋 progress.md            [Execution log]
└── 📋 findings.md            [Research log]
```

---

## ✅ Self-Annealing Protocol Ready

If errors occur:
1. Check `architecture/` SOP for guidance
2. Fix the issue
3. Update `progress.md` with findings
4. Run `npm run handshake` to verify
5. Commit learnings to `findings.md`
