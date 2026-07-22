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

---

## ☁️ Connecting Backend from Vercel Deployment

There are two primary ways to connect your Express backend when deploying the frontend on Vercel:

### Option A: External Node Server Deployment (Recommended for Local `stdio` MCP execution)
- **Why**: MCP `stdio` servers (e.g. `npx -y @playwright/mcp@latest`) spawn persistent child processes (`stdin`/`stdout`). Vercel serverless containers are ephemeral and cannot keep background `stdio` child processes running.
- **Setup**:
  1. Host `backend/` on a platform like **Render**, **Railway**, **Fly.io**, or an **EC2 / VPS** instance:
     ```bash
     cd backend
     npm install
     npm start
     ```
  2. In your **Vercel Project Settings &rarr; Environment Variables**, add:
     ```env
     VITE_API_BASE_URL=https://your-backend-service.onrender.com
     ```
  3. Re-deploy Vercel. All `/api/*` discovery calls will route to your remote Node server.

### Option B: Vercel Serverless Function (`api/index.ts`) (For Remote HTTP/SSE MCP Servers & Registry Proxy)
- **Why**: Serverless functions handle HTTP/SSE endpoints, API presets, saved configurations, and live MCP Registry proxy requests effortlessly.
- **Setup**:
  1. Add `api/index.ts` exporting your Express app:
     ```ts
     import app from "../backend/src/server.js";
     export default app;
     ```
  2. Add `rewrites` to `vercel.json`:
     ```json
     {
       "rewrites": [
         { "source": "/api/(.*)", "destination": "/api" },
         { "source": "/(.*)", "destination": "/index.html" }
       ]
     }
     ```
  3. Deploying to Vercel automatically exposes your backend API at `https://your-app.vercel.app/api`.

