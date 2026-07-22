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
      padding: "0.5rem 1.25rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem",
      flexWrap: "wrap",
      position: "sticky",
      top: 0,
      zIndex: 100
    }}>
      {/* Brand Logo & Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
        <div style={{
          background: "linear-gradient(135deg, var(--accent-teal), var(--accent-cyan))",
          padding: "0.4rem",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#04101e"
        }}>
          <Compass size={18} />
        </div>
        <div>
          <h1 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1 }}>
            MCP Inspector
          </h1>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            DevTools v1.0
          </span>
        </div>
      </div>

      {/* Compact Navigation Tabs Pill Container */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        background: "var(--bg-input)",
        padding: "0.25rem",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-color)",
        flexWrap: "wrap"
      }}>
        <button
          className={`btn ${activeTab === "connection" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("connection")}
          style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}
        >
          <Server size={14} /> Connections
        </button>

        <button
          className={`btn ${activeTab === "registry" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("registry")}
          style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}
        >
          <Store size={14} /> Registry
        </button>

        <button
          className={`btn ${activeTab === "discovery" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("discovery")}
          style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}
        >
          <Compass size={14} /> Discovery
        </button>

        <button
          className={`btn ${activeTab === "playground" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("playground")}
          style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}
        >
          <Play size={14} /> Playground
        </button>

        <button
          className={`btn ${activeTab === "dashboard" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("dashboard")}
          style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}
        >
          <BarChart2 size={14} /> Metrics
        </button>

        <button
          className={`btn ${activeTab === "info" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("info")}
          style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}
        >
          <BookOpen size={14} /> Protocol Docs
        </button>
      </nav>

      {/* Right Action Controls (Non-overlapping) */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0, flexWrap: "nowrap" }}>
        {/* Theme Toggle Button */}
        <button
          className="btn btn-secondary"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.35rem", whiteSpace: "nowrap" }}
          title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Ocean Theme"}
        >
          {theme === "dark" ? (
            <>
              <Sun size={14} color="var(--accent-amber)" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={14} color="var(--accent-cyan)" />
              <span>Dark</span>
            </>
          )}
        </button>

        {/* Read-Only Safety Toggle Switch */}
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          fontSize: "0.75rem",
          background: "var(--bg-input)",
          padding: "0.3rem 0.55rem",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-color)",
          cursor: "pointer",
          whiteSpace: "nowrap",
          userSelect: "none"
        }}>
          <ShieldCheck size={14} color={isReadOnlyGlobal ? "var(--accent-emerald)" : "var(--text-muted)"} />
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
            gap: "0.4rem",
            background: "var(--bg-input)",
            padding: "0.3rem 0.6rem",
            borderRadius: "9999px",
            border: "1px solid var(--border-color)",
            fontSize: "0.75rem",
            whiteSpace: "nowrap"
          }}>
            <span className={`status-dot ${activeServerResult.status === "connected" ? "green" : activeServerResult.status === "auth_required" ? "amber" : "red"}`}></span>
            <span style={{ fontWeight: 600 }}>{activeServerResult.name}</span>
          </div>
        )}

        {/* Export Button */}
        <button className="btn btn-primary" onClick={onOpenExport} style={{ padding: "0.3rem 0.65rem", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
          <Download size={14} /> Export
        </button>
      </div>
    </header>
  );
};
