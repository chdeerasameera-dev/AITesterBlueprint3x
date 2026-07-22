import React, { useState } from "react";
import { ServerConfig, ServerDiscoveryResult } from "../types/mcp";
import { Server, Plus, Zap, CheckCircle2, AlertTriangle, XCircle, Trash2, RefreshCw, Lock, Terminal, Globe, Info } from "lucide-react";

interface ConnectionManagerProps {
  configs: ServerConfig[];
  presets: ServerConfig[];
  onSaveConfig: (config: ServerConfig) => void;
  onDeleteConfig: (id: string) => void;
  onConnect: (config: ServerConfig) => Promise<void>;
  discoveryResults: Map<string, ServerDiscoveryResult>;
  activeServerId: string | null;
  setActiveServerId: (id: string) => void;
  isLoading: boolean;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({
  configs,
  presets,
  onSaveConfig,
  onDeleteConfig,
  onConnect,
  discoveryResults,
  activeServerId,
  setActiveServerId,
  isLoading,
}) => {
  const [selectedConfig, setSelectedConfig] = useState<Partial<ServerConfig>>({
    name: "",
    transport: "stdio",
    command: "npx -y @playwright/mcp@latest",
    args: [],
    authType: "None",
  });

  const [rawErrorModal, setRawErrorModal] = useState<{ name: string; error: string } | null>(null);

  const handleSelectPreset = async (preset: ServerConfig) => {
    const finalConfig: ServerConfig = {
      ...preset,
      id: preset.id || `preset-${Date.now()}`,
    };
    setSelectedConfig(finalConfig);
    onSaveConfig(finalConfig);
    await onConnect(finalConfig);
    setActiveServerId(finalConfig.id);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig.name || !selectedConfig.transport) return;

    const finalConfig: ServerConfig = {
      id: selectedConfig.id || `server-${Date.now()}`,
      name: selectedConfig.name,
      transport: selectedConfig.transport,
      command: selectedConfig.command,
      args: selectedConfig.args || [],
      url: selectedConfig.url,
      authType: selectedConfig.authType || "None",
      authHeader: selectedConfig.authHeader,
      readOnlyDefault: selectedConfig.readOnlyDefault ?? true,
    };

    onSaveConfig(finalConfig);
    await onConnect(finalConfig);
    setActiveServerId(finalConfig.id);
  };

  return (
    <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      {/* Left Column: Preset Templates & Server Config Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Preset Templates Card */}
        <div className="ocean-card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Zap size={18} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Target MCP Server Presets</h2>
          </div>
          <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
            One-click presets for Playwright, Atlassian Rovo, and GitHub MCP servers.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.75rem",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--accent-teal)")}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border-color)")}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{preset.name}</span>
                  <span className={`badge ${preset.transport === "stdio" ? "badge-local" : "badge-remote"}`}>
                    {preset.transport === "stdio" ? "Local" : "Remote"}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {preset.transport === "stdio" ? preset.command : preset.url}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* How to Connect MCP Servers Guide Banner */}
        <div style={{
          gridColumn: "1 / -1",
          background: "rgba(0, 242, 254, 0.08)",
          border: "1px solid rgba(0, 242, 254, 0.25)",
          borderRadius: "var(--radius-md)",
          padding: "1rem 1.25rem",
          marginBottom: "0.5rem",
          fontSize: "0.85rem",
          lineHeight: 1.55,
          color: "var(--text-secondary)"
        }}>
          <div style={{ fontWeight: 700, color: "var(--accent-cyan)", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Info size={16} /> How to Connect MCP Servers (Local vs Remote):
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <li>
              <strong>Local stdio Child Processes (Playwright MCP, Local Filesystem)</strong>: Run locally on your PC. Make sure the local Express backend proxy is running on your machine (<code style={{ color: "var(--accent-teal)" }}>cd backend && npm start</code> on <code style={{ color: "var(--accent-cyan)" }}>http://localhost:3001</code>) so your OS can spawn local child processes.
            </li>
            <li>
              <strong>Remote Streamable HTTP / SSE Servers (Atlassian Rovo, GitHub Copilot, AdAdvisor)</strong>: Connect directly over HTTPS! Select a preset or enter the endpoint URL, enter your Bearer token/key if required, and click <strong>"Save & Connect"</strong>.
            </li>
          </ul>
        </div>

        {/* Configure / Edit Form */}
        <div className="ocean-card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Plus size={18} color="var(--accent-teal)" />
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>
              {selectedConfig.id ? "Edit Connection Config" : "Add MCP Server"}
            </h2>
          </div>

          <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>
                Server Name *
              </label>
              <input
                className="input-field"
                placeholder="e.g. Playwright MCP Local"
                value={selectedConfig.name || ""}
                onChange={(e) => setSelectedConfig({ ...selectedConfig, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>
                  Transport Type *
                </label>
                <select
                  className="input-field"
                  value={selectedConfig.transport}
                  onChange={(e) => setSelectedConfig({ ...selectedConfig, transport: e.target.value as any })}
                >
                  <option value="stdio">stdio (Local Child Process)</option>
                  <option value="sse">SSE / HTTP (Remote Streamable)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>
                  Auth Type
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. PAT / Bearer Token"
                  value={selectedConfig.authType || ""}
                  onChange={(e) => setSelectedConfig({ ...selectedConfig, authType: e.target.value })}
                />
              </div>
            </div>

            {selectedConfig.transport === "stdio" ? (
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>
                  Command & Arguments (Local stdio process) *
                </label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <Terminal size={18} color="var(--accent-teal)" />
                  <input
                    className="input-field"
                    placeholder="e.g. npx -y @playwright/mcp@latest"
                    value={selectedConfig.command || ""}
                    onChange={(e) => setSelectedConfig({ ...selectedConfig, command: e.target.value })}
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>
                  Remote SSE/HTTP Endpoint URL *
                </label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <Globe size={18} color="var(--accent-cyan)" />
                  <input
                    className="input-field"
                    placeholder="https://mcp.atlassian.com/v1/mcp/authv2"
                    value={selectedConfig.url || ""}
                    onChange={(e) => setSelectedConfig({ ...selectedConfig, url: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>
                Auth Token / Header (Stored locally in memory, never in exports)
              </label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <Lock size={16} color="var(--accent-amber)" />
                <input
                  type="password"
                  className="input-field"
                  placeholder="ghp_xxxx or Atlassian Bearer token"
                  value={selectedConfig.authHeader || ""}
                  onChange={(e) => setSelectedConfig({ ...selectedConfig, authHeader: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ flex: 1 }}>
                {isLoading ? <RefreshCw size={16} className="spin" /> : <CheckCircle2 size={16} />}
                Connect & Discover
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column: Configured MCP Server Cards */}
      <div className="ocean-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Server size={18} color="var(--accent-teal)" />
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Configured MCP Servers ({configs.length})</h2>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "600px", overflowY: "auto" }}>
          {configs.map((config) => {
            const result = discoveryResults.get(config.id);
            const isActive = activeServerId === config.id;

            return (
              <div
                key={config.id}
                style={{
                  background: isActive ? "rgba(6, 182, 212, 0.1)" : "var(--bg-input)",
                  border: isActive ? "1px solid var(--accent-cyan)" : "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className={`badge ${config.transport === "stdio" ? "badge-local" : "badge-remote"}`}>
                      {config.transport === "stdio" ? "Local stdio" : "Remote SSE"}
                    </span>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 600 }}>{config.name}</h3>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                      onClick={() => onConnect(config)}
                      disabled={isLoading}
                    >
                      <RefreshCw size={12} /> Sync
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                      onClick={() => {
                        setSelectedConfig(config);
                        setActiveServerId(config.id);
                      }}
                    >
                      Select
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: "0.25rem 0.4rem" }}
                      onClick={() => onDeleteConfig(config.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {config.transport === "stdio" ? config.command : config.url}
                </div>

                {/* Status Indicator & Quick Tool Count */}
                {result ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "0.5rem",
                    paddingTop: "0.5rem",
                    borderTop: "1px dashed var(--border-color)",
                    fontSize: "0.8rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      {result.status === "connected" && <CheckCircle2 size={16} color="var(--accent-emerald)" />}
                      {result.status === "auth_required" && <AlertTriangle size={16} color="var(--accent-amber)" />}
                      {result.status === "error" && <XCircle size={16} color="var(--accent-rose)" />}
                      <span style={{ fontWeight: 600, color: result.status === "connected" ? "var(--accent-emerald)" : result.status === "auth_required" ? "var(--accent-amber)" : "var(--accent-rose)" }}>
                        {result.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ color: "var(--text-secondary)" }}>
                      Tools: <strong>{result.tools.length}</strong> | Res: <strong>{result.resources.length}</strong> | Prompts: <strong>{result.prompts.length}</strong>
                    </div>

                    {result.errorDetails && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "0.2rem 0.4rem", fontSize: "0.7rem", color: "var(--accent-rose)" }}
                        onClick={() => setRawErrorModal({ name: config.name, error: result.errorDetails || "" })}
                      >
                        View x-deny-reason
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.25rem" }}>
                    Not synced yet. Click 'Sync' to connect and enumerate capabilities.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Error Diagnostic Modal */}
      {rawErrorModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100
        }}>
          <div className="ocean-card" style={{ width: "500px", maxWidth: "90vw" }}>
            <h3 style={{ color: "var(--accent-rose)", marginBottom: "0.5rem" }}>
              Connection Error ({rawErrorModal.name})
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Raw diagnostic payload / header x-deny-reason output:
            </p>
            <pre className="code-block" style={{ color: "#fca5a5" }}>
              {rawErrorModal.error}
            </pre>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button className="btn btn-secondary" onClick={() => setRawErrorModal(null)}>
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
