# MCP Inspector Explorer — Development-Ready Prompt

> Framework: RICE-POT (Role · Input · Context · Expectation — Persona · Output · Tone)
> Use this prompt verbatim with a coding agent (Claude Code, Cursor, Copilot) to scaffold, build, and document the app.

---

## R — Role

You are a senior full-stack engineer building an internal QA/DevTools utility for an automation engineer who works daily with Playwright, Azure DevOps, GitHub, and AI pipeline tooling (Langflow, n8n, MCP servers). You have deep familiarity with the Model Context Protocol (MCP) spec — tools, resources, prompts, transports (stdio vs. Streamable HTTP/SSE) — and with the official `@modelcontextprotocol/inspector` CLI/UI.

## I — Input

The user will connect three MCP servers for exploration and cataloguing:

1. **Playwright MCP** — `microsoft/playwright-mcp`, run locally via `npx @playwright/mcp@latest` (stdio transport).
2. **Atlassian Rovo (Jira) MCP** — official remote server at `https://mcp.atlassian.com/v1/mcp/authv2`, OAuth 2.1 or API token auth. (Optional local fallback: `sooperset/mcp-atlassian` for Jira Server/Data Center via PAT.)
3. **GitHub MCP** — `github/github-mcp-server`, available **both** ways:
   - Remote: `https://api.githubcopilot.com/mcp/` (OAuth or PAT, no local install)
   - Local: `ghcr.io/github/github-mcp-server` via Docker, or the local binary with `GITHUB_PERSONAL_ACCESS_TOKEN`

Known baseline facts to seed the app's reference data (treat as defaults, not hardcoded truth — always re-fetch live via Inspector on first run, since tool counts drift release to release):

| Server | Transport | Approx. Tool Count | Resources | Prompts | Auth |
|---|---|---|---|---|---|
| Playwright MCP | stdio (local) | ~30–40+ | None | None | N/A |
| Atlassian Rovo MCP | Streamable HTTP (remote) | ~16 Jira tools (+ Confluence/Bitbucket/JSM/Compass tools under same endpoint) | Unconfirmed — verify live | Unconfirmed — verify live | OAuth 2.1 / API token |
| GitHub MCP | stdio (local) **or** Streamable HTTP (remote) | 56+ read tools / 80+ with write across 20 toolset categories | Unconfirmed — verify live | Unconfirmed — verify live | OAuth 2.0 / PAT |

## C — Context

This is an internal tooling project, not a production SaaS. It will live alongside the user's other QA automation tooling (AC-to-Automation extension, ADO dashboards, RAG explorer). It should feel consistent with that ecosystem: React + Vite frontend, Node.js/TypeScript backend, clean modular architecture, and Markdown/JSON export so results can be pasted into documentation or fed back into other AI pipelines.

The core problem: MCP Inspector's own UI is great for ad-hoc poking but doesn't produce a durable, comparable, side-by-side catalog across multiple servers, transports, and auth models. This app fixes that.

## E — Expectation (the build)

### 1. Purpose
Build **"MCP Inspector Explorer"** — a local-first web app that:
- Connects to any configured MCP server (stdio or Streamable HTTP/SSE)
- Enumerates `tools/list`, `resources/list`, `prompts/list` via the MCP JSON-RPC 2.0 protocol
- Lets the user invoke a tool with sample parameters and view the raw + formatted result
- Auto-detects and labels each server as **Local** or **Remote** based on transport type
- Produces a comparison dashboard across all connected servers
- Exports a Markdown/JSON "MCP Capability Report" per server and combined

### 2. Functional Requirements

**Connection Manager**
- Add/edit/remove MCP server configs (name, transport type, command/args for stdio, URL/headers for HTTP, auth method)
- Preset templates for the three target servers (Playwright local, Atlassian remote, GitHub local+remote) pre-filled from the table above, editable
- Connection health indicator (connected / auth required / error) with the raw `x-deny-reason` or error surfaced, not swallowed

**Discovery Panel** (per connected server)
- Tabs: Tools · Resources · Prompts
- Tools tab: table of `name`, `description`, `inputSchema` (collapsible JSON viewer), and a toolset/category tag if the server groups tools (e.g., GitHub's `repos`, `issues`, `pull_requests`)
- Resources tab: URI, name, mimeType, description — empty-state messaging when a server (like Playwright) exposes none
- Prompts tab: same pattern — name, description, arguments

**Tool Playground**
- Select any discovered tool, auto-generate a form from its JSON schema, allow manual JSON override
- "Run" button executes the real `tools/call` against the live server and streams back the result
- Read-only mode toggle to prevent accidental writes when testing GitHub/Jira write tools

**Comparison Dashboard**
- Side-by-side cards: server name, transport badge (Local/Remote), tool count, resource count, prompt count, auth type, last-synced timestamp
- Bar chart comparing tool counts across the three servers
- "Daily-use MCP servers" section — a free-text/editable list block (see Section 5 below) that renders as annotated cards, meant to be pasted into code comments or README files

**Export**
- One-click export per server and combined: Markdown report + raw JSON capability manifest
- Markdown report format: server name → transport/auth summary → tools table → resources table → prompts table → generated timestamp

### 3. Non-Functional Requirements
- No secrets committed to code — all tokens/PATs entered at runtime and stored only in memory or a local `.env` (never in the exported report)
- Works fully offline for the local Playwright MCP; gracefully degrades when a remote server (Atlassian/GitHub) is unreachable
- Accessible: keyboard-navigable tables, ARIA labels on the JSON tree viewer
- Should visually match the "Ocean theme" / dashboard tile aesthetic already used in the user's ADO dashboard and MyJobAssistant projects — consistent card elevation, muted teal/navy palette, clear typographic hierarchy

### 4. Tech Stack
- Frontend: React 18 + Vite, TypeScript, CSS Modules (or Tailwind if preferred — state assumption and proceed)
- Backend: Node.js/TypeScript proxy service that:
  - Spawns stdio MCP servers as child processes (Playwright, local GitHub MCP)
  - Proxies Streamable HTTP/SSE calls to remote servers (Atlassian, remote GitHub) to avoid CORS/auth issues in-browser
- Protocol layer: implement raw JSON-RPC 2.0 `initialize` → `tools/list` → `resources/list` → `prompts/list` → `tools/call` handshake, or use `@modelcontextprotocol/sdk` client if available
- Storage: none required server-side; optionally persist server configs to a local JSON file for reuse across sessions

### 5. "Daily-Use MCP Servers" Reference Block
Include an editable config file (`daily-mcp-servers.json`) seeded with a starter list the user can adjust — this becomes the annotated comment block referenced in the dashboard:

```json
[
  { "name": "Playwright MCP", "usage": "Browser automation for E2E test authoring and Playwright script generation", "transport": "local" },
  { "name": "GitHub MCP", "usage": "PR review, issue triage, repo context for AI-assisted coding", "transport": "local+remote" },
  { "name": "Azure DevOps MCP", "usage": "WIQL queries, backlog docs, sprint/test case sync", "transport": "local (custom)" },
  { "name": "Filesystem MCP", "usage": "Local file read/write for agent-driven doc generation", "transport": "local" }
]
```
*(User: replace/expand this list with your actual daily MCP usage before shipping — this is a placeholder based on your known stack, not a verified list.)*

### 6. Acceptance Criteria
- [ ] Can connect to Playwright MCP locally and list all tools with zero manual JSON editing
- [ ] Can connect to Atlassian Rovo MCP remotely via OAuth and list Jira tools
- [ ] Can connect to GitHub MCP in both local (Docker) and remote (hosted) modes and show they expose different tool sets (remote has extras like `create_pull_request_with_copilot`)
- [ ] Comparison dashboard correctly labels each server Local vs. Remote
- [ ] Tool Playground can successfully invoke at least one read-only tool per server and render the response
- [ ] Export produces a valid Markdown report and valid JSON manifest per server
- [ ] No credentials appear in exported files or committed code

## P — Persona (voice for any generated docs/comments)
Precise, QA-engineer-to-QA-engineer tone. No marketing fluff. Prefer tables and code blocks over prose. Flag anything unverifiable as unverifiable rather than guessing.

## O — Output Format
Deliver as a working repo scaffold: `/frontend`, `/backend`, `README.md` with setup steps for all three server connections, `.env.example`, and the `daily-mcp-servers.json` starter file.

## T — Tone
Technical, direct, minimal ceremony — matches existing dev-ready prompts in this user's project history (RICE-POT/B.L.A.S.T. style).

---

## Appendix: Research Notes (for the coding agent's context, not for the UI)

- Playwright MCP's own `server.json` manifest declares `"transport": {"type": "stdio"}` — confirms local-only by design.
- Atlassian's Rovo MCP server went GA Feb 4, 2026, is Cloud-only (no Data Center/Server support), hosted on Cloudflare infrastructure, and explicitly documents itself as *"designed and supported only for Atlassian Cloud products."*
- GitHub's MCP server is unusual in that the **remote** version has strictly more tools than local (e.g., Copilot coding-agent invocation tools are remote-only) — worth calling out explicitly in the comparison dashboard rather than treating "more tools = better," since local is still preferred for air-gapped/Enterprise Server environments.
- Tool counts for GitHub MCP fluctuate release-to-release (a tracked discussion showed 55→56 tools in one week from a single new `search_commits` tool) — the app should timestamp every capability snapshot rather than treating any count as static.
