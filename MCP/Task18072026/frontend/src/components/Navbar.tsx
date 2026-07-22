import React from "react";
import { Compass, Server, Play, BarChart2, Download, ShieldCheck, BookOpen, Sun, Moon, Store } from "lucide-react";
import { ServerDiscoveryResult } from "../types/mcp";

export type NavTab = "connection" | "discovery" | "playground" | "dashboard" | "info" | "registry";

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  activeServerResult: ServerDiscoveryResult | null;
  onOpenExport: () => void;
  isReadOnlyGlobal: boolean;
  setIsReadOnlyGlobal: (val: boolean) => void;
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeServerResult,
  onOpenExport,
  isReadOnlyGlobal,
  setIsReadOnlyGlobal,
  theme,
  setTheme,
}) => {
  return (
    <header style={{
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border-color)",
      padding: "0.75rem 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 50
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          background: "linear-gradient(135deg, var(--accent-teal), var(--accent-cyan))",
          padding: "0.5rem",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#04101e"
        }}>
          <Compass size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            MCP Inspector Explorer
          </h1>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            QA & AI Automation DevTools v1.0
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: "flex", gap: "0.5rem" }}>
        <button
          className={`btn ${activeTab === "connection" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("connection")}
        >
          <Server size={16} /> Connections
        </button>

        <button
          className={`btn ${activeTab === "registry" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("registry")}
        >
          <Store size={16} /> MCP Registry
        </button>

        <button
          className={`btn ${activeTab === "discovery" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("discovery")}
        >
          <Compass size={16} /> Discovery
        </button>

        <button
          className={`btn ${activeTab === "playground" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("playground")}
        >
          <Play size={16} /> Playground
        </button>

        <button
          className={`btn ${activeTab === "dashboard" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <BarChart2 size={16} /> Comparison
        </button>

        <button
          className={`btn ${activeTab === "info" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("info")}
        >
          <BookOpen size={16} /> Protocol Docs & Info
        </button>
      </nav>

      {/* Right Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Theme Toggle Button (Light White / Dark Ocean) */}
        <button
          className="btn btn-secondary"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
          title={theme === "dark" ? "Switch to White Background (Light Ocean)" : "Switch to Dark Ocean Theme"}
        >
          {theme === "dark" ? (
            <>
              <Sun size={15} color="var(--accent-amber)" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={15} color="var(--accent-cyan)" />
              <span>Dark Ocean</span>
            </>
          )}
        </button>

        {/* Read-Only Safety Toggle */}
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.8rem",
          background: "rgba(15, 28, 52, 0.9)",
          padding: "0.35rem 0.65rem",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-color)",
          cursor: "pointer"
        }}>
          <ShieldCheck size={16} color={isReadOnlyGlobal ? "var(--accent-emerald)" : "var(--text-muted)"} />
          <span style={{ color: isReadOnlyGlobal ? "var(--accent-emerald)" : "var(--text-muted)", fontWeight: 600 }}>
            Read-Only: {isReadOnlyGlobal ? "ON" : "OFF"}
          </span>
          <input
            type="checkbox"
            checked={isReadOnlyGlobal}
            onChange={(e) => setIsReadOnlyGlobal(e.target.checked)}
            style={{ display: "none" }}
          />
        </label>

        {/* Active Server Status Pill */}
        {activeServerResult && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(15, 27, 49, 0.9)",
            padding: "0.35rem 0.75rem",
            borderRadius: "9999px",
            border: "1px solid var(--border-color)",
            fontSize: "0.8rem"
          }}>
            <span className={`status-dot ${activeServerResult.status === "connected" ? "green" : activeServerResult.status === "auth_required" ? "amber" : "red"}`}></span>
            <span style={{ fontWeight: 600 }}>{activeServerResult.name}</span>
            <span className={`badge ${activeServerResult.isLocal ? "badge-local" : "badge-remote"}`}>
              {activeServerResult.isLocal ? "Local" : "Remote"}
            </span>
          </div>
        )}

        {/* Export Button */}
        <button className="btn btn-primary" onClick={onOpenExport}>
          <Download size={16} /> Export
        </button>
      </div>
    </header>
  );
};
