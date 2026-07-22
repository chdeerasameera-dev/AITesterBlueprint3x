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

export interface DailyServer {
  id: string;
  name: string;
  usage: string;
  transport: string;
  command?: string;
  url?: string;
}

export interface ExecutionResult {
  success: boolean;
  toolName: string;
  durationMs: number;
  result?: any;
  error?: string;
}
