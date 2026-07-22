import { Router, Request, Response } from "express";
import { mcpManager, ServerConfig, ServerDiscoveryResult } from "../mcpManager.js";
import fs from "fs";
import path from "path";

const router = Router();
const DATA_DIR = path.join(process.cwd(), "..", "daily-mcp-servers.json");
const CONFIGS_FILE = path.join(process.cwd(), "server-configs.json");

// Default Target Preset Templates
const PRESET_CONFIGS: ServerConfig[] = [
  {
    id: "preset-playwright",
    name: "Playwright MCP",
    transport: "stdio",
    command: "npx -y @playwright/mcp@latest",
    args: [],
    authType: "N/A (Local stdio)",
    readOnlyDefault: true,
  },
  {
    id: "preset-atlassian-remote",
    name: "Atlassian Rovo MCP",
    transport: "sse",
    url: "https://mcp.atlassian.com/v1/mcp/authv2",
    authType: "OAuth 2.1 / API Token",
    readOnlyDefault: true,
  },
  {
    id: "preset-github-local",
    name: "GitHub MCP (Local Docker)",
    transport: "stdio",
    command: "docker",
    args: ["run", "-i", "--rm", "ghcr.io/github/github-mcp-server"],
    authType: "PAT (Environment)",
    readOnlyDefault: true,
  },
  {
    id: "preset-github-remote",
    name: "GitHub MCP (Remote Hosted)",
    transport: "sse",
    url: "https://api.githubcopilot.com/mcp/",
    authType: "OAuth 2.0 / PAT",
    readOnlyDefault: true,
  },
];

// Load persisted configs
function loadStoredConfigs(): ServerConfig[] {
  if (fs.existsSync(CONFIGS_FILE)) {
    try {
      const data = fs.readFileSync(CONFIGS_FILE, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      console.error("Error reading stored configs:", err);
    }
  }
  return [...PRESET_CONFIGS];
}

function saveStoredConfigs(configs: ServerConfig[]) {
  try {
    fs.writeFileSync(CONFIGS_FILE, JSON.stringify(configs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving configs:", err);
  }
}

// 0. GET Live MCP Servers from Official Registry (registry.modelcontextprotocol.io)
router.get("/registry", async (req: Request, res: Response) => {
  try {
    const search = req.query.search ? String(req.query.search) : "";
    let targetUrl = "https://registry.modelcontextprotocol.io/v0.1/servers?version=latest&limit=100";
    if (search) {
      targetUrl += `&search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Registry API returned status ${response.status}`);
    }

    const data = await response.json();
    res.json({ success: true, servers: data.servers || [], metadata: data.metadata || {} });
  } catch (error: any) {
    console.error("Registry fetch error:", error.message);
    res.json({ success: false, error: error.message, servers: [] });
  }
});

// 1. GET Preset Configs
router.get("/presets", (req: Request, res: Response) => {
  res.json({ presets: PRESET_CONFIGS });
});

// 2. GET Server Configs
router.get("/configs", (req: Request, res: Response) => {
  const configs = loadStoredConfigs();
  res.json({ configs });
});

// 3. POST / Save Server Config
router.post("/configs", (req: Request, res: Response) => {
  const newConfig: ServerConfig = req.body;
  if (!newConfig.id || !newConfig.name || !newConfig.transport) {
    return res.status(400).json({ error: "id, name, and transport are required." });
  }

  const configs = loadStoredConfigs();
  const index = configs.findIndex((c) => c.id === newConfig.id);
  if (index >= 0) {
    configs[index] = newConfig;
  } else {
    configs.push(newConfig);
  }

  saveStoredConfigs(configs);
  res.json({ success: true, config: newConfig });
});

// 4. DELETE Server Config
router.delete("/configs/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  let configs = loadStoredConfigs();
  configs = configs.filter((c) => c.id !== id);
  saveStoredConfigs(configs);
  res.json({ success: true, id });
});

// 5. POST / Discover Server Capabilities
router.post("/discover", async (req: Request, res: Response) => {
  const config: ServerConfig = req.body;
  if (!config.name || !config.transport) {
    return res.status(400).json({ error: "Invalid server configuration." });
  }

  const discovery = await mcpManager.discoverServer(config);
  res.json(discovery);
});

// 6. POST / Call Tool
router.post("/playground/call", async (req: Request, res: Response) => {
  const { config, toolName, params, isReadOnlyMode } = req.body;
  if (!config || !toolName) {
    return res.status(400).json({ error: "Missing config or toolName." });
  }

  try {
    const result = await mcpManager.callTool(
      config,
      toolName,
      params || {},
      Boolean(isReadOnlyMode)
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      toolName,
      error: error.message || "Execution failed.",
    });
  }
});

// 7. GET / Daily-Use MCP Servers List
router.get("/daily-servers", (req: Request, res: Response) => {
  try {
    if (fs.existsSync(DATA_DIR)) {
      const content = fs.readFileSync(DATA_DIR, "utf-8");
      return res.json(JSON.parse(content));
    }
  } catch (e) {
    console.error("Error reading daily-mcp-servers.json:", e);
  }

  res.json([]);
});

// 8. PUT / Update Daily-Use MCP Servers List
router.put("/daily-servers", (req: Request, res: Response) => {
  try {
    const data = req.body;
    fs.writeFileSync(DATA_DIR, JSON.stringify(data, null, 2), "utf-8");
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// 9. POST / Export Capability Report (Markdown & JSON)
router.post("/export", (req: Request, res: Response) => {
  const { results, combined } = req.body as {
    results: ServerDiscoveryResult[];
    combined: boolean;
  };

  if (!results || !Array.isArray(results)) {
    return res.status(400).json({ error: "Invalid discovery results for export." });
  }

  const timestamp = new Date().toISOString();

  // Clean raw JSON manifest (redact credentials)
  const jsonManifest = {
    generatedAt: timestamp,
    serversCount: results.length,
    servers: results.map((r) => ({
      serverId: r.serverId,
      name: r.name,
      transport: r.transport,
      isLocal: r.isLocal,
      status: r.status,
      authType: r.authType,
      toolCount: r.tools.length,
      resourceCount: r.resources.length,
      promptCount: r.prompts.length,
      tools: r.tools,
      resources: r.resources,
      prompts: r.prompts,
    })),
  };

  // Generate Markdown Report
  let mdReport = `# 📊 MCP Capability Report\n\n`;
  mdReport += `> Generated by **MCP Inspector Explorer** on \`${timestamp}\`\n\n`;

  mdReport += `## 📋 Summary Table\n\n`;
  mdReport += `| Server | Transport | Mode | Status | Tools | Resources | Prompts | Auth Type |\n`;
  mdReport += `|---|---|---|---|---|---|---|---|\n`;

  for (const s of results) {
    const mode = s.isLocal ? "Local" : "Remote";
    mdReport += `| **${s.name}** | \`${s.transport}\` | ${mode} | \`${s.status}\` | ${s.tools.length} | ${s.resources.length} | ${s.prompts.length} | ${s.authType || "N/A"} |\n`;
  }

  mdReport += `\n---\n\n`;

  for (const s of results) {
    mdReport += `## 🔹 ${s.name}\n\n`;
    mdReport += `- **Transport**: \`${s.transport}\` (${s.isLocal ? "Local" : "Remote"})\n`;
    mdReport += `- **Status**: \`${s.status}\`\n`;
    mdReport += `- **Auth Type**: ${s.authType || "None"}\n`;
    mdReport += `- **Last Synced**: ${s.lastSynced}\n\n`;

    // Tools Table
    mdReport += `### 🛠 Discovered Tools (${s.tools.length})\n\n`;
    if (s.tools.length === 0) {
      mdReport += `*No tools exposed or server not connected.*\n\n`;
    } else {
      mdReport += `| Tool Name | Category | Description |\n`;
      mdReport += `|---|---|---|\n`;
      for (const t of s.tools) {
        const desc = (t.description || "N/A").replace(/\n/g, " ");
        mdReport += `| \`${t.name}\` | ${t.category || "General"} | ${desc} |\n`;
      }
      mdReport += `\n`;
    }

    // Resources Table
    mdReport += `### 📁 Discovered Resources (${s.resources.length})\n\n`;
    if (s.resources.length === 0) {
      mdReport += `*No resources exposed by this server.*\n\n`;
    } else {
      mdReport += `| Resource Name | URI | Mime Type | Description |\n`;
      mdReport += `|---|---|---|---|\n`;
      for (const r of s.resources) {
        mdReport += `| ${r.name} | \`${r.uri}\` | ${r.mimeType || "N/A"} | ${r.description || "N/A"} |\n`;
      }
      mdReport += `\n`;
    }

    // Prompts Table
    mdReport += `### 💡 Discovered Prompts (${s.prompts.length})\n\n`;
    if (s.prompts.length === 0) {
      mdReport += `*No prompts exposed by this server.*\n\n`;
    } else {
      mdReport += `| Prompt Name | Description | Arguments |\n`;
      mdReport += `|---|---|---|\n`;
      for (const p of s.prompts) {
        const args = (p.arguments || []).map((a) => a.name).join(", ") || "None";
        mdReport += `| \`${p.name}\` | ${p.description || "N/A"} | \`${args}\` |\n`;
      }
      mdReport += `\n`;
    }

    mdReport += `---\n\n`;
  }

  res.json({
    markdown: mdReport,
    json: jsonManifest,
  });
});

export default router;
