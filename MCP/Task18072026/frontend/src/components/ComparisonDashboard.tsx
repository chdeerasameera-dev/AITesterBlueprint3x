import React, { useState, useEffect } from "react";
import { ServerDiscoveryResult, DailyServer } from "../types/mcp";
import { BarChart2, Server, Check, Copy, Edit3, Plus, Trash2, Globe, Terminal, Shield } from "lucide-react";

interface ComparisonDashboardProps {
  discoveryResults: Map<string, ServerDiscoveryResult>;
}

export const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({ discoveryResults }) => {
  const [dailyServers, setDailyServers] = useState<DailyServer[]>([]);
  const [copiedDailyMarkdown, setCopiedDailyMarkdown] = useState(false);
  const [isEditingDaily, setIsEditingDaily] = useState(false);
  const [newDailyItem, setNewDailyItem] = useState<Partial<DailyServer>>({ name: "", usage: "", transport: "local" });

  useEffect(() => {
    fetch("/api/daily-servers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDailyServers(data);
      })
      .catch((err) => console.error("Failed to load daily servers:", err));
  }, []);

  const handleSaveDailyServers = (updated: DailyServer[]) => {
    setDailyServers(updated);
    fetch("/api/daily-servers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  };

  const handleAddDailyServer = () => {
    if (!newDailyItem.name || !newDailyItem.usage) return;
    const newItem: DailyServer = {
      id: `daily-${Date.now()}`,
      name: newDailyItem.name,
      usage: newDailyItem.usage,
      transport: newDailyItem.transport || "local",
    };
    const next = [...dailyServers, newItem];
    handleSaveDailyServers(next);
    setNewDailyItem({ name: "", usage: "", transport: "local" });
  };

  const handleDeleteDailyServer = (id: string) => {
    const next = dailyServers.filter((s) => s.id !== id);
    handleSaveDailyServers(next);
  };

  const copyDailyMarkdownBlock = () => {
    let md = `/**\n * Daily-Use MCP Servers Reference List\n *\n`;
    for (const s of dailyServers) {
      md += ` * - ${s.name} (${s.transport}): ${s.usage}\n`;
    }
    md += ` */\n`;

    navigator.clipboard.writeText(md);
    setCopiedDailyMarkdown(true);
    setTimeout(() => setCopiedDailyMarkdown(false), 2000);
  };

  const resultsList = Array.from(discoveryResults.values());
  const maxToolsCount = Math.max(1, ...resultsList.map((r) => r.tools.length));

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* 1. Side-by-Side Server Capability Cards */}
      <div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Server size={18} color="var(--accent-teal)" /> Connected Servers Capability Snapshot
        </h2>

        {resultsList.length === 0 ? (
          <div className="ocean-card" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
            No connected servers to compare yet. Connect servers in the Connections tab.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {resultsList.map((res) => (
              <div key={res.serverId} className="ocean-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent-cyan)" }}>{res.name}</h3>
                  <span className={`badge ${res.isLocal ? "badge-local" : "badge-remote"}`}>
                    {res.isLocal ? "Local stdio" : "Remote SSE"}
                  </span>
                </div>

                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                  Auth: {res.authType || "N/A"}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", background: "var(--bg-input)", padding: "0.65rem", borderRadius: "var(--radius-sm)", textAlign: "center", marginBottom: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-teal)" }}>{res.tools.length}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Tools</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-cyan)" }}>{res.resources.length}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Resources</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-amber)" }}>{res.prompts.length}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Prompts</div>
                  </div>
                </div>

                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>
                  Synced: {new Date(res.lastSynced).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Visual Bar Chart Comparison */}
      {resultsList.length > 0 && (
        <div className="ocean-card">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BarChart2 size={18} color="var(--accent-cyan)" /> Tool Count Distribution Chart
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {resultsList.map((res) => {
              const percentage = Math.round((res.tools.length / maxToolsCount) * 100);
              return (
                <div key={res.serverId}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600 }}>
                      {res.name} ({res.isLocal ? "Local stdio" : "Remote SSE"})
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-teal)" }}>
                      {res.tools.length} Tools
                    </span>
                  </div>

                  <div style={{ background: "var(--bg-input)", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, var(--accent-teal), var(--accent-cyan))",
                        borderRadius: "6px",
                        transition: "width 0.5s ease-in-out",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Daily-Use MCP Servers Block */}
      <div className="ocean-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={18} color="var(--accent-amber)" /> Daily-Use MCP Servers Reference List
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Annotated list of everyday MCP servers for team documentation and code comment blocks.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem" }}
              onClick={() => setIsEditingDaily(!isEditingDaily)}
            >
              <Edit3 size={14} /> {isEditingDaily ? "Done Editing" : "Edit List"}
            </button>
            <button
              className="btn btn-primary"
              style={{ fontSize: "0.75rem" }}
              onClick={copyDailyMarkdownBlock}
            >
              {copiedDailyMarkdown ? <Check size={14} /> : <Copy size={14} />}
              {copiedDailyMarkdown ? "Copied Comment Block!" : "Copy Code Comment Block"}
            </button>
          </div>
        </div>

        {/* Add item form when editing */}
        {isEditingDaily && (
          <div style={{ background: "var(--bg-input)", padding: "1rem", borderRadius: "var(--radius-sm)", marginBottom: "1rem", display: "grid", gridTemplateColumns: "1fr 2fr 1fr auto", gap: "0.75rem", alignItems: "center" }}>
            <input
              className="input-field"
              placeholder="Server Name (e.g. Playwright MCP)"
              value={newDailyItem.name || ""}
              onChange={(e) => setNewDailyItem({ ...newDailyItem, name: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Usage description..."
              value={newDailyItem.usage || ""}
              onChange={(e) => setNewDailyItem({ ...newDailyItem, usage: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Transport (local/remote)"
              value={newDailyItem.transport || "local"}
              onChange={(e) => setNewDailyItem({ ...newDailyItem, transport: e.target.value })}
            />
            <button className="btn btn-primary" onClick={handleAddDailyServer}>
              <Plus size={14} /> Add
            </button>
          </div>
        )}

        {/* Cards Grid for Daily Servers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
          {dailyServers.map((server) => (
            <div
              key={server.id || server.name}
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--accent-cyan)" }}>
                  {server.name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span className="badge badge-local" style={{ fontSize: "0.65rem" }}>
                    {server.transport}
                  </span>
                  {isEditingDaily && (
                    <button
                      onClick={() => handleDeleteDailyServer(server.id)}
                      style={{ background: "none", border: "none", color: "var(--accent-rose)", cursor: "pointer" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {server.usage}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
