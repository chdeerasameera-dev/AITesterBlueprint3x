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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("connection");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [configs, setConfigs] = useState<ServerConfig[]>([]);
  const [presets, setPresets] = useState<ServerConfig[]>([]);
  const [discoveryResults, setDiscoveryResults] = useState<Map<string, ServerDiscoveryResult>>(new Map());
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [selectedToolForPlayground, setSelectedToolForPlayground] = useState<ToolItem | null>(null);
  const [isReadOnlyGlobal, setIsReadOnlyGlobal] = useState<boolean>(true);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync theme attribute to HTML document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Initial Load Presets and Stored Configs
  useEffect(() => {
    fetch("/api/presets")
      .then((res) => res.json())
      .then((data) => {
        if (data.presets) setPresets(data.presets);
      })
      .catch((err) => console.error("Presets error:", err));

    fetch("/api/configs")
      .then((res) => res.json())
      .then((data) => {
        if (data.configs) {
          setConfigs(data.configs);
          if (data.configs.length > 0) {
            setActiveServerId(data.configs[0].id);
          }
        }
      })
      .catch((err) => console.error("Configs error:", err));
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
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const discovery: ServerDiscoveryResult = await res.json();
      setDiscoveryResults((prev) => new Map(prev).set(config.id, discovery));
      setActiveServerId(config.id);
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
