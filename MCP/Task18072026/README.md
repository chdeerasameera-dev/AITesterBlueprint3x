# 🔍 MCP Inspector Explorer

> **Framework**: RICE-POT Dev-Ready Implementation  
> **Aesthetic**: Deep Midnight Black & Studio Light Themes, 3D Glassmorphism, Plus Jakarta Sans & Fira Code Typography  
> **Use Case**: Local-first utility for QA & Automation Engineers to inspect, test, compare, catalog, and learn about Model Context Protocol (MCP) servers.

---

## 🌟 Key Features

- 🔌 **Connection Manager**: Easily configure local `stdio` (Playwright, Filesystem, GitHub Docker/Binary) or remote `Streamable HTTP/SSE` (Atlassian Rovo, GitHub Remote Copilot) servers. Includes built-in one-click presets.
- 🪟 **Windows Stdio Auto-Resolution**: Built-in OS detection automatically transforms `npx` &rarr; `npx.cmd` and `npm` &rarr; `npm.cmd` on Windows systems to eliminate `ENOENT` process spawn failures.
- 🔎 **Discovery Panel**: Enumerate `tools/list`, `resources/list`, and `prompts/list` with schema inspection, tool category tagging, top active server dropdown selection, and real-time search filters.
- 🎮 **Tool Playground**: Generate dynamic forms from JSON schemas, edit raw JSON argument payloads, toggle **Read-Only Mode** safety guards, and stream execution results live.
- 📘 **Protocol Docs & Knowledge Hub**: Interactive reference guide covering MCP Documentation, Specifications (JSON-RPC 2.0 schemas & transports), Extensions, Server Registry, and Specification Enhancement Proposals (SEPs).
- 📊 **Comparison Dashboard**: Side-by-side server capability metrics, Local vs. Remote transport badges, bar chart visualizer, and an editable **Daily-Use MCP Servers** catalog.
- 🎨 **Dual Theme & 3D Glassmorphic Tiles**: Seamlessly toggle between **Deep Midnight Black 🌙** and **Studio White ☀️** themes with 3D elevated cards, tactile feedback, and crystal-clear subpixel typography.
- 📄 **Capability Report Export**: Export clean Markdown summaries and JSON manifests per server or combined across all servers with complete credential redaction.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: >= 18 (Tested with v24.16.0)
- **npm**: >= 9 (Tested with v11.15.0)

### 2. Installation & Running

#### Start Backend Service (Port 3001)
```bash
cd backend
npm install
npm run build
npm start
```
*(Runs Express proxy server with MCP SDK client integration on `http://localhost:3001`)*

#### Start Frontend Dev Server (Port 5173)
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
*(Access the app at `http://localhost:5173`)*

---

## 🛠 Target MCP Servers Reference & Commands

| Server Name | Transport | Command / URL | Notes & Auth |
|---|---|---|---|
| **Playwright MCP** | `stdio` | `npx -y @playwright/mcp@latest` | Local browser automation tools for E2E testing. No auth required. |
| **Local Filesystem MCP** | `stdio` | `npx -y @modelcontextprotocol/server-filesystem "C:/your-folder"` | File system read/write access for agent workflows. |
| **GitHub MCP (Local)** | `stdio` | `npx -y @modelcontextprotocol/server-github` | Repository search, PR reviews, issue triage. Requires GitHub PAT token. |
| **Atlassian Rovo MCP** | `sse` | `https://mcp.atlassian.com/v1/mcp/authv2` | Remote Jira/Confluence integration. Requires OAuth 2.1 or Bearer API token. |
| **GitHub MCP (Remote)** | `sse` | `https://api.githubcopilot.com/mcp/` | Hosted Copilot agent endpoint. Requires OAuth token. |

---

## 🎨 Design System & Typography

- **Fonts**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (Headings & UI) & [Fira Code](https://fonts.google.com/specimen/Fira+Code) / [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (Code & Schemas).
- **Themes**:
  - **Deep Midnight Black 🌙**: `#030712` background with neon cyan (`#00f2fe`) accents and 3D glassmorphism.
  - **Studio White ☀️**: Crisp white `#ffffff` / `#f0f4f8` with ocean blue accents (`#0284c7`) and deep slate black typography.

---

## 🛡 Security & Credential Protection

- Passwords, Tokens, PATs, and Headers entered in the UI are held in memory and passed directly to the backend proxy.
- All exported Markdown reports and JSON manifests automatically sanitize sensitive authentication tokens and headers.
