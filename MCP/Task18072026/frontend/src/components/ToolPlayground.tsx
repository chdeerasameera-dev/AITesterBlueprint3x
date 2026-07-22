import React, { useState, useEffect } from "react";
import { ServerConfig, ServerDiscoveryResult, ToolItem, ExecutionResult } from "../types/mcp";
import { Play, ShieldCheck, Code, CheckCircle2, XCircle, Clock, FileJson, Info, Server, RefreshCw } from "lucide-react";

interface ToolPlaygroundProps {
  config: ServerConfig | null;
  serverResult: ServerDiscoveryResult | null;
  configs?: ServerConfig[];
  activeServerId?: string | null;
  setActiveServerId?: (id: string) => void;
  onConnect?: (config: ServerConfig) => Promise<void>;
  isLoading?: boolean;
  initialTool: ToolItem | null;
  isReadOnlyGlobal: boolean;
}

export const ToolPlayground: React.FC<ToolPlaygroundProps> = ({
  config,
  serverResult,
  configs = [],
  activeServerId,
  setActiveServerId,
  onConnect,
  isLoading = false,
  initialTool,
  isReadOnlyGlobal,
}) => {
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(initialTool);
  const [useRawJson, setUseRawJson] = useState(false);
  const [formParams, setFormParams] = useState<Record<string, any>>({});
  const [rawJsonString, setRawJsonString] = useState("{}");
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);

  useEffect(() => {
    if (initialTool) {
      setSelectedTool(initialTool);
    } else if (serverResult && serverResult.tools.length > 0) {
      setSelectedTool(serverResult.tools[0]);
    } else {
      setSelectedTool(null);
    }
  }, [initialTool, serverResult]);

  useEffect(() => {
    if (selectedTool) {
      const defaultObj: Record<string, any> = {};
      const properties = selectedTool.inputSchema?.properties || {};
      for (const key of Object.keys(properties)) {
        defaultObj[key] = properties[key].default !== undefined ? properties[key].default : "";
      }
      setFormParams(defaultObj);
      setRawJsonString(JSON.stringify(defaultObj, null, 2));
      setLastResult(null);
    }
  }, [selectedTool]);

  const activeConfig = configs.find((c) => c.id === activeServerId) || config;

  const handleRunTool = async () => {
    if (!selectedTool || !activeConfig) return;

    let payload: Record<string, any> = {};
    if (useRawJson) {
      try {
        payload = JSON.parse(rawJsonString);
      } catch (err: any) {
        alert("Invalid JSON Payload format: " + err.message);
        return;
      }
    } else {
      payload = formParams;
    }

    setIsExecuting(true);
    setLastResult(null);

    try {
      const response = await fetch("/api/playground/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: activeConfig,
          toolName: selectedTool.name,
          params: payload,
          isReadOnlyMode: isReadOnlyGlobal,
        }),
      });

      const data: ExecutionResult = await response.json();
      setLastResult(data);
    } catch (err: any) {
      setLastResult({
        success: false,
        toolName: selectedTool.name,
        durationMs: 0,
        error: err.message || "Failed to communicate with proxy backend.",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const schemaProperties = selectedTool?.inputSchema?.properties || {};
  const requiredFields: string[] = selectedTool?.inputSchema?.required || [];

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Server Selector Bar */}
      {configs.length > 0 && setActiveServerId && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          padding: "0.75rem 1.25rem",
          borderRadius: "var(--radius-md)",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Server size={18} color="var(--accent-cyan)" />
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Target Server for Playground:
            </span>
            <select
              value={activeServerId || ""}
              onChange={(e) => setActiveServerId(e.target.value)}
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                padding: "0.4rem 0.75rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                outline: "none"
              }}
            >
              {configs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.transport === "stdio" ? "Local stdio" : "Remote SSE"})
                </option>
              ))}
            </select>
          </div>

          {activeConfig && onConnect && (
            <button
              className="btn btn-primary"
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}
              onClick={() => onConnect(activeConfig)}
              disabled={isLoading}
            >
              <RefreshCw size={14} className={isLoading ? "spin" : ""} />
              {serverResult ? "Re-Sync Server" : "Connect Server"}
            </button>
          )}
        </div>
      )}

      {/* Main Playground Content */}
      {!serverResult ? (
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <div className="ocean-card" style={{ maxWidth: "550px", margin: "0 auto" }}>
            <Info size={44} color="var(--accent-cyan)" style={{ marginBottom: "1rem" }} />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              {activeConfig ? `Server '${activeConfig.name}' Not Synced` : "Select an MCP Server"}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              {activeConfig
                ? `Connect '${activeConfig.name}' to discover and test its tools interactively.`
                : "Please select or connect an MCP server first to test tools in the playground."}
            </p>
            {activeConfig && onConnect && (
              <button
                className="btn btn-primary"
                onClick={() => onConnect(activeConfig)}
                disabled={isLoading}
              >
                <RefreshCw size={16} className={isLoading ? "spin" : ""} />
                Connect {activeConfig.name} Now
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Left Column: Tool Selection & Form Inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Tool Select Header Card */}
            <div className="ocean-card">
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.4rem" }}>
                Select Discovered Tool ({serverResult.name})
              </label>
              <select
                className="input-field"
                value={selectedTool?.name || ""}
                onChange={(e) => {
                  const found = serverResult.tools.find((t) => t.name === e.target.value);
                  if (found) setSelectedTool(found);
                }}
              >
                {serverResult.tools.map((tool) => (
                  <option key={tool.name} value={tool.name}>
                    {tool.name} — ({tool.category || "General"})
                  </option>
                ))}
              </select>

              {selectedTool && (
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--border-color)" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent-cyan)", marginBottom: "0.25rem" }}>
                    {selectedTool.name}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {selectedTool.description || "No description available."}
                  </p>
                </div>
              )}
            </div>

            {/* Input Parameters Form Card */}
            <div className="ocean-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <FileJson size={16} color="var(--accent-teal)" /> Tool Input Parameters
                </h3>

                {/* Toggle Raw JSON Editor */}
                <button
                  className="btn btn-secondary"
                  style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                  onClick={() => setUseRawJson(!useRawJson)}
                >
                  <Code size={14} /> {useRawJson ? "Switch to Form Mode" : "Switch to Raw JSON"}
                </button>
              </div>

              {useRawJson ? (
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                    Edit Raw JSON Arguments Payload:
                  </label>
                  <textarea
                    className="code-block"
                    style={{ width: "100%", height: "220px", resize: "vertical" }}
                    value={rawJsonString}
                    onChange={(e) => setRawJsonString(e.target.value)}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "300px", overflowY: "auto" }}>
                  {Object.keys(schemaProperties).length === 0 ? (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      This tool accepts no input parameters.
                    </div>
                  ) : (
                    Object.keys(schemaProperties).map((key) => {
                      const prop = schemaProperties[key];
                      const isReq = requiredFields.includes(key);

                      return (
                        <div key={key}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem", fontSize: "0.8rem" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
                              {key} {isReq && <span style={{ color: "var(--accent-rose)" }}>*</span>}
                            </span>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                              {prop.type || "string"}
                            </span>
                          </div>
                          <input
                            className="input-field"
                            placeholder={prop.description || key}
                            value={formParams[key] ?? ""}
                            onChange={(e) => setFormParams({ ...formParams, [key]: e.target.value })}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Action Bar */}
              <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
                  <ShieldCheck size={16} color={isReadOnlyGlobal ? "var(--accent-emerald)" : "var(--text-muted)"} />
                  <span style={{ color: isReadOnlyGlobal ? "var(--accent-emerald)" : "var(--text-muted)" }}>
                    Read-Only Safety: {isReadOnlyGlobal ? "ON (Mutations Blocked)" : "OFF"}
                  </span>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleRunTool}
                  disabled={isExecuting || !selectedTool}
                >
                  <Play size={16} /> {isExecuting ? "Executing Call..." : "Execute Tool Call"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Execution Response & Diagnostics */}
          <div className="ocean-card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600 }}>Execution Result & Response</h3>

              {lastResult && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Clock size={14} color="var(--text-muted)" />
                    <span style={{ fontFamily: "var(--font-mono)" }}>{lastResult.durationMs}ms</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    {lastResult.success ? (
                      <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    ) : (
                      <XCircle size={16} color="var(--accent-rose)" />
                    )}
                    <span style={{ fontWeight: 600, color: lastResult.success ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                      {lastResult.success ? "SUCCESS 200" : "ERROR"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {lastResult ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {lastResult.error && (
                  <div style={{
                    background: "rgba(244, 63, 94, 0.15)",
                    border: "1px solid rgba(244, 63, 94, 0.4)",
                    color: "#fda4af",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem"
                  }}>
                    <strong>Execution Error:</strong> {lastResult.error}
                  </div>
                )}

                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                    Raw JSON-RPC Response Output:
                  </label>
                  <pre className="code-block" style={{ flex: 1, maxHeight: "420px" }}>
                    {JSON.stringify(lastResult.result || lastResult.error, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: "0.5rem" }}>
                <Play size={36} style={{ opacity: 0.4 }} />
                <div>Click "Execute Tool Call" to trigger live execution against {serverResult.name}.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
