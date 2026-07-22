import React, { useState, useEffect } from "react";
import "./styles/ocean-theme.css";
import { ServerConfig, ServerDiscoveryResult, ToolItem } from "./types/mcp";
import { Navbar, NavTab } from "./components/Navbar";
import { ConnectionManager } from "./components/ConnectionManager";
import { DiscoveryPanel } from "./components/DiscoveryPanel";
import { ToolPlayground } from "./components/ToolPlayground";
import { ComparisonDashboard } from "./components/ComparisonDashboard";
import { ExportModal } from "./components/ExportModal";
import { McpInfoPanel } from "./components/McpInfoPanel";
import { McpRegistryExplorer } from "./components/McpRegistryExplorer";

const DEFAULT_PRESET_CONFIGS: ServerConfig[] = [
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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("connection");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [configs, setConfigs] = useState<ServerConfig[]>(DEFAULT_PRESET_CONFIGS);
  const [presets, setPresets] = useState<ServerConfig[]>(DEFAULT_PRESET_CONFIGS);
  const [discoveryResults, setDiscoveryResults] = useState<Map<string, ServerDiscoveryResult>>(new Map());
  const [activeServerId, setActiveServerId] = useState<string | null>("preset-playwright");
  const [selectedToolForPlayground, setSelectedToolForPlayground] = useState<ToolItem | null>(null);
  const [isReadOnlyGlobal, setIsReadOnlyGlobal] = useState<boolean>(true);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync theme attribute to HTML document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Initial Load Presets and Stored Configs with multi-route fallback
  useEffect(() => {
    const fetchWithFallback = async (endpoints: string[]) => {
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint);
          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              return await res.json();
            }
          }
        } catch (err) {
          // ignore and try next
        }
      }
      return null;
    };

    fetchWithFallback(["/api/presets", "/_/backend/api/presets"]).then((data) => {
      if (data && data.presets && data.presets.length > 0) setPresets(data.presets);
    });

    fetchWithFallback(["/api/configs", "/_/backend/api/configs"]).then((data) => {
      if (data && data.configs && data.configs.length > 0) {
        setConfigs(data.configs);
        setActiveServerId(data.configs[0].id);
      }
    });
  }, []);

  const handleSaveConfig = (config: ServerConfig) => {
    fetch("/api/configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setConfigs((prev) => {
            const idx = prev.findIndex((c) => c.id === config.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = config;
              return updated;
            }
            return [...prev, config];
          });
        }
      });
  };

  const handleDeleteConfig = (id: string) => {
    fetch(`/api/configs/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        setConfigs((prev) => prev.filter((c) => c.id !== id));
        const nextMap = new Map(discoveryResults);
        nextMap.delete(id);
        setDiscoveryResults(nextMap);
        if (activeServerId === id) setActiveServerId(null);
      });
  };

  const handleConnect = async (config: ServerConfig) => {
    setIsLoading(true);
    try {
      const endpoints = ["/api/discover", "/_/backend/api/discover"];
      let discovery: ServerDiscoveryResult | null = null;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(config),
          });
          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              discovery = await res.json();
              break;
            }
          }
        } catch (e) {
          // try next fallback endpoint
        }
      }

      if (discovery) {
        setDiscoveryResults((prev) => new Map(prev).set(config.id, discovery!));
        setActiveServerId(config.id);
        setActiveTab("discovery");
      } else {
        const errorResult: ServerDiscoveryResult = {
          serverId: config.id,
          name: config.name,
          transport: config.transport,
          isLocal: config.transport === "stdio",
          status: "error",
          errorDetails: config.transport === "stdio"
            ? "Local stdio child process backend is offline. Run 'cd backend && npm start' on http://localhost:3001."
            : "Remote MCP server endpoint unreachable. Verify URL or authentication header.",
          lastSynced: new Date().toLocaleTimeString(),
          tools: [],
          resources: [],
          prompts: []
        };
        setDiscoveryResults((prev) => new Map(prev).set(config.id, errorResult));
        setActiveServerId(config.id);
        setActiveTab("discovery");
      }
    } catch (err: any) {
      console.error("Connect error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenToolInPlayground = (tool: ToolItem) => {
    setSelectedToolForPlayground(tool);
    setActiveTab("playground");
  };

  const activeConfig = configs.find((c) => c.id === activeServerId) || null;
  const activeServerResult = activeServerId ? discoveryResults.get(activeServerId) || null : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeServerResult={activeServerResult}
        onOpenExport={() => setIsExportOpen(true)}
        isReadOnlyGlobal={isReadOnlyGlobal}
        setIsReadOnlyGlobal={setIsReadOnlyGlobal}
        theme={theme}
        setTheme={setTheme}
      />

      <main style={{ flex: 1, background: "var(--bg-primary)" }}>
        {activeTab === "connection" && (
          <ConnectionManager
            configs={configs}
            presets={presets}
            onSaveConfig={handleSaveConfig}
            onDeleteConfig={handleDeleteConfig}
            onConnect={handleConnect}
            discoveryResults={discoveryResults}
            activeServerId={activeServerId}
            setActiveServerId={setActiveServerId}
            isLoading={isLoading}
          />
        )}

        {activeTab === "discovery" && (
          <DiscoveryPanel
            serverResult={activeServerResult}
            configs={configs}
            activeServerId={activeServerId}
            setActiveServerId={setActiveServerId}
            onConnect={handleConnect}
            isLoading={isLoading}
            onOpenToolInPlayground={handleOpenToolInPlayground}
          />
        )}

        {activeTab === "playground" && (
          <ToolPlayground
            config={activeConfig}
            serverResult={activeServerResult}
            configs={configs}
            activeServerId={activeServerId}
            setActiveServerId={setActiveServerId}
            onConnect={handleConnect}
            isLoading={isLoading}
            initialTool={selectedToolForPlayground}
            isReadOnlyGlobal={isReadOnlyGlobal}
          />
        )}

        {activeTab === "dashboard" && (
          <ComparisonDashboard discoveryResults={discoveryResults} />
        )}

        {activeTab === "registry" && (
          <McpRegistryExplorer
            onImportConfig={(config) => {
              handleSaveConfig(config);
              setActiveTab("connection");
            }}
          />
        )}

        {activeTab === "info" && <McpInfoPanel />}
      </main>

      {isExportOpen && (
        <ExportModal
          discoveryResults={discoveryResults}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
};
