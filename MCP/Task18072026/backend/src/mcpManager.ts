import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import child_process from "child_process";
import path from "path";
import fs from "fs";

export interface ServerConfig {
  id: string;
  name: string;
  transport: "stdio" | "sse" | "http";
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  authType?: string;
  authHeader?: string;
  readOnlyDefault?: boolean;
}

export interface ToolItem {
  name: string;
  description?: string;
  inputSchema?: any;
  category?: string;
}

export interface ResourceItem {
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
}

export interface PromptItem {
  name: string;
  description?: string;
  arguments?: { name: string; description?: string; required?: boolean }[];
}

export interface ServerDiscoveryResult {
  serverId: string;
  name: string;
  transport: "stdio" | "sse" | "http";
  isLocal: boolean;
  status: "connected" | "error" | "auth_required";
  errorDetails?: string;
  authType?: string;
  lastSynced: string;
  tools: ToolItem[];
  resources: ResourceItem[];
  prompts: PromptItem[];
}

class MCPManager {
  private activeClients: Map<string, { client: Client; transport: any }> = new Map();

  /**
   * Helper to categorize tools by name prefixes or server hints (e.g. GitHub repos, issues, pull_requests)
   */
  private tagToolCategory(toolName: string): string {
    const name = toolName.toLowerCase();
    if (name.includes("repo") || name.includes("repository") || name.includes("code") || name.includes("file")) return "Repositories & Files";
    if (name.includes("issue") || name.includes("ticket") || name.includes("jira")) return "Issues & Tickets";
    if (name.includes("pull_request") || name.includes("pr") || name.includes("merge")) return "Pull Requests";
    if (name.includes("browser") || name.includes("page") || name.includes("click") || name.includes("navigate") || name.includes("fill") || name.includes("screenshot")) return "Browser Automation";
    if (name.includes("search") || name.includes("query") || name.includes("list") || name.includes("get")) return "Search & Retrieval";
    if (name.includes("user") || name.includes("member") || name.includes("org")) return "Users & Teams";
    return "General / Utility";
  }

  /**
   * Connect and discover server tools, resources, and prompts
   */
  async discoverServer(config: ServerConfig): Promise<ServerDiscoveryResult> {
    const isLocal = config.transport === "stdio";
    const timestamp = new Date().toISOString();

    try {
      let client: Client;
      let transport: any;

      if (config.transport === "stdio") {
        if (!config.command) {
          throw new Error("Command is required for stdio transport.");
        }
        
        // Parse command line if command contains args (e.g. "npx -y @playwright/mcp@latest")
        let execCmd = config.command;
        let execArgs = config.args || [];

        if (!config.args || config.args.length === 0) {
          const matches = config.command.match(/(?:[^\s"]+|"[^"]*")+/g);
          if (matches && matches.length > 0) {
            execCmd = matches[0].replace(/^"|"$/g, "");
            execArgs = matches.slice(1).map((a) => a.replace(/^"|"$/g, ""));
          }
        }

        // On Windows OS, npx/npm require .cmd extension when spawned via child_process
        if (process.platform === "win32") {
          if (execCmd.toLowerCase() === "npx") {
            execCmd = "npx.cmd";
          } else if (execCmd.toLowerCase() === "npm") {
            execCmd = "npm.cmd";
          }
        }

        const env = { ...process.env, ...(config.env || {}) };
        if (config.authHeader) {
          env["GITHUB_PERSONAL_ACCESS_TOKEN"] = config.authHeader.replace("Bearer ", "");
          env["ATLASSIAN_API_TOKEN"] = config.authHeader.replace("Bearer ", "");
        }

        transport = new StdioClientTransport({
          command: execCmd,
          args: execArgs,
          env: env as any,
        });

        client = new Client(
          { name: "mcp-inspector-explorer-client", version: "1.0.0" },
          { capabilities: {} }
        );

        await client.connect(transport);
      } else {
        // SSE / HTTP Transport
        if (!config.url) {
          throw new Error("URL is required for SSE/HTTP transport.");
        }

        const headers: Record<string, string> = { ...(config.headers || {}) };
        if (config.authHeader) {
          headers["Authorization"] = config.authHeader.startsWith("Bearer ")
            ? config.authHeader
            : `Bearer ${config.authHeader}`;
        }

        const sseUrl = new URL(config.url);
        transport = new SSEClientTransport(sseUrl, {
          requestInit: { headers },
        });

        client = new Client(
          { name: "mcp-inspector-explorer-client", version: "1.0.0" },
          { capabilities: {} }
        );

        await client.connect(transport);
      }

      // Store connected client reference
      this.activeClients.set(config.id, { client, transport });

      // Fetch capabilities
      let toolsList: ToolItem[] = [];
      let resourcesList: ResourceItem[] = [];
      let promptsList: PromptItem[] = [];

      try {
        const toolsResult = await client.listTools();
        toolsList = (toolsResult.tools || []).map((t: any) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema || {},
          category: this.tagToolCategory(t.name),
        }));
      } catch (err: any) {
        console.warn(`Tools list error for ${config.name}:`, err.message);
      }

      try {
        const resResult = await client.listResources();
        resourcesList = (resResult.resources || []).map((r: any) => ({
          uri: r.uri,
          name: r.name,
          mimeType: r.mimeType,
          description: r.description,
        }));
      } catch (err: any) {
        // Some servers (like Playwright) expose no resources
      }

      try {
        const promptResult = await client.listPrompts();
        promptsList = (promptResult.prompts || []).map((p: any) => ({
          name: p.name,
          description: p.description,
          arguments: p.arguments,
        }));
      } catch (err: any) {
        // Some servers expose no prompts
      }

      return {
        serverId: config.id,
        name: config.name,
        transport: config.transport,
        isLocal,
        status: "connected",
        authType: config.authType || (isLocal ? "None / Environment" : "Bearer Token / OAuth 2.1"),
        lastSynced: timestamp,
        tools: toolsList,
        resources: resourcesList,
        prompts: promptsList,
      };
    } catch (error: any) {
      const isAuthError =
        error.message?.includes("401") ||
        error.message?.includes("403") ||
        error.message?.includes("auth") ||
        error.message?.includes("x-deny-reason");

      return {
        serverId: config.id,
        name: config.name,
        transport: config.transport,
        isLocal,
        status: isAuthError ? "auth_required" : "error",
        errorDetails: error.message || "Failed to establish connection to MCP server.",
        authType: config.authType || "Unauthenticated",
        lastSynced: timestamp,
        tools: [],
        resources: [],
        prompts: [],
      };
    }
  }

  /**
   * Execute a tool call on an active connected client
   */
  async callTool(config: ServerConfig, toolName: string, params: Record<string, any>, isReadOnlyMode: boolean) {
    // Safety check for write operations if read-only mode is enabled
    if (isReadOnlyMode) {
      const lowerTool = toolName.toLowerCase();
      const isMutative =
        lowerTool.includes("create") ||
        lowerTool.includes("update") ||
        lowerTool.includes("delete") ||
        lowerTool.includes("post") ||
        lowerTool.includes("put") ||
        lowerTool.includes("remove") ||
        lowerTool.includes("patch") ||
        lowerTool.includes("write");

      if (isMutative) {
        throw new Error(`[Read-Only Guard Enabled] Call blocked for mutative tool '${toolName}'. Disable Read-Only Mode in Tool Playground to execute.`);
      }
    }

    let active = this.activeClients.get(config.id);

    if (!active) {
      // Auto reconnect
      await this.discoverServer(config);
      active = this.activeClients.get(config.id);
    }

    if (!active) {
      throw new Error(`Server '${config.name}' is not connected.`);
    }

    const startTime = Date.now();
    try {
      const response = await active.client.callTool({
        name: toolName,
        arguments: params,
      });
      const durationMs = Date.now() - startTime;

      return {
        success: true,
        toolName,
        durationMs,
        result: response,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      return {
        success: false,
        toolName,
        durationMs,
        error: error.message || "Tool execution failed.",
      };
    }
  }

  /**
   * Close connections gracefully
   */
  async closeAll() {
    for (const [id, item] of this.activeClients.entries()) {
      try {
        await item.client.close();
      } catch (err) {}
    }
    this.activeClients.clear();
  }
}

export const mcpManager = new MCPManager();
