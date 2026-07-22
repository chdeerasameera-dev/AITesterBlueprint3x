import React, { useState, useEffect } from "react";
import { ServerDiscoveryResult } from "../types/mcp";
import { Download, Copy, Check, X, FileText, Code, ShieldCheck } from "lucide-react";

interface ExportModalProps {
  discoveryResults: Map<string, ServerDiscoveryResult>;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ discoveryResults, onClose }) => {
  const [activeTab, setActiveTab] = useState<"markdown" | "json">("markdown");
  const [markdownContent, setMarkdownContent] = useState("");
  const [jsonContent, setJsonContent] = useState("");
  const [copiedMd, setCopiedMd] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const list = Array.from(discoveryResults.values());
    fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results: list, combined: true }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMarkdownContent(data.markdown || "");
        setJsonContent(JSON.stringify(data.json || {}, null, 2));
      })
      .catch((err) => console.error("Export fetch error:", err))
      .finally(() => setIsLoading(false));
  }, [discoveryResults]);

  const handleDownloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMd = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(3, 7, 18, 0.85)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
      padding: "1.5rem"
    }}>
      <div className="ocean-card" style={{ width: "850px", maxWidth: "95vw", height: "80vh", display: "flex", flexDirection: "column" }}>
        
        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Download size={20} color="var(--accent-teal)" /> Export MCP Capability Report
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              One-click Markdown report and raw JSON manifest with automatic credential redaction.
            </p>
          </div>

          <button className="btn btn-secondary" style={{ padding: "0.36rem" }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Action Controls & Format Selector */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className={`btn ${activeTab === "markdown" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("markdown")}
            >
              <FileText size={16} /> Markdown Report
            </button>
            <button
              className={`btn ${activeTab === "json" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("json")}
            >
              <Code size={16} /> JSON Manifest
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "var(--accent-emerald)" }}>
              <ShieldCheck size={14} /> Credentials Sanitized
            </div>

            {activeTab === "markdown" ? (
              <>
                <button className="btn btn-secondary" onClick={handleCopyMd}>
                  {copiedMd ? <Check size={14} /> : <Copy size={14} />}
                  {copiedMd ? "Copied!" : "Copy Markdown"}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownloadFile(markdownContent, `mcp-capability-report-${Date.now()}.md`, "text/markdown")}
                >
                  <Download size={14} /> Download .md
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => handleDownloadFile(jsonContent, `mcp-capability-manifest-${Date.now()}.json`, "application/json")}
              >
                <Download size={14} /> Download .json
              </button>
            )}
          </div>
        </div>

        {/* Preview Container */}
        <div style={{ flex: 1, overflow: "hidden", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", background: "#050a14" }}>
          {isLoading ? (
            <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              Generating report preview...
            </div>
          ) : activeTab === "markdown" ? (
            <pre className="code-block" style={{ height: "100%", margin: 0, borderRadius: 0, border: "none" }}>
              {markdownContent}
            </pre>
          ) : (
            <pre className="code-block" style={{ height: "100%", margin: 0, borderRadius: 0, border: "none" }}>
              {jsonContent}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
