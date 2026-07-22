import React, { useState, useEffect } from "react";
import { ServerConfig } from "../types/mcp";
import {
  Store,
  Search,
  ExternalLink,
  Github,
  Terminal,
  Globe,
  CheckCircle2,
  Shield,
  Layers,
  Zap,
  Info,
  X,
  Code,
  ArrowRight,
  Filter,
  PlusCircle
} from "lucide-react";

interface RegistryItem {
  server: {
    name: string;
    description?: string;
    title?: string;
    version: string;
    websiteUrl?: string;
    repository?: { url?: string; source?: string };
    remotes?: { type: string; url?: string; headers?: any[] }[];
    packages?: { registryType: string; identifier: string; version?: string; transport?: { type: string }; environmentVariables?: any[] }[];
    icons?: { src: string }[];
  };
  _meta?: {
    "io.modelcontextprotocol.registry/official"?: {
      status: string;
      publishedAt?: string;
      updatedAt?: string;
      isLatest?: boolean;
    };
    "io.modelcontextprotocol.registry/publisher-provided"?: any;
  };
}

interface McpRegistryExplorerProps {
  onImportConfig: (config: ServerConfig) => void;
}

const FALLBACK_REGISTRY_SERVERS: RegistryItem[] = [
  {
    server: {
      name: "ac.inference.sh/mcp",
      title: "inference.sh",
      description: "Run 150+ AI apps — image, video, audio, LLMs, 3D and more. Browse, execute, stream results.",
      version: "2.0.0",
      remotes: [{ type: "streamable-http", url: "https://api.inference.sh/mcp" }],
      websiteUrl: "https://sh.inference.ac"
    },
    _meta: { "io.modelcontextprotocol.registry/official": { status: "active" } }
  },
  {
    server: {
      name: "ai.adadvisor/mcp-server",
      title: "AdAdvisor MCP Server",
      description: "Query Meta Ads performance data — accounts, campaigns, ad sets, ads, metrics & settings.",
      version: "1.0.1",
      remotes: [{ type: "streamable-http", url: "https://api.adadvisor.ai/mcp" }],
      websiteUrl: "https://www.adadvisor.ai"
    },
    _meta: { "io.modelcontextprotocol.registry/official": { status: "active" } }
  },
  {
    server: {
      name: "ai.adeu/adeu",
      title: "Automated DOCX Redlining Engine",
      description: "Automated legal document & DOCX redlining engine for legal AI agent workflows.",
      version: "1.7.1",
      packages: [{ registryType: "npm", identifier: "@adeu/mcp-server", version: "1.7.1" }],
      repository: { url: "https://github.com/dealfluence/adeu" }
    },
    _meta: { "io.modelcontextprotocol.registry/official": { status: "active" } }
  },
  {
    server: {
      name: "ai.agentdm/agentdm",
      title: "AgentDM: Agent to Agent Communication",
      description: "Agent-to-agent messaging platform using MCP for cross-model communication and channels.",
      version: "2.0.0",
      remotes: [{ type: "streamable-http", url: "https://api.agentdm.ai/mcp/v1/grid" }],
      websiteUrl: "https://agentdm.ai"
    },
    _meta: { "io.modelcontextprotocol.registry/official": { status: "active" } }
  },
  {
    server: {
      name: "ai.agenttrust/mcp-server",
      title: "AgentTrust — Identity & Trust for AI Agents",
      description: "Identity, trust, and A2A orchestration for autonomous AI agents. Official A2A partner.",
      version: "1.1.1",
      packages: [{ registryType: "npm", identifier: "@agenttrust/mcp-server", version: "1.1.1" }],
      websiteUrl: "https://agenttrust.ai"
    },
    _meta: { "io.modelcontextprotocol.registry/official": { status: "active" } }
  },
  {
    server: {
      name: "ai.alphacreek/alphacreek-mcp",
      title: "AlphaCreek SEC Filings MCP",
      description: "Access SEC filings efficiently (10-K, 10-Q, etc), save time and tokens, and get cited financial answers.",
      version: "1.0.1",
      remotes: [{ type: "streamable-http", url: "https://mcp.alphacreek.ai/mcp" }],
      websiteUrl: "https://www.alphacreek.ai"
    },
    _meta: { "io.modelcontextprotocol.registry/official": { status: "active" } }
  }
];

export const McpRegistryExplorer: React.FC<McpRegistryExplorerProps> = ({ onImportConfig }) => {
  const [servers, setServers] = useState<RegistryItem[]>(FALLBACK_REGISTRY_SERVERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [transportFilter, setTransportFilter] = useState<"all" | "stdio" | "remote">("all");
  const [selectedServer, setSelectedServer] = useState<RegistryItem | null>(null);
  const [importedStatus, setImportedStatus] = useState<boolean>(false);

  useEffect(() => {
    fetchRegistryServers();
  }, []);

  const fetchRegistryServers = async (query = "") => {
    setIsLoading(true);
    setError(null);

    const endpoints = [
      query ? `/api/registry?search=${encodeURIComponent(query)}` : "/api/registry",
      query ? `/_/backend/api/registry?search=${encodeURIComponent(query)}` : "/_/backend/api/registry",
      `https://registry.modelcontextprotocol.io/v0.1/servers?version=latest&limit=100${query ? `&search=${encodeURIComponent(query)}` : ""}`
    ];

    let successData: RegistryItem[] | null = null;
    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const list = data.servers || (Array.isArray(data) ? data : null);
          if (list && Array.isArray(list) && list.length > 0) {
            successData = list;
            break;
          }
        }
      } catch (err) {
        // try next endpoint
      }
    }

    if (successData) {
      setServers(successData);
    } else {
      setServers(FALLBACK_REGISTRY_SERVERS);
    }
    setIsLoading(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchRegistryServers(val);
  };

  const parseServerConfig = (item: RegistryItem): ServerConfig => {
    const s = item.server;
    const isRemote = s.remotes && s.remotes.length > 0;

    if (isRemote) {
      const remote = s.remotes![0];
      const authHeader = remote.headers && remote.headers.length > 0 ? remote.headers[0].name : undefined;
      return {
        id: `registry-${s.name.replace(/[/.]/g, "-")}-${Date.now()}`,
        name: s.title || s.name,
        transport: "sse",
        url: remote.url || "",
        authType: authHeader ? "Bearer Token / Header" : "None / Unauthenticated",
        authHeader: authHeader ? `Bearer <enter_key_here>` : undefined,
        readOnlyDefault: true,
      };
    } else {
      let cmd = "npx -y";
      if (s.packages && s.packages.length > 0) {
        const pkg = s.packages[0];
        if (pkg.registryType === "npm") {
          cmd = `npx -y ${pkg.identifier}`;
        } else if (pkg.registryType === "pypi") {
          cmd = `uvx ${pkg.identifier}`;
        } else if (pkg.registryType === "oci") {
          cmd = `docker run -i --rm ${pkg.identifier}`;
        }
      } else {
        cmd = `npx -y ${s.name}`;
      }

      return {
        id: `registry-${s.name.replace(/[/.]/g, "-")}-${Date.now()}`,
        name: s.title || s.name,
        transport: "stdio",
        command: cmd,
        args: [],
        authType: "Local CLI / Environment",
        readOnlyDefault: true,
      };
    }
  };

  const handleImport = (item: RegistryItem) => {
    const config = parseServerConfig(item);
    onImportConfig(config);
    setImportedStatus(true);
    setTimeout(() => setImportedStatus(false), 2500);
  };

  // Filtering
  const filteredServers = servers.filter((item) => {
    const s = item.server;
    const isRemote = s.remotes && s.remotes.length > 0;
    if (transportFilter === "stdio" && isRemote) return false;
    if (transportFilter === "remote" && !isRemote) return false;
    return true;
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.1))",
        border: "1px solid rgba(6, 182, 212, 0.3)",
        borderRadius: "var(--radius-lg)",
        padding: "1.75rem 2rem",
        marginBottom: "2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.5rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{
              background: "var(--accent-cyan)",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              color: "#030712",
              fontWeight: 700,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Live Registry Catalog
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Source: registry.modelcontextprotocol.io
            </span>
          </div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Official MCP Server Registry Explorer
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", maxWidth: "800px", fontSize: "0.95rem", lineHeight: 1.5 }}>
            Browse verified Model Context Protocol servers published in the official registry. Select any server to view its full configuration details, transport specs, and import directly into your Explorer connection pool.
          </p>
        </div>

        <a
          href="https://registry.modelcontextprotocol.io/"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          Registry Portal <ExternalLink size={16} />
        </a>
      </div>

      {/* Search & Filter Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid var(--border-color)",
        paddingBottom: "1rem",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "320px", flex: 1, maxWidth: "500px" }}>
          <Search size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search registry servers by name or keyword..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: "100%",
              padding: "0.55rem 0.85rem 0.55rem 2.4rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              fontSize: "0.875rem",
              outline: "none"
            }}
          />
        </div>

        {/* Transport Type Filter Pills */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Filter size={14} color="var(--text-muted)" />
          <button
            className={`btn ${transportFilter === "all" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTransportFilter("all")}
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
          >
            All Servers ({servers.length})
          </button>
          <button
            className={`btn ${transportFilter === "stdio" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTransportFilter("stdio")}
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
          >
            Local stdio
          </button>
          <button
            className={`btn ${transportFilter === "remote" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTransportFilter("remote")}
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
          >
            Remote Streamable/SSE
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Fetching Official MCP Registry Catalog...
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Connecting to https://registry.modelcontextprotocol.io/v0.1/servers</p>
        </div>
      )}

      {error && (
        <div className="ocean-card" style={{ border: "1px solid var(--accent-rose)", padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ color: "var(--accent-rose)", fontWeight: 700, marginBottom: "0.5rem" }}>
            Registry Connection Warning
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{error}</div>
        </div>
      )}

      {/* Registry Server Cards Grid */}
      {!isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {filteredServers.map((item) => {
            const s = item.server;
            const meta = item._meta?.["io.modelcontextprotocol.registry/official"];
            const isRemote = s.remotes && s.remotes.length > 0;
            const isSelected = selectedServer?.server.name === s.name;

            return (
              <div
                key={`${s.name}-${s.version}`}
                className="ocean-card"
                onClick={() => setSelectedServer(item)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderColor: isSelected ? "var(--accent-cyan)" : "var(--border-color)",
                  boxShadow: isSelected ? "var(--shadow-glow)" : undefined,
                  background: isSelected ? "rgba(0, 242, 254, 0.08)" : undefined,
                  maxWidth: "100%",
                  overflow: "hidden"
                }}
              >
                <div>
                  {/* Card Top Badges */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span className={`badge ${isRemote ? "badge-remote" : "badge-local"}`}>
                      {isRemote ? "Remote Streamable" : "Local stdio"}
                    </span>
                    <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", background: "var(--bg-input)", padding: "0.15rem 0.5rem", borderRadius: "var(--radius-sm)" }}>
                      v{s.version}
                    </span>
                  </div>

                  {/* Title & Name */}
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem", wordBreak: "break-word", overflowWrap: "anywhere", hyphens: "auto" }}>
                    {s.title || s.name}
                  </h3>
                  <div style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", marginBottom: "0.75rem", wordBreak: "break-all", overflowWrap: "anywhere" }}>
                    {s.name}
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: "1rem", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                    {s.description || "No description provided by publisher."}
                  </p>
                </div>

                {/* Card Bottom Meta */}
                <div style={{ paddingTop: "0.75rem", borderTop: "1px dashed var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Status: <strong style={{ color: "var(--accent-emerald)" }}>{meta?.status || "Active"}</strong>
                  </span>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedServer(item);
                    }}
                  >
                    View Details & Config <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Server Full Details Modal */}
      {selectedServer && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.82)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "1.5rem"
        }}>
          <div className="ocean-card" style={{
            width: "800px",
            maxWidth: "95vw",
            maxHeight: "90vh",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <span className={`badge ${selectedServer.server.remotes && selectedServer.server.remotes.length > 0 ? "badge-remote" : "badge-local"}`}>
                    {selectedServer.server.remotes && selectedServer.server.remotes.length > 0 ? "Remote Streamable HTTP/SSE" : "Local stdio Child Process"}
                  </span>
                  <span className="badge badge-status-connected">
                    v{selectedServer.server.version}
                  </span>
                </div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {selectedServer.server.title || selectedServer.server.name}
                </h2>
                <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", marginTop: "0.2rem" }}>
                  {selectedServer.server.name}
                </div>
              </div>

              <button
                className="btn btn-secondary"
                style={{ padding: "0.3rem 0.5rem" }}
                onClick={() => setSelectedServer(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Description & Overview */}
            <div>
              <h4 style={{ fontSize: "0.95rem", color: "var(--accent-teal)", marginBottom: "0.4rem" }}>
                Description & Targeted Usage
              </h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                {selectedServer.server.description || "No overview provided for this MCP server."}
              </p>
            </div>

            {/* Connection Specs & Configuration Block */}
            <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "1.25rem" }}>
              <h4 style={{ fontSize: "0.95rem", color: "var(--accent-cyan)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {selectedServer.server.remotes && selectedServer.server.remotes.length > 0 ? <Globe size={18} /> : <Terminal size={18} />}
                Connection & Configuration Specifications
              </h4>

              {selectedServer.server.remotes && selectedServer.server.remotes.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                  <div>
                    <strong>Remote Transport Endpoint:</strong>
                    <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", background: "var(--bg-primary)", padding: "0.4rem 0.6rem", borderRadius: "var(--radius-sm)", marginTop: "0.25rem", wordBreak: "break-all" }}>
                      {selectedServer.server.remotes[0].url}
                    </div>
                  </div>

                  {selectedServer.server.remotes[0].headers && selectedServer.server.remotes[0].headers.length > 0 && (
                    <div>
                      <strong>Authentication / Header Requirements:</strong>
                      <ul style={{ color: "var(--text-secondary)", marginTop: "0.25rem", paddingLeft: "1.25rem" }}>
                        {selectedServer.server.remotes[0].headers.map((h: any, i: number) => (
                          <li key={i}>
                            <code>{h.name}</code>: {h.description || "Required header token."}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                  <div>
                    <strong>Local CLI Execution Command:</strong>
                    <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-teal)", background: "var(--bg-primary)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", marginTop: "0.25rem" }}>
                      {parseServerConfig(selectedServer).command}
                    </div>
                  </div>

                  {selectedServer.server.packages && selectedServer.server.packages.length > 0 && (
                    <div>
                      <strong>Registered Package Info:</strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        Type: <code style={{ color: "var(--accent-cyan)" }}>{selectedServer.server.packages[0].registryType}</code> | Package ID: <code style={{ color: "var(--accent-teal)" }}>{selectedServer.server.packages[0].identifier}</code>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Links & Raw Schema Details */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {selectedServer.server.repository?.url && (
                  <a
                    href={selectedServer.server.repository.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ textDecoration: "none", fontSize: "0.8rem" }}
                  >
                    <Github size={14} /> Repository
                  </a>
                )}
                {selectedServer.server.websiteUrl && (
                  <a
                    href={selectedServer.server.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ textDecoration: "none", fontSize: "0.8rem" }}
                  >
                    <Globe size={14} /> Website
                  </a>
                )}
              </div>

              {/* Import Action */}
              <button
                className="btn btn-primary"
                onClick={() => handleImport(selectedServer)}
              >
                {importedStatus ? <CheckCircle2 size={16} color="var(--accent-emerald)" /> : <PlusCircle size={16} />}
                {importedStatus ? "Imported to Connections!" : "Import Config to Connection Pool"}
              </button>
            </div>

            {/* Raw JSON Definition */}
            <details style={{ marginTop: "0.5rem" }}>
              <summary style={{ cursor: "pointer", color: "var(--accent-cyan)", fontSize: "0.85rem", fontWeight: 600 }}>
                View Full Registry Server Manifest (JSON)
              </summary>
              <pre className="code-block" style={{ marginTop: "0.5rem", maxHeight: "220px" }}>
                {JSON.stringify(selectedServer, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};
