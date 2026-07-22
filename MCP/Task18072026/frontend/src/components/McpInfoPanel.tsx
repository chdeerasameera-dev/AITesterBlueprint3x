import React, { useState } from "react";
import {
  BookOpen,
  FileCode,
  Layers,
  Store,
  GitPullRequest,
  Search,
  Check,
  Copy,
  ExternalLink,
  Cpu,
  Shield,
  Zap,
  Terminal,
  Server,
  ArrowRight,
  HelpCircle
} from "lucide-react";

type InfoSubTab = "docs" | "specs" | "extensions" | "registry" | "seps";

export const McpInfoPanel: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<InfoSubTab>("docs");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.15))",
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
              background: "var(--accent-teal)",
              padding: "0.4rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              color: "#04101e",
              fontWeight: 700,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Protocol Knowledge Base
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>v2025.11 / Humanized Guide</span>
          </div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Model Context Protocol (MCP) Architecture Hub
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", maxWidth: "800px", fontSize: "0.95rem", lineHeight: 1.5 }}>
            Model Context Protocol bridges AI applications and external tools, data sources, and services using an open, standardized client-server JSON-RPC interface. Explore the full reference guide below.
          </p>
        </div>

        <a
          href="https://modelcontextprotocol.io/docs/getting-started/intro"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
          style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          Official Docs <ExternalLink size={16} />
        </a>
      </div>

      {/* Navigation Sub-Tabs & Search */}
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
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            className={`btn ${activeSubTab === "docs" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveSubTab("docs")}
          >
            <BookOpen size={16} /> Documentation
          </button>
          <button
            className={`btn ${activeSubTab === "specs" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveSubTab("specs")}
          >
            <FileCode size={16} /> Specifications
          </button>
          <button
            className={`btn ${activeSubTab === "extensions" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveSubTab("extensions")}
          >
            <Layers size={16} /> Extensions
          </button>
          <button
            className={`btn ${activeSubTab === "registry" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveSubTab("registry")}
          >
            <Store size={16} /> Registry
          </button>
          <button
            className={`btn ${activeSubTab === "seps" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveSubTab("seps")}
          >
            <GitPullRequest size={16} /> SEPs
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search protocol topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem 0.5rem 2.25rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              outline: "none"
            }}
          />
        </div>
      </div>

      {/* Sub-Tab 1: DOCUMENTATION */}
      {activeSubTab === "docs" && (
        <div style={{ display: "grid", gap: "2rem" }}>
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "1.75rem"
          }}>
            <h3 style={{ fontSize: "1.3rem", color: "var(--accent-teal)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Cpu size={20} /> What is the Model Context Protocol?
            </h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Think of the Model Context Protocol (MCP) as the <strong>USB-C standard for Artificial Intelligence</strong>. Before USB-C, every device required custom cables, dongles, and proprietary connectors. Similarly, before MCP, connecting Large Language Models (LLMs) to databases, APIs, code repositories, and local development environments required building custom, brittle integrations for every single platform.
            </p>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginTop: "1rem" }}>
              MCP introduces a unified standard that enables AI hosts (like Claude Desktop, Cursor, AI agents, or testing frameworks) to communicate with external data sources and execution engines (MCP Servers) seamlessly without reinventing the wheel each time.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginTop: "1.5rem" }}>
              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "var(--accent-teal)", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Zap size={18} /> Client & Host Layer
                </h4>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: 0 }}>
                  AI clients or host applications initiate sessions, discover server capabilities, request tool executions, and stream prompt context back to the language model.
                </p>
              </div>

              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "var(--accent-cyan)", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Server size={18} /> MCP Server Layer
                </h4>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: 0 }}>
                  Lightweight microservices that expose capabilities like database access, file systems, web searches, git actions, or test automation toolkits.
                </p>
              </div>

              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "var(--accent-emerald)", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Shield size={18} /> Security & Control Boundary
                </h4>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: 0 }}>
                  Executes tools within strict read-only or explicit approval boundaries, keeping sensitive user credentials and systems safe from untrusted actions.
                </p>
              </div>
            </div>
          </div>

          {/* Core Primitives Grid */}
          <h3 style={{ fontSize: "1.3rem", color: "var(--text-primary)", margin: "1rem 0 0.5rem 0" }}>
            The 4 Core Primitives of MCP
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            <div className="card" style={{ background: "var(--bg-secondary)", padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "var(--accent-teal)" }}>
                <Terminal size={20} />
                <h4 style={{ margin: 0, fontSize: "1.1rem" }}>1. Tools (Action Execution)</h4>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Executable functions offered by MCP servers that allow LLMs to perform computation or make state changes in external systems (e.g., executing SQL queries, querying APIs, running test suites).
              </p>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "var(--bg-card)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", marginTop: "1rem" }}>
                <strong>Key method:</strong> <code>tools/list</code>, <code>tools/call</code>
              </div>
            </div>

            <div className="card" style={{ background: "var(--bg-secondary)", padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "var(--accent-cyan)" }}>
                <BookOpen size={20} />
                <h4 style={{ margin: 0, fontSize: "1.1rem" }}>2. Resources (Data Context)</h4>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Passive, readable content sources exposed via URIs (e.g., file contents, API schemas, log files, system metrics). Resources can be read on demand or subscribed for real-time updates.
              </p>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "var(--bg-card)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", marginTop: "1rem" }}>
                <strong>Key method:</strong> <code>resources/list</code>, <code>resources/read</code>
              </div>
            </div>

            <div className="card" style={{ background: "var(--bg-secondary)", padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "var(--accent-purple)" }}>
                <HelpCircle size={20} />
                <h4 style={{ margin: 0, fontSize: "1.1rem" }}>3. Prompts (Reusable Templates)</h4>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Pre-packaged prompt templates and conversation starters configured server-side. Enables users to trigger complex workflows with structured arguments directly from the client interface.
              </p>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "var(--bg-card)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", marginTop: "1rem" }}>
                <strong>Key method:</strong> <code>prompts/list</code>, <code>prompts/get</code>
              </div>
            </div>

            <div className="card" style={{ background: "var(--bg-secondary)", padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "var(--accent-emerald)" }}>
                <Zap size={20} />
                <h4 style={{ margin: 0, fontSize: "1.1rem" }}>4. Sampling (Client Inference)</h4>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Allows an MCP server to request LLM completions back from the host client. Useful when an agentic server requires multi-turn reasoning without managing LLM API keys directly.
              </p>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "var(--bg-card)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", marginTop: "1rem" }}>
                <strong>Key method:</strong> <code>sampling/createMessage</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: SPECIFICATIONS */}
      {activeSubTab === "specs" && (
        <div style={{ display: "grid", gap: "2rem" }}>
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "1.75rem"
          }}>
            <h3 style={{ fontSize: "1.3rem", color: "var(--accent-cyan)", marginBottom: "1rem" }}>
              Protocol Message Specification (JSON-RPC 2.0)
            </h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              All communications between MCP Clients and Servers adhere to the <strong>JSON-RPC 2.0</strong> standard. Communications occur bidirectional over standard transport layers like <code>Stdio</code> (for local sub-processes) or <code>Server-Sent Events (SSE)</code> over HTTP (for remote services).
            </p>

            {/* Code Snippet Example */}
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#081324",
                padding: "0.5rem 1rem",
                borderTopLeftRadius: "var(--radius-sm)",
                borderTopRightRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                borderBottom: "none"
              }}>
                <span style={{ fontSize: "0.8rem", fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>
                  Initialization Request Example (Client &rarr; Server)
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                  onClick={() => handleCopy(`{\n  "jsonrpc": "2.0",\n  "id": 1,\n  "method": "initialize",\n  "params": {\n    "protocolVersion": "2024-11-05",\n    "capabilities": {\n      "roots": { "listChanged": true },\n      "sampling": {}\n    },\n    "clientInfo": {\n      "name": "MCP-Inspector-Explorer",\n      "version": "1.0.0"\n    }\n  }\n}`, "init_req")}
                >
                  {copiedIndex === "init_req" ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  {copiedIndex === "init_req" ? "Copied" : "Copy"}
                </button>
              </div>
              <pre style={{
                margin: 0,
                padding: "1rem",
                background: "#040b16",
                borderBottomLeftRadius: "var(--radius-sm)",
                borderBottomRightRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                fontSize: "0.85rem",
                fontFamily: "var(--font-mono)",
                color: "#e2e8f0",
                overflowX: "auto"
              }}>
{`{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {}
    },
    "clientInfo": {
      "name": "MCP-Inspector-Explorer",
      "version": "1.0.0"
    }
  }
}`}
              </pre>
            </div>
          </div>

          {/* Connection Lifecycle */}
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "1.75rem"
          }}>
            <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
              Session Lifecycle & Capability Handshake
            </h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <span style={{ background: "var(--accent-teal)", color: "#04101e", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 700, fontSize: "0.85rem" }}>1</span>
                <div>
                  <strong style={{ color: "var(--text-primary)" }}>Initialization Request:</strong> Client sends supported protocol version and client capabilities.
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <span style={{ background: "var(--accent-cyan)", color: "#04101e", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 700, fontSize: "0.85rem" }}>2</span>
                <div>
                  <strong style={{ color: "var(--text-primary)" }}>Server Response:</strong> Server returns its negotiated version, server details, and feature capabilities (tools, prompts, resources).
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <span style={{ background: "var(--accent-emerald)", color: "#04101e", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 700, fontSize: "0.85rem" }}>3</span>
                <div>
                  <strong style={{ color: "var(--text-primary)" }}>Initialized Notification:</strong> Client confirms receipt via <code>notifications/initialized</code> message. The session is now ready for active tool calling.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: EXTENSIONS */}
      {activeSubTab === "extensions" && (
        <div style={{ display: "grid", gap: "2rem" }}>
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "1.75rem"
          }}>
            <h3 style={{ fontSize: "1.3rem", color: "var(--accent-purple)", marginBottom: "1rem" }}>
              MCP Extension Mechanism
            </h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              The Model Context Protocol is engineered to be modular and extensible. Extensions allow client and server developers to introduce vendor-specific features, experimental RPC methods, or domain-tailored security policies without breaking standard protocol implementations.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem", marginTop: "1.5rem" }}>
              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "var(--accent-purple)", margin: "0 0 0.5rem 0" }}>Custom RPC Namespaces</h4>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: 0 }}>
                  Extensions introduce prefixed methods (e.g., <code>_custom/telemetry</code> or <code>_vendor/securityCheck</code>) to avoid naming collisions with future official protocol specifications.
                </p>
              </div>

              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                <h4 style={{ color: "var(--accent-teal)", margin: "0 0 0.5rem 0" }}>Graceful Fallback</h4>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: 0 }}>
                  If a client or server does not support an extension during capability negotiation, standard features remain 100% operational without error.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: REGISTRY */}
      {activeSubTab === "registry" && (
        <div style={{ display: "grid", gap: "2rem" }}>
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "1.75rem"
          }}>
            <h3 style={{ fontSize: "1.3rem", color: "var(--accent-emerald)", marginBottom: "1rem" }}>
              MCP Server Registry & Discovery
            </h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              The MCP Registry ecosystem allows developers, enterprise teams, and AI tool builders to publish and discover standardized server packages. Registries define structured metadata schemas so clients can automatically load and execute verified integrations.
            </p>

            <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", marginTop: "1rem" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--accent-emerald)" }}>Featured Ecosystem Categories</h4>
              <ul style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.8, paddingLeft: "1.25rem" }}>
                <li><strong>Developer & Testing Tools:</strong> GitHub, Git, SQLite, PostgreSQL, Selenium, Puppeteer</li>
                <li><strong>Cloud Infrastructure:</strong> AWS, Google Cloud, Cloudflare, Kubernetes</li>
                <li><strong>Productivity & Collaboration:</strong> Slack, Notion, Google Drive, Jira</li>
                <li><strong>AI Knowledge Base:</strong> Brave Search, Memory Servers, Vector Database Connectors</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 5: SEPs */}
      {activeSubTab === "seps" && (
        <div style={{ display: "grid", gap: "2rem" }}>
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "1.75rem"
          }}>
            <h3 style={{ fontSize: "1.3rem", color: "var(--accent-teal)", marginBottom: "1rem" }}>
              Specification Enhancement Proposals (SEPs)
            </h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              SEPs represent the collaborative open-source process for proposing architectural enhancements, new core primitives, transport channels, and schema revisions to the Model Context Protocol standard.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginTop: "1.5rem" }}>
              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                <span className="badge badge-local" style={{ marginBottom: "0.5rem", display: "inline-block" }}>Draft Stage</span>
                <h4 style={{ color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>SEP-01: Multi-Agent Routing & Federation</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                  Defines standard headers and message payloads for passing sub-agent context and tool request delegation across multiple linked MCP servers.
                </p>
              </div>

              <div style={{ background: "var(--bg-card)", padding: "1.25rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                <span className="badge badge-local" style={{ marginBottom: "0.5rem", display: "inline-block" }}>Under Review</span>
                <h4 style={{ color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>SEP-02: OAuth2 Remote Transport Authentication</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                  Standardizes token exchange and authorization handshakes for HTTPS / SSE remote MCP endpoints requiring enterprise access control.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
