# Findings — Jira → Test Plan Generator (B.L.A.S.T.)

> Research, discoveries, and constraints discovered during execution.

## 📚 Session Initialization (2026-06-06)

### Framework Documents
- ✅ **B.L.A.S.T.md** — 5-phase protocol (Blueprint, Link, Architect, Stylize, Trigger)
- ✅ **RICEPOT_Prompt.md** — Project scope in RICE POT format (Role, Intent, Context, Examples, Process, Output, Tone)
- ✅ **LLM.md** — Project Constitution defining schemas, integrations, rules, and architecture

### Project Scope (from LLM.md)
- **Core Mission:** React app + Express proxy that fetches Jira issues and auto-generates formal QA Test Plans using GROQ LLM
- **Input:** Jira issue ID (e.g., `VWO-48`)
- **Output:** Structured test plan (Markdown + on-screen render)
- **Integrations:** Jira Cloud REST API (Basic Auth) + GROQ API (Bearer token)

### Architecture (A.N.T. 3-Layer Model)
- **Layer 1 (Architecture):** Markdown SOPs in `architecture/` folder
- **Layer 2 (Navigation):** Express proxy routes requests → Jira client → GROQ client → Test Plan renderer
- **Layer 3 (Tools):** Atomic JS/Python scripts in `tools/` folder

### Key Constraints
- **CORS Blocking:** Jira Cloud doesn't allow direct browser requests → Express proxy required
- **Tokens:** Never log or commit secrets; store in `.env`
- **Determinism:** GROQ generates content (JSON); rendering and I/O are deterministic
- **Data Validation:** Where Jira is silent, emit `TBD`; never fabricate data

### Preliminary Environment Variables (from LLM.md)
```
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_TOKEN=ATATT...
GROQ_KEY=gsk_...
```

---

## 🔍 Next: Discovery Phase

**Awaiting user input on:**
1. Confirm North Star (auto-generate test plans)?
2. Confirm integrations (Jira + GROQ only)?
3. Confirm source of truth (single issue or multi-issue support)?
4. Confirm delivery payload (on-screen + downloadable .md)?
5. Confirm behavioral rules (formal QA tone, deterministic, no fabrication)?

---

## 💾 Discoveries Log (to be updated)
- *Pending execution*
