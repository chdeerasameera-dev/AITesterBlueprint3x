import React, { useState } from "react";
import { ServerConfig, ServerDiscoveryResult, ToolItem } from "../types/mcp";
import { Wrench, Folder, Lightbulb, Search, Filter, Play, ChevronDown, ChevronRight, Info, RefreshCw, Server } from "lucide-react";

interface DiscoveryPanelProps {
  serverResult: ServerDiscoveryResult | null;
  configs?: ServerConfig[];
  activeServerId?: string | null;
  setActiveServerId?: (id: string) => void;
  onConnect?: (config: ServerConfig) => Promise<void>;
  isLoading?: boolean;
  onOpenToolInPlayground: (tool: ToolItem) => void;
}

export const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({
  serverResult,
  configs = [],
  activeServerId,
  setActiveServerId,
  onConnect,
  isLoading = false,
  onOpenToolInPlayground,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"tools" | "resources" | "prompts">("tools");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());

  const activeConfig = configs.find((c) => c.id === activeServerId) || null;

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Server Selection Bar */}
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
            <Server size={18} color="var(--accent-teal)" />
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Active Server:
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
              {serverResult ? "Re-Sync Capabilities" : "Connect & Discover Server"}
            </button>
          )}
        </div>
      )}

      {/* If No Server Connected / Result Null */}
      {!serverResult ? (
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <div className="ocean-card" style={{ maxWidth: "550px", margin: "0 auto" }}>
            <Info size={44} color="var(--accent-cyan)" style={{ marginBottom: "1rem" }} />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              {activeConfig ? `Server '${activeConfig.name}' Not Connected` : "No MCP Server Connected"}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              {activeConfig
                ? `Click 'Connect & Discover Server' above to launch '${activeConfig.name}' and enumerate its exposed tools, resources, and prompts.`
                : "Please connect an MCP server in the Connections tab or select a target server from the dropdown above."}
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
        <>
          {/* Header Info Banner */}
          <div className="ocean-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{serverResult.name}</h2>
                <span className={`badge ${serverResult.isLocal ? "badge-local" : "badge-remote"}`}>
                  {serverResult.isLocal ? "Local stdio" : "Remote SSE"}
                </span>
                <span className={`status-dot ${serverResult.status === "connected" ? "green" : "red"}`} />
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Auth: {serverResult.authType || "N/A"} | Last Synced: {new Date(serverResult.lastSynced).toLocaleTimeString()}
              </div>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", textAlign: "right" }}>
              <div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-teal)" }}>
                  {serverResult.tools.length}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tools</div>
              </div>
              <div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
                  {serverResult.resources.length}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Resources</div>
              </div>
              <div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-amber)" }}>
                  {serverResult.prompts.length}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Prompts</div>
              </div>
            </div>
          </div>

          {/* Discovery Sub-Tabs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className={`btn ${activeSubTab === "tools" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setActiveSubTab("tools")}
              >
                <Wrench size={16} /> Tools ({serverResult.tools.length})
              </button>
              <button
                className={`btn ${activeSubTab === "resources" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setActiveSubTab("resources")}
              >
                <Folder size={16} /> Resources ({serverResult.resources.length})
              </button>
              <button
                className={`btn ${activeSubTab === "prompts" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setActiveSubTab("prompts")}
              >
                <Lightbulb size={16} /> Prompts ({serverResult.prompts.length})
              </button>
            </div>

            {activeSubTab === "tools" && (
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <div style={{ position: "relative", width: "240px" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
                  <input
                    className="input-field"
                    style={{ paddingLeft: "30px" }}
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Subtab 1: Tools */}
          {activeSubTab === "tools" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Category Filter Pills */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <Filter size={14} color="var(--text-muted)" />
                {["All", ...Array.from(new Set(serverResult.tools.map((t) => t.category || "General")))].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      background: selectedCategory === cat ? "var(--accent-teal)" : "var(--bg-input)",
                      color: selectedCategory === cat ? "#04101e" : "var(--text-secondary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "9999px",
                      padding: "0.2rem 0.65rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Tools Table */}
              <div className="ocean-card" style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(11, 21, 40, 0.9)", borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "0.75rem 1rem", width: "30px" }}></th>
                      <th style={{ padding: "0.75rem 1rem" }}>Tool Name</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Category</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Description</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serverResult.tools.filter((t) => {
                      const matchesSearch =
                        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesCategory = selectedCategory === "All" || (t.category || "General") === selectedCategory;
                      return matchesSearch && matchesCategory;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                          No matching tools found for search query.
                        </td>
                      </tr>
                    ) : (
                      serverResult.tools
                        .filter((t) => {
                          const matchesSearch =
                            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
                          const matchesCategory = selectedCategory === "All" || (t.category || "General") === selectedCategory;
                          return matchesSearch && matchesCategory;
                        })
                        .map((tool) => {
                          const isExpanded = expandedSchemas.has(tool.name);
                          return (
                            <React.Fragment key={tool.name}>
                              <tr style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.15s" }}>
                                <td style={{ padding: "0.75rem 0.5rem 0.75rem 1rem", cursor: "pointer" }} onClick={() => {
                                  const next = new Set(expandedSchemas);
                                  if (next.has(tool.name)) next.delete(tool.name);
                                  else next.add(tool.name);
                                  setExpandedSchemas(next);
                                }}>
                                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </td>
                                <td style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent-cyan)" }}>
                                  {tool.name}
                                </td>
                                <td style={{ padding: "0.75rem 1rem" }}>
                                  <span style={{
                                    background: "rgba(20, 184, 166, 0.1)",
                                    color: "var(--accent-teal)",
                                    padding: "0.15rem 0.5rem",
                                    borderRadius: "4px",
                                    fontSize: "0.75rem"
                                  }}>
                                    {tool.category || "General"}
                                  </span>
                                </td>
                                <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", maxWidth: "400px" }}>
                                  {tool.description || "No description provided."}
                                </td>
                                <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                                  <button
                                    className="btn btn-primary"
                                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                                    onClick={() => onOpenToolInPlayground(tool)}
                                  >
                                    <Play size={12} /> Playground
                                  </button>
                                </td>
                              </tr>

                              {/* Collapsible JSON Schema Row */}
                              {isExpanded && (
                                <tr style={{ background: "rgba(6, 11, 20, 0.5)" }}>
                                  <td colSpan={5} style={{ padding: "1rem 1.5rem" }}>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", fontWeight: 600 }}>
                                      JSON Input Schema:
                                    </div>
                                    <pre className="code-block" style={{ maxHeight: "200px" }}>
                                      {JSON.stringify(tool.inputSchema || {}, null, 2)}
                                    </pre>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subtab 2: Resources */}
          {activeSubTab === "resources" && (
            <div className="ocean-card">
              {serverResult.resources.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <Folder size={32} style={{ marginBottom: "0.5rem", opacity: 0.5 }} />
                  <div>This MCP server exposes zero resources.</div>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "0.75rem" }}>Resource Name</th>
                      <th style={{ padding: "0.75rem" }}>URI</th>
                      <th style={{ padding: "0.75rem" }}>Mime Type</th>
                      <th style={{ padding: "0.75rem" }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serverResult.resources.map((res) => (
                      <tr key={res.uri} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "0.75rem", fontWeight: 600 }}>{res.name}</td>
                        <td style={{ padding: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>{res.uri}</td>
                        <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{res.mimeType || "N/A"}</td>
                        <td style={{ padding: "0.75rem", color: "var(--text-secondary)" }}>{res.description || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Subtab 3: Prompts */}
          {activeSubTab === "prompts" && (
            <div className="ocean-card">
              {serverResult.prompts.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <Lightbulb size={32} style={{ marginBottom: "0.5rem", opacity: 0.5 }} />
                  <div>This MCP server exposes zero prompts.</div>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "0.75rem" }}>Prompt Name</th>
                      <th style={{ padding: "0.75rem" }}>Description</th>
                      <th style={{ padding: "0.75rem" }}>Arguments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serverResult.prompts.map((p) => (
                      <tr key={p.name} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "0.75rem", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent-amber)" }}>
                          {p.name}
                        </td>
                        <td style={{ padding: "0.75rem", color: "var(--text-secondary)" }}>{p.description || "N/A"}</td>
                        <td style={{ padding: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          {(p.arguments || []).map((a) => a.name).join(", ") || "None"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
