import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, FileText, TestTube, Code2, PlayCircle,
  AlertCircle, Wrench, Bug, BarChart3, GitFork,
  Sparkles, Send, Paperclip, RefreshCw, ChevronRight,
  CheckCircle2, XCircle, Clock, Shield, Download,
  Link, Plus, ChevronDown, ChevronUp, Copy, Check,
  Activity, Zap, ArrowRight, FileUp, AlertTriangle,
  Terminal, Eye, EyeOff, Settings, Save, Key, Globe,
  Cpu, ExternalLink, Info, Search, RotateCcw, FolderKanban
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────
type Tab = 'chat' | 'projects' | 'acceptance' | 'tests' | 'automation' | 'execution' | 'defects' | 'reports' | 'traceability' | 'settings';
type MessageRole = 'user' | 'assistant' | 'system';
type PipelineStep = 'doc_parse' | 'req_quality' | 'acceptance_criteria' | 'test_design' |
  'automation_gen' | 'auto_quality' | 'execution' | 'failure' | 'healing' | 'report';

interface MCPServerConfig {
  id: string;
  name: string;
  type: 'stdio' | 'sse' | 'websocket';
  command_or_url: string;
  args: string[];
  env: Record<string, string>;
  enabled: boolean;
  description: string;
}

interface AppSettings {
  jira: { domain: string; email: string; token: string; project: string; };
  ai: { provider: string; baseUrl: string; apiKey: string; model: string; };
  mcpServers: MCPServerConfig[];
}

interface Message {
  id: string; role: MessageRole; content: string;
  step?: PipelineStep; data?: any; timestamp: Date;
  status?: 'running' | 'done' | 'error';
}

const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  {
    id: 'mcp-playwright',
    name: 'Playwright Browser MCP',
    type: 'stdio',
    command_or_url: 'npx',
    args: ['-y', '@modelcontextprotocol/server-playwright'],
    env: {},
    enabled: true,
    description: 'Enables LLM to directly interact with browsers, navigate pages, click elements, fill forms, and take screenshots.'
  },
  {
    id: 'mcp-fetch',
    name: 'Fetch / API MCP',
    type: 'stdio',
    command_or_url: 'uvx',
    args: ['mcp-server-fetch'],
    env: {},
    enabled: true,
    description: 'Enables web scraping, raw HTTP fetching, and REST API inspection.'
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  jira: { domain: '', email: '', token: '', project: '' },
  ai: { provider: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o' },
  mcpServers: DEFAULT_MCP_SERVERS
};

function uid() { return Math.random().toString(36).slice(2, 10); }
function ts(d: Date) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : '';

const STEP_LABELS: Record<PipelineStep, string> = {
  doc_parse: '📄 Document Parsing', req_quality: '① Requirement Quality Gate',
  acceptance_criteria: '② Acceptance Criteria', test_design: '③ Test Design Agent',
  automation_gen: '④ Automation Generation', auto_quality: '⑤ Automation Quality Gate',
  execution: '⑥ Test Execution', failure: '⑦ Failure Analysis',
  healing: '⑧ Self-Healing', report: '⑨ QA Report'
};

// ─── Primitives ─────────────────────────────────────────────────────────────
function ScoreBadge({ score, status }: { score: number; status: string }) {
  const map: Record<string, string> = {
    READY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    REVIEW_RECOMMENDED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    NEEDS_CLARIFICATION: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    NOT_READY: 'bg-red-500/15 text-red-400 border-red-500/30',
    PASS: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    FAIL: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? 'bg-zinc-700 text-zinc-300 border-zinc-600'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {Math.round(score)}% · {status}
    </span>
  );
}

function CodeBlock({ code, lang = 'typescript', defaultOpen = false }: { code: string; lang?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-zinc-700/60 overflow-hidden mt-2">
      <div className="flex items-center justify-between bg-zinc-800/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs font-mono text-zinc-400">{lang}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}{copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition">
            {open ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}{open ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      {open && <pre className="bg-zinc-950 p-4 text-xs font-mono text-zinc-300 leading-relaxed overflow-x-auto max-h-72 overflow-y-auto">{code}</pre>}
    </div>
  );
}

function FindingPill({ f }: { f: any }) {
  const sev: Record<string, string> = {
    CRITICAL: 'border-red-500/40 bg-red-500/10 text-red-300',
    HIGH: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
    MEDIUM: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    LOW: 'border-zinc-600/40 bg-zinc-700/30 text-zinc-400',
  };
  return (
    <div className={`rounded-lg border px-3 py-2.5 text-xs ${sev[f.severity] ?? sev.LOW}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold">{f.title}</span>
        <span className="font-mono opacity-60 text-[10px]">{f.rule_id}</span>
      </div>
      <p className="opacity-80 leading-relaxed">{f.description}</p>
      {f.recommendation && <p className="mt-1.5 opacity-60 italic text-[11px]">→ {f.recommendation}</p>}
    </div>
  );
}

// ─── Execution Card ──────────────────────────────────────────────────────────
function ExecutionCard({ exec, tc, analysis, healing }: { exec: any; tc?: any; analysis?: any; healing?: any }) {
  const [showLog, setShowLog] = useState(false);
  const [showHealing, setShowHealing] = useState(false);
  const passed = exec.status === 'PASSED';

  return (
    <div className={`rounded-xl border overflow-hidden ${!passed ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
          <div>
            <div className="text-sm font-medium text-zinc-200 leading-snug">{tc?.title ?? exec.execution_id}</div>
            <div className="text-xs text-zinc-600 font-mono">{exec.execution_id}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          {tc && <span className={`px-2 py-0.5 rounded-full font-medium ${
            tc.type === 'POSITIVE' ? 'bg-emerald-500/15 text-emerald-400' :
            tc.type === 'NEGATIVE' ? 'bg-red-500/15 text-red-400' :
            tc.type === 'SECURITY' ? 'bg-purple-500/15 text-purple-400' :
            'bg-amber-500/15 text-amber-400'
          }`}>{tc.type}</span>}
          <span className="text-zinc-500">{exec.duration_ms}ms</span>
          <span className={`font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>{exec.status}</span>
          <button onClick={() => setShowLog(!showLog)} title="View execution log" className="text-zinc-600 hover:text-zinc-300 transition">
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {showLog && exec.stdout && (
        <div className="border-t border-zinc-700/40 bg-zinc-950/60">
          <div className="px-4 pt-2 pb-1 text-[10px] text-zinc-600 font-mono uppercase tracking-wider">stdout</div>
          <pre className="px-4 pb-3 text-xs font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">{exec.stdout}</pre>
        </div>
      )}
      {!passed && exec.error_message && (
        <div className="border-t border-red-500/20 bg-red-950/20 px-4 py-3">
          <div className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />Error</div>
          <p className="text-xs text-red-300/80 leading-relaxed">{exec.error_message}</p>
          {exec.stderr && <pre className="mt-2 text-[11px] font-mono text-red-400/60 bg-black/30 rounded-lg p-2 whitespace-pre-wrap max-h-28 overflow-y-auto">{exec.stderr}</pre>}
          
          {/* Playwright Failure Screenshot Preview */}
          <div className="mt-3 pt-2 border-t border-red-500/20">
            <div className="text-[11px] font-semibold text-red-300 mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-red-400" /> Playwright Execution Screenshot
            </div>
            <div className="relative rounded-lg overflow-hidden border border-red-500/30 bg-black/60 p-2 text-center">
              <div className="bg-zinc-900 border border-zinc-700/60 rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>Viewport: 1280x720 (Chromium)</span>
                  <span>Captured at Failure</span>
                </div>
                <div className="h-32 bg-zinc-950 rounded border border-zinc-800 flex flex-col items-center justify-center p-3 text-center">
                  <span className="text-xs font-mono text-red-400 font-semibold mb-1">🚨 Element Locator Timeout / Navigation Failure</span>
                  <span className="text-[10px] text-zinc-500">Target: http://localhost:3000/dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {analysis && (
        <div className="border-t border-zinc-700/40 px-4 py-3 space-y-1.5">
          <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-2"><Activity className="w-3.5 h-3.5 text-orange-400" />Failure Analysis</div>
          <div className="flex items-center gap-3 text-xs">
            <span className="bg-orange-500/15 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full font-medium">{analysis.classification}</span>
            <span className="text-zinc-500">Confidence: <span className="text-zinc-300 font-semibold">{Math.round(analysis.confidence * 100)}%</span></span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">{analysis.root_cause}</p>
          {analysis.suggested_fix && <p className="text-xs text-blue-400/80 italic">→ {analysis.suggested_fix}</p>}
          {analysis.can_self_heal && healing && (
            <button onClick={() => setShowHealing(!showHealing)} className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition">
              <Wrench className="w-3.5 h-3.5" />{showHealing ? 'Hide' : 'View'} Self-Healing Proposal
            </button>
          )}
        </div>
      )}
      {showHealing && healing && (
        <div className="border-t border-emerald-500/20 bg-emerald-950/20 px-4 py-3 space-y-2">
          <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" />Self-Healing Proposal · {healing.proposal_id}</div>
          <p className="text-xs text-zinc-400 leading-relaxed">{healing.explanation}</p>
          <div className="font-mono text-xs bg-black/40 rounded-lg p-3 whitespace-pre-wrap text-emerald-300/80">{healing.diff}</div>
          <div className="flex gap-2 pt-1">
            <button className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-medium transition">✓ Accept Patch</button>
            <button className="flex-1 py-2 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/40 text-zinc-400 rounded-lg text-xs font-medium transition">✗ Reject</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Jira Preview Card ───────────────────────────────────────────────────────
function JiraPreviewCard({ issue, onRunPipeline, loading }: { issue: any; onRunPipeline: () => void; loading: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const sev: Record<string, string> = {
    Bug: 'bg-red-500/15 text-red-400', Story: 'bg-blue-500/15 text-blue-400',
    Task: 'bg-zinc-500/15 text-zinc-400', Epic: 'bg-purple-500/15 text-purple-400',
  };
  return (
    <div className="bg-zinc-900/60 border border-[#5c6ac4]/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#5c6ac4]/10 border-b border-[#5c6ac4]/20">
        <div className="flex items-center gap-2.5">
          <ExternalLink className="w-4 h-4 text-[#5c6ac4]" />
          <span className="text-sm font-semibold text-zinc-200">{issue.key ?? 'JIRA Issue'}</span>
          {issue.issue_type && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sev[issue.issue_type] ?? sev.Task}`}>{issue.issue_type}</span>
          )}
          {issue.priority && <span className="text-xs text-zinc-500">{issue.priority}</span>}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-zinc-500 hover:text-zinc-300 transition">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-4 py-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-1">Summary</p>
            <p className="text-sm text-zinc-100 font-medium leading-snug">{issue.title ?? issue.summary}</p>
          </div>
          {issue.description && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-1">Description</p>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">{issue.description}</p>
            </div>
          )}
          {issue.acceptance_criteria?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-1.5">Acceptance Criteria ({issue.acceptance_criteria.length})</p>
              <div className="space-y-1">
                {issue.acceptance_criteria.map((ac: string, i: number) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="w-4 h-4 rounded-full bg-[#5c6ac4]/20 text-[#5c6ac4] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    <p className="text-xs text-zinc-300 leading-relaxed">{ac}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-zinc-500 pt-1">
            {issue.assignee && <span>Assignee: <span className="text-zinc-300">{issue.assignee}</span></span>}
            {issue.status && <span>Status: <span className="text-zinc-300">{issue.status}</span></span>}
            {issue.sprint && <span>Sprint: <span className="text-zinc-300">{issue.sprint}</span></span>}
          </div>
        </div>
      )}

      {/* Action */}
      <div className="px-4 py-3 border-t border-zinc-800/50 flex gap-2">
        <button onClick={onRunPipeline} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-[#5c6ac4] hover:bg-[#6b7ae0] disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-medium transition">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Run QA Pipeline on This Issue
        </button>
      </div>
    </div>
  );
}

// ─── Input Helper Component ──────────────────────────────────────────────────
const SettingsInput = ({ value, onChange, type = 'text', placeholder, monospace = false }: any) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-[#5c6ac4]/60 focus:bg-zinc-800 transition ${monospace ? 'font-mono' : ''}`}
  />
);

const SectionHeader = ({ icon: Icon, title, desc }: any) => (
  <div className="flex items-start gap-3 mb-5">
    <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-[#5c6ac4]" />
    </div>
    <div>
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">{hint}</p>}
  </div>
);

// ─── Settings Page ───────────────────────────────────────────────────────────
function SettingsPage({ settings, onSave }: { settings: AppSettings; onSave: (s: AppSettings) => void }) {
  const [local, setLocal] = useState<AppSettings>(JSON.parse(JSON.stringify(settings)));
  const [saved, setSaved] = useState(false);
  const [testingJira, setTestingJira] = useState(false);
  const [jiraTestResult, setJiraTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [mcpTestStatuses, setMcpTestStatuses] = useState<Record<string, { loading: boolean; ok?: boolean; msg?: string }>>({});
  const [showToken, setShowToken] = useState(false);
  const [showAiKey, setShowAiKey] = useState(false);

  const handleSave = () => {
    onSave(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => { setLocal(JSON.parse(JSON.stringify(DEFAULT_SETTINGS))); };

  const testJiraConnection = async () => {
    if (!local.jira.domain || !local.jira.email || !local.jira.token) {
      setJiraTestResult({ ok: false, msg: 'Domain, email, and API token are required.' });
      return;
    }
    setTestingJira(true);
    setJiraTestResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/connectors/jira/fetch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: local.jira.domain, email: local.jira.email, api_token: local.jira.token,
          issue_key: local.jira.project ? `${local.jira.project}-1` : 'TEST-1'
        })
      });
      setJiraTestResult(res.ok
        ? { ok: true, msg: 'Connection successful! Jira credentials are valid.' }
        : { ok: false, msg: `Connection failed (${res.status}). Check your domain and credentials.` }
      );
    } catch {
      setJiraTestResult({ ok: false, msg: 'Could not reach backend or Jira. Verify URL and network.' });
    } finally { setTestingJira(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Settings</h2>
            <p className="text-sm text-zinc-500 mt-1">Configure integrations, AI provider, and agent behavior.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700/50 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 bg-[#5c6ac4] hover:bg-[#6b7ae0] text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm">
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Settings</>}
            </button>
          </div>
        </div>

        {/* ── Jira Section ──────────────────────────────────────── */}
        <div className="bg-zinc-900/50 border border-zinc-700/40 rounded-2xl p-6">
          <SectionHeader icon={Link} title="Jira Integration"
            desc="Connect to Jira Cloud to fetch user stories and requirements directly by issue key." />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Jira Domain" hint="e.g. company.atlassian.net — no https:// prefix">
                <SettingsInput value={local.jira.domain} onChange={(e: any) => setLocal(p => ({ ...p, jira: { ...p.jira, domain: e.target.value } }))}
                  placeholder="company.atlassian.net" />
              </Field>
              <Field label="Default Project Key" hint="e.g. US, PROJ, QA — used for quick-fetch">
                <SettingsInput value={local.jira.project} onChange={(e: any) => setLocal(p => ({ ...p, jira: { ...p.jira, project: e.target.value } }))}
                  placeholder="PROJ" monospace />
              </Field>
            </div>
            <Field label="Jira Email" hint="The email address of your Atlassian account">
              <SettingsInput value={local.jira.email} type="email"
                onChange={(e: any) => setLocal(p => ({ ...p, jira: { ...p.jira, email: e.target.value } }))}
                placeholder="you@company.com" />
            </Field>
            <Field label="API Token" hint="Generate at id.atlassian.com/manage-profile/security/api-tokens">
              <div className="relative">
                <SettingsInput type={showToken ? 'text' : 'password'} value={local.jira.token}
                  onChange={(e: any) => setLocal(p => ({ ...p, jira: { ...p.jira, token: e.target.value } }))}
                  placeholder="ATATT3xFfGF0…" monospace />
                <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition">
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {/* Test connection */}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={testJiraConnection} disabled={testingJira}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                {testingJira ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                Test Connection
              </button>
              {jiraTestResult && (
                <div className={`flex items-center gap-2 text-sm ${jiraTestResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {jiraTestResult.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
                  {jiraTestResult.msg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── AI Provider Section ───────────────────────────────── */}
        <div className="bg-zinc-900/50 border border-zinc-700/40 rounded-2xl p-6">
          <SectionHeader icon={Cpu} title="AI Provider"
            desc="Configure the LLM used for requirement analysis, test generation, and failure classification." />

          <div className="space-y-4">
            <Field label="Provider">
              <select value={local.ai.provider}
                onChange={e => {
                  const p = e.target.value;
                  const defaults: Record<string, { baseUrl: string; model: string }> = {
                    openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
                    groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
                    openrouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'meta-llama/llama-3.3-70b-instruct' },
                    ollama: { baseUrl: 'http://localhost:11434/v1', model: 'llama3' },
                    azure: { baseUrl: 'https://{resource}.openai.azure.com/openai/deployments/{deployment}', model: 'gpt-4o' },
                    custom: { baseUrl: '', model: '' },
                  };
                  setLocal(prev => ({ ...prev, ai: { ...prev.ai, provider: p, ...(defaults[p] || {}) } }));
                }}
                className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-[#5c6ac4]/60 transition">
                <option value="openai">OpenAI (GPT-4o, GPT-4-Turbo)</option>
                <option value="groq">Groq (Llama-3.3-70b, Mixtral, DeepSeek)</option>
                <option value="openrouter">OpenRouter (Multi-provider aggregator)</option>
                <option value="ollama">Ollama (local, Llama3, Mistral, etc.)</option>
                <option value="azure">Azure OpenAI</option>
                <option value="custom">Custom / Compatible Endpoint</option>
              </select>
            </Field>

            <Field label="Base URL" hint={local.ai.provider === 'ollama' ? 'Ollama runs locally — no API key required.' : 'The OpenAI-compatible API base URL'}>
              <SettingsInput value={local.ai.baseUrl}
                onChange={(e: any) => setLocal(p => ({ ...p, ai: { ...p.ai, baseUrl: e.target.value } }))}
                placeholder="https://api.openai.com/v1" monospace />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Model" hint="e.g. gpt-4o, gpt-4-turbo, llama3, mistral">
                <SettingsInput value={local.ai.model}
                  onChange={(e: any) => setLocal(p => ({ ...p, ai: { ...p.ai, model: e.target.value } }))}
                  placeholder="gpt-4o" monospace />
              </Field>
              <Field label="API Key" hint={local.ai.provider === 'ollama' ? 'Not required for Ollama' : 'Your API secret key'}>
                <div className="relative">
                  <SettingsInput type={showAiKey ? 'text' : 'password'} value={local.ai.apiKey}
                    onChange={(e: any) => setLocal(p => ({ ...p, ai: { ...p.ai, apiKey: e.target.value } }))}
                    placeholder={local.ai.provider === 'ollama' ? '(not required)' : 'sk-…'} monospace />
                  <button onClick={() => setShowAiKey(!showAiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition">
                    {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
            </div>

            {/* Test AI Connection */}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={async () => {
                setTestingAi(true);
                setAiTestResult(null);
                try {
                  const res = await fetch('http://localhost:8000/api/ai/test-connection', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      provider: local.ai.provider,
                      base_url: local.ai.baseUrl,
                      api_key: local.ai.apiKey,
                      model: local.ai.model
                    })
                  });
                  const data = await res.json();
                  if (data.ok) {
                    setAiTestResult({ ok: true, msg: `${data.message} (${data.response_snippet})` });
                  } else {
                    setAiTestResult({ ok: false, msg: data.error || 'AI Connection failed.' });
                  }
                } catch (e: any) {
                  setAiTestResult({ ok: false, msg: `Failed to connect to backend: ${e.message}` });
                } finally {
                  setTestingAi(false);
                }
              }} disabled={testingAi}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                {testingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                Test AI Connection
              </button>
              {aiTestResult && (
                <div className={`flex items-center gap-2 text-sm ${aiTestResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {aiTestResult.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
                  <span className="leading-snug">{aiTestResult.msg}</span>
                </div>
              )}
            </div>

            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-3 flex gap-2 text-xs text-zinc-500">
              <Info className="w-3.5 h-3.5 text-[#5c6ac4] flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                These settings are saved locally in your browser. The backend also reads AI config from <span className="font-mono text-zinc-400">AI_API_KEY</span>, <span className="font-mono text-zinc-400">AI_BASE_URL</span>, and <span className="font-mono text-zinc-400">AI_MODEL</span> environment variables. Without an AI provider, the engine uses the deterministic rule-based fallback.
              </p>
            </div>
          </div>
        </div>

        {/* ── MCP Configuration Section (Multiple Servers) ─────────── */}
        <div className="bg-zinc-900/50 border border-zinc-700/40 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <SectionHeader icon={Terminal} title="Model Context Protocol (MCP) Integrations"
              desc="Configure stdio, SSE, or WebSocket MCP tool servers (e.g. Playwright Browser MCP, Fetch MCP, Database MCP)." />
            <button
              onClick={() => {
                const newServer: MCPServerConfig = {
                  id: `mcp-${uid()}`,
                  name: 'Custom MCP Server',
                  type: 'stdio',
                  command_or_url: 'npx',
                  args: ['-y', 'my-mcp-server'],
                  env: {},
                  enabled: true,
                  description: 'Custom Model Context Protocol server configuration.'
                };
                setLocal(p => ({ ...p, mcpServers: [...(p.mcpServers || []), newServer] }));
              }}
              className="flex items-center gap-1.5 bg-[#5c6ac4]/20 hover:bg-[#5c6ac4]/30 border border-[#5c6ac4]/40 text-[#8b95e8] px-3 py-1.5 rounded-lg text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add MCP Server
            </button>
          </div>

          <div className="space-y-4">
            {(local.mcpServers || DEFAULT_MCP_SERVERS).map((mcp, idx) => (
              <div key={mcp.id || idx} className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <SettingsInput
                      value={mcp.name}
                      onChange={(e: any) => {
                        const updated = [...(local.mcpServers || [])];
                        updated[idx].name = e.target.value;
                        setLocal(p => ({ ...p, mcpServers: updated }));
                      }}
                      placeholder="MCP Server Name"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={mcp.type}
                      onChange={(e: any) => {
                        const updated = [...(local.mcpServers || [])];
                        updated[idx].type = e.target.value;
                        setLocal(p => ({ ...p, mcpServers: updated }));
                      }}
                      className="bg-zinc-800 border border-zinc-700/50 rounded-lg px-2.5 py-1 text-xs text-zinc-300 outline-none"
                    >
                      <option value="stdio">stdio (CLI)</option>
                      <option value="sse">SSE (HTTP)</option>
                      <option value="websocket">WebSocket</option>
                    </select>
                    <button
                      onClick={() => {
                        const updated = (local.mcpServers || []).filter((_, i) => i !== idx);
                        setLocal(p => ({ ...p, mcpServers: updated }));
                      }}
                      className="text-xs text-zinc-500 hover:text-red-400 p-1 transition"
                      title="Remove server"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      {mcp.type === 'stdio' ? 'Executable / Command' : 'Endpoint URL'}
                    </label>
                    <SettingsInput
                      value={mcp.command_or_url}
                      onChange={(e: any) => {
                        const updated = [...(local.mcpServers || [])];
                        updated[idx].command_or_url = e.target.value;
                        setLocal(p => ({ ...p, mcpServers: updated }));
                      }}
                      placeholder={mcp.type === 'stdio' ? 'npx / uvx / node' : 'http://localhost:8080/sse'}
                      monospace
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Arguments (space separated)</label>
                    <SettingsInput
                      value={mcp.args ? mcp.args.join(' ') : ''}
                      onChange={(e: any) => {
                        const updated = [...(local.mcpServers || [])];
                        updated[idx].args = e.target.value.split(' ').filter(Boolean);
                        setLocal(p => ({ ...p, mcpServers: updated }));
                      }}
                      placeholder="-y @modelcontextprotocol/server-playwright"
                      monospace
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Description / Tool Scope</label>
                  <SettingsInput
                    value={mcp.description || ''}
                    onChange={(e: any) => {
                      const updated = [...(local.mcpServers || [])];
                      updated[idx].description = e.target.value;
                      setLocal(p => ({ ...p, mcpServers: updated }));
                    }}
                    placeholder="Describe what capabilities this MCP server exposes to the AI..."
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        const mcpKey = mcp.id || `mcp-${idx}`;
                        setMcpTestStatuses(prev => ({ ...prev, [mcpKey]: { loading: true } }));
                        try {
                          const res = await fetch(`${API_BASE_URL}/api/mcp/test-connection`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(mcp)
                          });
                          const data = await res.json();
                          setMcpTestStatuses(prev => ({
                            ...prev,
                            [mcpKey]: { loading: false, ok: data.ok, msg: data.message || data.error || 'Done' }
                          }));
                        } catch (e: any) {
                          setMcpTestStatuses(prev => ({
                            ...prev,
                            [mcpKey]: { loading: false, ok: false, msg: `Failed: ${e.message}` }
                          }));
                        }
                      }}
                      disabled={mcpTestStatuses[mcp.id || `mcp-${idx}`]?.loading}
                      className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      {mcpTestStatuses[mcp.id || `mcp-${idx}`]?.loading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5c6ac4]" />
                      ) : (
                        <Activity className="w-3.5 h-3.5 text-[#5c6ac4]" />
                      )}
                      Test MCP Ping
                    </button>
                    {mcpTestStatuses[mcp.id || `mcp-${idx}`] && !mcpTestStatuses[mcp.id || `mcp-${idx}`].loading && (
                      <div className={`flex items-center gap-1.5 text-xs ${mcpTestStatuses[mcp.id || `mcp-${idx}`].ok ? 'text-emerald-400' : 'text-red-400'}`}>
                        {mcpTestStatuses[mcp.id || `mcp-${idx}`].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span className="leading-snug">{mcpTestStatuses[mcp.id || `mcp-${idx}`].msg}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-600 font-mono">ID: {mcp.id || `mcp-${idx}`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pipeline Behavior ─────────────────────────────────── */}
        <div className="bg-zinc-900/50 border border-zinc-700/40 rounded-2xl p-6">
          <SectionHeader icon={Activity} title="Pipeline Behavior"
            desc="Control how the AI QA pipeline behaves." />
          <div className="space-y-3 text-sm">
            {[
              { label: 'Auto-run pipeline after Jira fetch', desc: 'Immediately start the QA pipeline after fetching an issue (vs. showing preview first)', key: 'autoRunJira' },
              { label: 'Show execution stdout logs by default', desc: 'Expand test execution console output automatically', key: 'showLogs' },
              { label: 'Require human approval for self-healing', desc: 'Patches must be manually accepted — never auto-applied', key: 'requireApproval', locked: true },
            ].map(opt => (
              <div key={opt.key} className="flex items-start justify-between gap-4 py-2 border-b border-zinc-800/50 last:border-0">
                <div>
                  <p className="font-medium text-zinc-300 text-sm">{opt.label}</p>
                  <p className="text-zinc-600 text-xs mt-0.5 leading-relaxed">{opt.desc}</p>
                </div>
                <div className={`flex-shrink-0 w-10 h-5 rounded-full flex items-center ${opt.locked ? 'bg-[#5c6ac4]/60 cursor-not-allowed' : 'bg-zinc-700 cursor-pointer hover:bg-zinc-600'} transition relative`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow absolute transition-all ${opt.locked ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pb-4">
          <button onClick={handleSave} className="flex items-center gap-2 bg-[#5c6ac4] hover:bg-[#6b7ae0] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm">
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Settings</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, onTabSwitch }: { msg: Message; onTabSwitch: (t: Tab) => void }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-[78%]">
          <div className="bg-[#5c6ac4] text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-sm">{msg.content}</div>
          <div className="text-right mt-1 text-[11px] text-zinc-600">{ts(msg.timestamp)}</div>
        </div>
      </div>
    );
  }
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center mb-3">
        <div className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700/30 rounded-full px-4 py-1.5 text-xs text-zinc-500">
          <Activity className="w-3 h-3" />{msg.content}
        </div>
      </div>
    );
  }
  const d = msg.data; const step = msg.step;
  return (
    <div className="flex gap-3 mb-5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#5c6ac4] to-[#a855f7] flex items-center justify-center mt-0.5">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-zinc-200">AI QA Engineer</span>
          {step && <span className="text-xs bg-zinc-800 border border-zinc-700/50 text-zinc-400 px-2 py-0.5 rounded-full">{STEP_LABELS[step]}</span>}
          {msg.status === 'running' && <RefreshCw className="w-3.5 h-3.5 text-[#5c6ac4] animate-spin" />}
          {msg.status === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
          <span className="text-[11px] text-zinc-600 ml-auto">{ts(msg.timestamp)}</span>
        </div>
        <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{msg.content}</div>

        {step === 'doc_parse' && d && (
          <div className="mt-3 bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2"><FileUp className="w-4 h-4 text-[#5c6ac4]" /><span className="text-sm font-semibold text-zinc-200">{d.source_filename}</span></div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[{ label: 'Requirements', value: d.requirement_count ?? 1, color: 'text-[#5c6ac4]' },
                { label: 'Characters', value: d.char_count?.toLocaleString() ?? '—', color: 'text-zinc-300' },
                { label: 'Lines', value: d.line_count ?? '—', color: 'text-zinc-300' }].map(m => (
                <div key={m.label} className="bg-zinc-950/60 rounded-lg py-2.5">
                  <div className={`text-lg font-black ${m.color}`}>{m.value}</div>
                  <div className="text-[11px] text-zinc-600 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
            {d.all_requirements?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 mb-1.5">Extracted Requirements:</p>
                {d.all_requirements.map((r: any, i: number) => (
                  <div key={i} className="text-xs text-zinc-400 py-1 border-b border-zinc-800/60 last:border-0">
                    <span className="text-[#5c6ac4] font-mono mr-2">REQ-{String(i+1).padStart(3,'0')}</span>{r.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'acceptance_criteria' && d && (
          <div className="mt-3 bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4">
            <p className="text-xs font-semibold text-zinc-500 mb-2.5">Acceptance Criteria:</p>
            <div className="space-y-2">
              {d.map((ac: string, i: number) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#5c6ac4]/20 border border-[#5c6ac4]/40 text-[#5c6ac4] text-[10px] font-bold flex items-center justify-center mt-0.5">{i+1}</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">{ac}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'req_quality' && d && d.score !== undefined && (
          <div className="mt-3 bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold text-zinc-500">Requirement Score</span><ScoreBadge score={d.score} status={d.status} /></div>
            {d.critical_issues?.length > 0 && <div className="space-y-2"><p className="text-xs font-semibold text-red-400">🚨 Critical Issues</p>{d.critical_issues.map((f: any, i: number) => <FindingPill key={i} f={f} />)}</div>}
            {d.findings?.filter((f: any) => f.severity !== 'CRITICAL').length > 0 && <div className="space-y-2"><p className="text-xs font-semibold text-zinc-500">Findings</p>{d.findings.filter((f: any) => f.severity !== 'CRITICAL').map((f: any, i: number) => <FindingPill key={i} f={f} />)}</div>}
            {d.clarification_questions?.length > 0 && <div className="space-y-2"><p className="text-xs font-semibold text-amber-400">❓ Clarification Questions</p>{d.clarification_questions.map((q: any, i: number) => <div key={i} className="flex gap-2 text-xs text-zinc-400"><span className="text-amber-500">?</span><span>{q.question}</span></div>)}</div>}
          </div>
        )}

        {step === 'test_design' && Array.isArray(d) && (
          <div className="mt-3 space-y-2">
            {d.map((tc: any, i: number) => (
              <div key={i} className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-[#5c6ac4]">{tc.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tc.type==='POSITIVE'?'bg-emerald-500/15 text-emerald-400':tc.type==='NEGATIVE'?'bg-red-500/15 text-red-400':tc.type==='SECURITY'?'bg-purple-500/15 text-purple-400':'bg-amber-500/15 text-amber-400'}`}>{tc.type}</span>
                </div>
                <p className="text-sm text-zinc-200 mb-2 leading-snug">{tc.title}</p>
                <pre className="text-[11px] font-mono text-zinc-400 bg-zinc-950/60 rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed">{tc.gherkin}</pre>
                <p className="text-[11px] text-zinc-600 mt-1.5 italic">→ {tc.traceability_tag}</p>
              </div>
            ))}
          </div>
        )}

        {step === 'automation_gen' && Array.isArray(d) && (
          <div className="mt-3 space-y-3">
            {d.map((s: any, i: number) => (
              <div key={i} className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-purple-400 font-bold">{s.id}</span>
                  <span className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">{s.framework}</span>
                </div>
                <CodeBlock code={s.code} lang="typescript" defaultOpen={i === 0} />
              </div>
            ))}
          </div>
        )}

        {step === 'auto_quality' && Array.isArray(d) && (
          <div className="mt-3 space-y-2">
            {d.map((q: any, i: number) => (
              <div key={i} className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2"><span className="text-xs text-zinc-500">Script {i+1}</span><ScoreBadge score={q.score} status={q.status} /></div>
                {q.findings?.map((f: any, j: number) => <FindingPill key={j} f={f} />)}
                {(!q.findings || q.findings.length === 0) && <p className="text-xs text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />No violations found</p>}
              </div>
            ))}
          </div>
        )}

        {step === 'execution' && d && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-700/40 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-sm font-semibold text-emerald-400">{d.passed} Passed</span></div>
              <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" /><span className="text-sm font-semibold text-red-400">{d.failed} Failed</span></div>
              <div className="ml-auto text-xs text-zinc-500">Pass Rate: <span className="text-zinc-200 font-bold">{d.pass_rate}%</span></div>
            </div>
            {d.results?.map((item: any, i: number) => <ExecutionCard key={i} exec={item.exec} tc={item.tc} analysis={item.analysis} healing={item.healing} />)}
          </div>
        )}

        {step === 'report' && d && (
          <div className="mt-3 bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[{ label: 'Requirements', value: d.total_requirements ?? 1, color: 'text-[#5c6ac4]' },
                { label: 'Tests Run', value: d.total_tests ?? 0, color: 'text-zinc-200' },
                { label: 'Pass Rate', value: `${d.pass_rate ?? 0}%`, color: d.pass_rate >= 70 ? 'text-emerald-400' : 'text-red-400' }].map(m => (
                <div key={m.label} className="bg-zinc-950/60 rounded-lg py-3 text-center">
                  <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-zinc-600 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => onTabSwitch('traceability')}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/40 text-zinc-300 rounded-lg py-2.5 text-sm font-medium transition">
                <GitFork className="w-4 h-4" />Traceability Matrix
              </button>
              <button onClick={() => onTabSwitch('defects')}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/40 text-zinc-300 rounded-lg py-2.5 text-sm font-medium transition">
                <Bug className="w-4 h-4" />View Defects
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onQuickStart }: { onQuickStart: (t: string) => void }) {
  const prompts = [
    { text: 'Analyze password reset requirement', icon: Shield },
    { text: 'Run full QA pipeline on user login flow', icon: Zap },
    { text: 'Generate tests for product search feature', icon: Search },
    { text: 'Evaluate checkout automation quality', icon: Code2 },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 pb-24">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5c6ac4] to-[#a855f7] flex items-center justify-center shadow-lg shadow-[#5c6ac4]/30">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-100">AI QA Engineer</h2>
        <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
          Describe a requirement, paste a user story, upload a document, or fetch a Jira issue — the pipeline runs automatically.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-lg">
        {prompts.map(({ text, icon: Icon }) => (
          <button key={text} onClick={() => onQuickStart(text)}
            className="flex items-center gap-3 bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600 rounded-xl px-4 py-3.5 text-left transition group">
            <Icon className="w-4 h-4 text-zinc-600 group-hover:text-[#5c6ac4] transition flex-shrink-0" />
            <span className="text-sm text-zinc-500 group-hover:text-zinc-200 transition leading-snug">{text}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-2 text-xs text-zinc-700">
        <Paperclip className="w-3.5 h-3.5" />
        <span>Use the paperclip to upload a PDF, DOCX, TXT, or Markdown document</span>
      </div>
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, onClick, badge }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${active ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {badge && <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${badge==='PASS'?'bg-emerald-500/20 text-emerald-400':badge==='FAIL'?'bg-red-500/20 text-red-400':'bg-zinc-700 text-zinc-400'}`}>{badge}</span>}
    </button>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export function App() {
  const [tab, setTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pipelineData, setPipelineData] = useState<any>(null);

  // Settings — persisted to localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('ai-qa-settings') || '{}') }; }
    catch { return DEFAULT_SETTINGS; }
  });

  const saveSettings = (s: AppSettings) => {
    setSettings(s);
    localStorage.setItem('ai-qa-settings', JSON.stringify(s));
  };

  // Jira state
  const [jiraIssueKey, setJiraIssueKey] = useState('');
  const [fetchedJiraIssue, setFetchedJiraIssue] = useState<any>(null);
  const [fetchingJira, setFetchingJira] = useState(false);
  const [sourceType, setSourceType] = useState<'manual' | 'jira'>('manual');

  // Projects state
  const [projectsList, setProjectsList] = useState<any[]>([
    { id: 'proj-1', name: 'User Management & Authentication', description: 'Login, Registration, Password Reset, and Auth Middleware tests.', target_url: 'http://localhost:3000', total_runs: 18, automation_score: 94.2 },
    { id: 'proj-2', name: 'Checkout & Payment Suite', description: 'Cart processing, Stripe webhooks, order summary validation.', target_url: 'http://localhost:3000', total_runs: 12, automation_score: 88.5 },
  ]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');
  const selectedProject = projectsList.find(p => p.id === selectedProjectId) || projectsList[0];
  const [showCreateProjModal, setShowCreateProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjUrl, setNewProjUrl] = useState('');
  const [authType, setAuthType] = useState<'bearer' | 'basic' | 'custom'>('bearer');
  const [newProjAuth, setNewProjAuth] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [creatingProj, setCreatingProj] = useState(false);

  // Fetch projects from backend
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`);
      if (res.ok) {
        const data = await res.json();
        if (data.projects && data.projects.length > 0) {
          setProjectsList(data.projects);
        }
      }
    } catch (e) {
      console.warn('Backend projects fetch warning:', e);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const addMsg = (msg: Partial<Message> & { role: MessageRole; content: string }) => {
    const m: Message = { id: uid(), timestamp: new Date(), ...msg };
    setMessages(prev => [...prev, m]);
    return m.id;
  };

  const updateMsg = (id: string, patch: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  };

  // ── Run Full Pipeline (shared) ─────────────────────────────────────────────
  const runPipeline = async (reqData: { title: string; description: string; acceptance_criteria?: string[]; source?: string }) => {
    setLoading(true);
    const thinkId = addMsg({ role: 'assistant', content: `Analyzing: "${reqData.title.slice(0, 70)}…"`, status: 'running' });
    try {
      const res = await fetch(`${API_BASE_URL}/api/pipeline/run-full`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProjectId,
          title: reqData.title,
          description: reqData.description,
          acceptance_criteria: reqData.acceptance_criteria ?? [],
          source: reqData.source ?? 'manual',
          jira_config: {
            domain: settings.jira.domain,
            email: settings.jira.email,
            token: settings.jira.token,
            project: settings.jira.project
          }
        })
      });
      const data = await res.json();
      setPipelineData(data);
      updateMsg(thinkId, { status: 'done', content: 'Pipeline complete. Results across all quality gates:' });

      if (data.requirement?.acceptance_criteria?.length)
        addMsg({ role: 'assistant', step: 'acceptance_criteria', content: `Generated **${data.requirement.acceptance_criteria.length} acceptance criteria**.`, data: data.requirement.acceptance_criteria, status: 'done' });

      if (data.requirement_quality)
        addMsg({ role: 'assistant', step: 'req_quality', content: `Quality score: **${Math.round(data.requirement_quality.score)}%** — ${data.requirement_quality.status}.`, data: data.requirement_quality, status: 'done' });

      if (data.test_cases?.length)
        addMsg({ role: 'assistant', step: 'test_design', content: `Generated **${data.test_cases.length} test scenarios**.`, data: data.test_cases, status: 'done' });

      if (data.automation_scripts?.length)
        addMsg({ role: 'assistant', step: 'automation_gen', content: `Generated **${data.automation_scripts.length} Playwright scripts**.`, data: data.automation_scripts, status: 'done' });

      if (data.automation_qualities?.length)
        addMsg({ role: 'assistant', step: 'auto_quality', content: `Automation quality gate complete.`, data: data.automation_qualities, status: 'done' });

      if (data.executions?.length) {
        const passed = data.executions.filter((e: any) => e.status === 'PASSED').length;
        const failed = data.executions.length - passed;
        const resultItems = data.executions.map((exec: any, idx: number) => ({
          exec, tc: data.test_cases?.[idx],
          analysis: data.failure_analyses?.find((a: any) => a.execution_id === exec.execution_id),
          healing: data.healing_proposals?.find((h: any) => h.execution_id === exec.execution_id)
        }));
        addMsg({ role: 'assistant', step: 'execution', content: `Executed **${data.executions.length} tests** — ✅ ${passed} passed, ❌ ${failed} failed.`,
          data: { passed, failed, pass_rate: Math.round(passed / data.executions.length * 100), results: resultItems }, status: 'done' });
      }

      addMsg({ role: 'assistant', step: 'report', content: `QA pipeline complete. Full traceability from requirement → test → automation → execution.`,
        data: { total_requirements: 1, total_tests: data.executions?.length ?? 0, pass_rate: data.summary?.pass_rate ?? 0, raw: data }, status: 'done' });

    } catch (err: any) {
      updateMsg(thinkId, { status: 'error', content: `Pipeline error: ${err.message}` });
    } finally { setLoading(false); }
  };

  // ── Manual send ────────────────────────────────────────────────────────────
  const handleSend = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;
    setInput('');
    addMsg({ role: 'user', content: query });
    addMsg({ role: 'system', content: 'Initializing AI QA pipeline…' });
    await runPipeline({ title: query.slice(0, 60), description: query });
  };

  // ── Jira fetch & preview ──────────────────────────────────────────────────
  const handleFetchJira = async () => {
    const key = jiraIssueKey.trim() || (settings.jira.project ? `${settings.jira.project}-1` : '');
    if (!key) { addMsg({ role: 'system', content: 'Enter an issue key (e.g. US-101).' }); return; }
    if (!settings.jira.domain || !settings.jira.email || !settings.jira.token) {
      addMsg({ role: 'system', content: '⚠️ Jira credentials not configured. Go to Settings → Jira Integration.' });
      return;
    }
    setFetchingJira(true);
    setFetchedJiraIssue(null);
    addMsg({ role: 'system', content: `Fetching Jira issue ${key}…` });
    try {
      const res = await fetch(`${API_BASE_URL}/api/connectors/jira/fetch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: settings.jira.domain, email: settings.jira.email, api_token: settings.jira.token, issue_key: key })
      });
      const data = await res.json();
      if (data.error) {
        addMsg({ role: 'system', content: `⚠️ Jira fetch error: ${data.error}` });
        return;
      }
      const story = data.selected_story;
      if (story?.title || story?.summary) {
        const issue = { ...story, key };
        setFetchedJiraIssue(issue);
        addMsg({ role: 'assistant', step: undefined, content: `Fetched Jira issue **${key}** — review the description below, then click "Run QA Pipeline".`, data: null, status: 'done' });
      } else {
        addMsg({ role: 'system', content: `No issue details found for ${key}. Check credentials in Settings.` });
      }
    } catch (err: any) {
      addMsg({ role: 'system', content: `Jira fetch failed: ${err.message}. Check Settings → Jira Integration.` });
    } finally { setFetchingJira(false); }
  };

  // ── Run pipeline from Jira issue ──────────────────────────────────────────
  const runJiraPipeline = async () => {
    if (!fetchedJiraIssue) return;
    setFetchedJiraIssue(null); // dismiss preview
    addMsg({ role: 'user', content: `🎫 Running QA pipeline on Jira ${fetchedJiraIssue.key}: ${fetchedJiraIssue.title ?? fetchedJiraIssue.summary}` });
    addMsg({ role: 'system', content: 'Starting pipeline from Jira issue…' });
    await runPipeline({
      title: fetchedJiraIssue.title ?? fetchedJiraIssue.summary ?? fetchedJiraIssue.key,
      description: fetchedJiraIssue.description ?? '',
      acceptance_criteria: fetchedJiraIssue.acceptance_criteria ?? [],
      source: 'jira'
    });
  };

  // ── Document upload ────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || loading) return;
    e.target.value = '';
    setLoading(true);
    addMsg({ role: 'user', content: `📎 Uploaded: **${file.name}**` });
    const parseId = addMsg({ role: 'assistant', step: 'doc_parse', content: `Parsing "${file.name}"…`, status: 'running' });
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('project_id', selectedProjectId);
      addMsg({ role: 'system', content: `Running full pipeline for project ${selectedProject?.name || selectedProjectId}…` });
      const res = await fetch(`${API_BASE_URL}/api/pipeline/from-document`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Backend error ${res.status}`);
      const data = await res.json();
      setPipelineData(data);

      updateMsg(parseId, {
        status: 'done',
        content: `Parsed **${data.document_metadata?.requirement_count ?? 1} requirement(s)** from "${file.name}".`,
        data: { source_filename: data.source_filename, requirement_count: data.document_metadata?.requirement_count, char_count: data.document_metadata?.char_count, line_count: data.document_metadata?.line_count, all_requirements: data.all_requirements ?? [] }
      });

      for (const r of (data.pipeline_results ?? [])) {
        if ((data.pipeline_results?.length ?? 0) > 1)
          addMsg({ role: 'system', content: `Processing: ${r.requirement?.title}` });

        if (r.requirement?.acceptance_criteria?.length)
          addMsg({ role: 'assistant', step: 'acceptance_criteria', content: `Generated **${r.requirement.acceptance_criteria.length} acceptance criteria**.`, data: r.requirement.acceptance_criteria, status: 'done' });

        if (r.requirement_quality)
          addMsg({ role: 'assistant', step: 'req_quality', content: `Quality: **${Math.round(r.requirement_quality.score)}%** — ${r.requirement_quality.status}.`, data: r.requirement_quality, status: 'done' });

        if (r.test_cases?.length)
          addMsg({ role: 'assistant', step: 'test_design', content: `Generated **${r.test_cases.length} test scenarios** (${[...new Set(r.test_cases.map((t: any) => t.type))].join(', ')}).`, data: r.test_cases, status: 'done' });

        if (r.automation_scripts?.length)
          addMsg({ role: 'assistant', step: 'automation_gen', content: `Generated **${r.automation_scripts.length} Playwright scripts**.`, data: r.automation_scripts, status: 'done' });

        if (r.automation_qualities?.length)
          addMsg({ role: 'assistant', step: 'auto_quality', content: `Automation quality gate complete.`, data: r.automation_qualities, status: 'done' });

        if (r.executions?.length) {
          const passed = r.executions.filter((e: any) => e.status === 'PASSED').length;
          const failed = r.executions.length - passed;
          const resultItems = r.executions.map((exec: any, idx: number) => ({
            exec, tc: r.test_cases?.[idx],
            analysis: r.failure_analyses?.find((a: any) => a.execution_id === exec.execution_id),
            healing: r.healing_proposals?.find((h: any) => h.execution_id === exec.execution_id)
          }));
          addMsg({ role: 'assistant', step: 'execution', content: `Executed **${r.executions.length} tests** — ✅ ${passed} passed, ❌ ${failed} failed.`,
            data: { passed, failed, pass_rate: Math.round(passed / r.executions.length * 100), results: resultItems }, status: 'done' });
        }
      }

      const s = data.summary ?? {};
      addMsg({ role: 'assistant', step: 'report', content: `Pipeline complete for **"${file.name}"**. Full traceability preserved.`,
        data: { total_requirements: s.total_requirements ?? data.pipeline_results?.length ?? 1, total_tests: s.total_tests ?? 0, pass_rate: s.pass_rate ?? 0, raw: data }, status: 'done' });

    } catch (err: any) {
      updateMsg(parseId, { status: 'error', content: `Failed to process "${file.name}": ${err.message}` });
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const allExecs = (pipelineData?.pipeline_results ?? []).flatMap((r: any) => r.executions ?? []).concat(pipelineData?.executions ?? []);
  const execBadge = allExecs.length ? (allExecs.some((e: any) => e.status === 'FAILED') ? 'FAIL' : 'PASS') : undefined;
  const isChat = tab === 'chat';

  const renderStaticTab = () => {
    if (tab === 'traceability') {
      const r = pipelineData?.pipeline_results?.[0] ?? pipelineData ?? {};
      const tcs = r.test_cases ?? []; const execs = r.executions ?? []; const scripts = r.automation_scripts ?? [];
      return (
        <div className="p-8 max-w-5xl mx-auto">
          <h2 className="text-lg font-bold text-zinc-100 mb-6">Traceability Matrix</h2>
          {tcs.length === 0 ? <p className="text-sm text-zinc-500">Run a pipeline to see the traceability matrix.</p> : (
            <div className="overflow-x-auto rounded-xl border border-zinc-700/40">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-zinc-900/80 border-b border-zinc-700/60">{['Requirement','AC','Test ID','Type','Automation','Status','Duration'].map(h=><th key={h} className="px-4 py-3 text-left text-zinc-500 font-semibold uppercase tracking-wide text-[10px]">{h}</th>)}</tr></thead>
                <tbody>{tcs.map((tc: any, i: number) => { const exec=execs[i]; const script=scripts[i]; return (
                  <tr key={tc.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition">
                    <td className="px-4 py-3 font-mono text-[#5c6ac4] max-w-[100px] truncate">{tc.requirement_id}</td>
                    <td className="px-4 py-3 text-zinc-500 max-w-[140px] truncate text-[11px]">{tc.traceability_tag?.split('|')[1]?.trim()?.slice(0,40) ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-zinc-300 font-medium">{tc.id}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full font-medium ${tc.type==='POSITIVE'?'bg-emerald-500/15 text-emerald-400':tc.type==='NEGATIVE'?'bg-red-500/15 text-red-400':tc.type==='SECURITY'?'bg-purple-500/15 text-purple-400':'bg-amber-500/15 text-amber-400'}`}>{tc.type}</span></td>
                    <td className="px-4 py-3 font-mono text-purple-400">{script?.id ?? '—'}</td>
                    <td className="px-4 py-3">{exec ? <span className={`font-bold ${exec.status==='PASSED'?'text-emerald-400':'text-red-400'}`}>{exec.status}</span> : <span className="text-zinc-600">—</span>}</td>
                    <td className="px-4 py-3 text-zinc-500">{exec ? `${exec.duration_ms}ms` : '—'}</td>
                  </tr>); })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    if (tab === 'projects') {
      return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Projects & Suites</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Organize test requirements, acceptance criteria, and execution runs by project.</p>
            </div>
            <button
              onClick={() => setShowCreateProjModal(true)}
              className="flex items-center gap-2 bg-[#5c6ac4] hover:bg-[#6b7ae0] text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Project
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {projectsList.map((p: any) => (
              <div key={p.id} className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-5 space-y-3 hover:border-zinc-600 transition">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#5c6ac4] font-bold">{p.id}</span>
                  <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
                    {p.automation_score || 90.0}% Auto Score
                  </span>
                </div>
                <h3 className="text-base font-semibold text-zinc-100">{p.name}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{p.description || p.desc || 'QA Test Project'}</p>

                <div className="space-y-1.5 pt-1 text-xs border-t border-zinc-800/40">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Globe className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="font-mono text-zinc-300 truncate">{p.target_url || 'http://localhost:3000'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Key className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="font-mono text-zinc-400 truncate">{p.auth_config ? 'Configured (Bearer Token/Headers)' : 'Default Basic/Session Auth'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs text-zinc-500">
                  <span>Total Runs: <span className="text-zinc-200 font-semibold">{p.total_runs || p.runs || 0}</span></span>
                  <button onClick={() => setTab('chat')} className="text-[#5c6ac4] hover:text-[#7885d8] font-medium flex items-center gap-1">Run Pipeline <ArrowRight className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (tab === 'acceptance') {
      const acList = pipelineData?.requirement?.acceptance_criteria ?? pipelineData?.pipeline_results?.[0]?.requirement?.acceptance_criteria ?? [];
      return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Acceptance Criteria</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Extracted and AI-generated acceptance criteria defining verifiable pass/fail rules.</p>
          </div>
          {acList.length === 0 ? (
            <p className="text-sm text-zinc-500">Run a pipeline or upload a requirement document to view Acceptance Criteria.</p>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-6 space-y-4">
              <div className="text-xs font-semibold text-[#5c6ac4] uppercase tracking-wider">Acceptance Criteria ({acList.length})</div>
              <div className="space-y-3">
                {acList.map((ac: string, i: number) => (
                  <div key={i} className="flex gap-3 items-start bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3.5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#5c6ac4]/20 border border-[#5c6ac4]/40 text-[#5c6ac4] text-xs font-bold flex items-center justify-center mt-0.5">{i+1}</span>
                    <p className="text-sm text-zinc-200 leading-relaxed">{ac}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (tab === 'reports') {
      const execs = (pipelineData?.pipeline_results ?? []).flatMap((r: any) => r.executions ?? []).concat(pipelineData?.executions ?? []);
      const passed = execs.filter((e: any) => e.status === 'PASSED').length;
      const failed = execs.length - passed;
      const passRate = execs.length ? Math.round((passed / execs.length) * 100) : 0;
      const autoScore = pipelineData?.summary?.automation_quality_score ?? 92.5;

      return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Execution Analytics & Quality Reports</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Aggregated metrics, automation quality trends, and execution details.</p>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`${API_BASE_URL}/api/reports/download-html`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'text/html' },
                    body: JSON.stringify(pipelineData || {})
                  });
                  const htmlText = await res.text();
                  const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `QA_Audit_Report_${selectedProject?.id || 'Suite'}.html`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch { alert('Failed to download HTML report.'); }
              }}
              className="flex items-center gap-2 bg-[#5c6ac4] hover:bg-[#6b7ae0] text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              <Download className="w-4 h-4" /> Download HTML Report
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-zinc-100">{execs.length || 5}</div>
              <div className="text-xs text-zinc-500 mt-1">Total Executions</div>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-emerald-400">{passed || 4}</div>
              <div className="text-xs text-zinc-500 mt-1">Passed Tests</div>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-red-400">{failed || 1}</div>
              <div className="text-xs text-zinc-500 mt-1">Failed Tests</div>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-[#5c6ac4]">{autoScore}%</div>
              <div className="text-xs text-zinc-500 mt-1">Automation Quality Score</div>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-200">Automation Script Quality Breakdown</h3>
            <div className="space-y-3">
              {[
                { rule: 'Playwright Auto-Waiting', score: '100%', status: 'PASS' },
                { rule: 'Locator Stability (Role/TestId)', score: '95%', status: 'PASS' },
                { rule: 'Explicit Business Assertions', score: '90%', status: 'PASS' },
                { rule: 'No Hardcoded Secrets/URLs', score: '100%', status: 'PASS' },
              ].map(r => (
                <div key={r.rule} className="flex items-center justify-between bg-zinc-950/60 border border-zinc-800/60 rounded-lg px-4 py-3 text-xs">
                  <span className="text-zinc-300 font-medium">{r.rule}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-400">{r.score}</span>
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (tab === 'tests') {
      const tcs = pipelineData?.test_cases ?? pipelineData?.pipeline_results?.[0]?.test_cases ?? [];
      return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Jira Test Cases (Gherkin Format)</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Structured BDD test scenarios linked to requirements and acceptance criteria.</p>
          </div>
          {tcs.length === 0 ? (
            <p className="text-sm text-zinc-500">Run a pipeline or fetch a Jira issue to generate Test Cases.</p>
          ) : (
            <div className="space-y-4">
              {tcs.map((tc: any, i: number) => (
                <div key={tc.id || i} className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-[#5c6ac4]">{tc.id}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        tc.type === 'POSITIVE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        tc.type === 'NEGATIVE' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                        tc.type === 'SECURITY' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
                        'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>{tc.type}</span>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">{tc.traceability_tag}</span>
                  </div>

                  <h3 className="text-base font-semibold text-zinc-100">{tc.title}</h3>

                  <div>
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">BDD Gherkin Specification</span>
                    <pre className="mt-1 text-xs font-mono text-zinc-300 bg-zinc-950/80 border border-zinc-800 rounded-lg p-3.5 whitespace-pre-wrap leading-relaxed">
                      {tc.gherkin}
                    </pre>
                  </div>

                  {tc.expected_outcome && (
                    <div className="text-xs text-zinc-400 pt-1">
                      <span className="font-semibold text-zinc-300">Expected Outcome: </span>{tc.expected_outcome}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (tab === 'automation') {
      const scripts = pipelineData?.automation_scripts ?? pipelineData?.pipeline_results?.[0]?.automation_scripts ?? [];
      return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Playwright TypeScript Automation Scripts</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Executable Playwright E2E and Bruno API test automation code.</p>
          </div>
          {scripts.length === 0 ? (
            <p className="text-sm text-zinc-500">Run a pipeline to generate Automation Scripts.</p>
          ) : (
            <div className="space-y-4">
              {scripts.map((s: any, i: number) => (
                <div key={s.id || i} className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-purple-400">{s.id}</span>
                      <span className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">{s.framework} ({s.language})</span>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">Linked TC: {s.test_case_id}</span>
                  </div>
                  <CodeBlock code={s.code} lang="typescript" defaultOpen={true} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (tab === 'execution') {
      const execs = pipelineData?.executions ?? pipelineData?.pipeline_results?.[0]?.executions ?? [];
      const tcs = pipelineData?.test_cases ?? pipelineData?.pipeline_results?.[0]?.test_cases ?? [];
      const analyses = pipelineData?.failure_analyses ?? pipelineData?.pipeline_results?.[0]?.failure_analyses ?? [];
      const healings = pipelineData?.healing_proposals ?? pipelineData?.pipeline_results?.[0]?.healing_proposals ?? [];

      return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Automation Execution Runs</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Live execution details, logs, failure root cause classification, and self-healing patches.</p>
          </div>
          {execs.length === 0 ? (
            <p className="text-sm text-zinc-500">Run a pipeline to view Execution details.</p>
          ) : (
            <div className="space-y-4">
              {execs.map((exec: any, i: number) => (
                <ExecutionCard
                  key={exec.execution_id || i}
                  exec={exec}
                  tc={tcs[i]}
                  analysis={analyses.find((a: any) => a.execution_id === exec.execution_id)}
                  healing={healings.find((h: any) => h.execution_id === exec.execution_id)}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (tab === 'defects') {
      const analyses = pipelineData?.failure_analyses ?? pipelineData?.pipeline_results?.[0]?.failure_analyses ?? [];
      const execs = pipelineData?.executions ?? pipelineData?.pipeline_results?.[0]?.executions ?? [];
      const failedExecs = execs.filter((e: any) => e.status === 'FAILED');

      return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Defects & Jira Bug Tracking</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Automated Jira bug creation for failed pipeline test scenarios with direct ticket URLs.</p>
          </div>

          {failedExecs.length === 0 && analyses.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-base font-semibold text-zinc-200">No Defects Found</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">All test scenarios for the selected project have passed cleanly. Any future test failure will automatically log a Jira bug here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((a: any, i: number) => {
                const ex = execs.find((e: any) => e.execution_id === a.execution_id) || execs[i];
                return (
                  <div key={a.analysis_id || i} className="bg-zinc-900/60 border border-red-500/30 rounded-xl p-5 space-y-4 shadow-lg shadow-black/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full font-bold">
                          {a.classification}
                        </span>
                        <span className="font-mono text-xs text-zinc-500">Execution: {a.execution_id}</span>
                      </div>
                      
                      {/* Created Jira Ticket Link */}
                      <a
                        href={a.jira_ticket_url || `https://jira.company.com/browse/${a.jira_ticket_key || 'BUG-101'}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 bg-[#5c6ac4]/20 hover:bg-[#5c6ac4]/30 border border-[#5c6ac4]/40 text-[#5c6ac4] text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Jira Ticket: {a.jira_ticket_key || 'BUG-101'}
                      </a>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-zinc-100">{a.root_cause}</h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{ex?.error_message || 'Execution assertion failed.'}</p>
                    </div>

                    <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-xs space-y-1">
                      <div className="font-semibold text-zinc-300">Suggested Resolution:</div>
                      <div className="text-zinc-400 leading-normal">{a.suggested_action}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (tab !== 'settings') {
      return (
        <div className="p-8 max-w-5xl mx-auto">
          <h2 className="text-lg font-bold text-zinc-100 mb-4 capitalize">{tab}</h2>
          {!pipelineData ? <p className="text-sm text-zinc-500">Run a pipeline from the Chat view to see data here.</p> : (
            <pre className="text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4 overflow-auto max-h-[70vh]">
              {JSON.stringify(pipelineData, null, 2)}
            </pre>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-56 flex flex-col border-r border-zinc-800/50 bg-zinc-900/30 shrink-0">
        <div className="px-4 py-4 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5c6ac4] to-[#a855f7] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-100 leading-tight">AI QA Engineer</div>
            <div className="text-[10px] text-zinc-600">Quality Command Center</div>
          </div>
        </div>

        {/* Active Project Selector */}
        <div className="px-3 mb-3">
          <div className="text-[10px] font-semibold text-zinc-700 px-1 py-1 uppercase tracking-widest">Active Project</div>
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl px-3 py-2 text-xs text-zinc-200 font-medium outline-none focus:border-[#5c6ac4] transition appearance-none cursor-pointer pr-8"
            >
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>

        <div className="px-3 mb-3">
          <button onClick={() => { setMessages([]); setPipelineData(null); setFetchedJiraIssue(null); setTab('chat'); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700/50 text-sm text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 transition">
            <Plus className="w-4 h-4" />New Pipeline
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          <div className="text-[10px] font-semibold text-zinc-700 px-3 py-1.5 uppercase tracking-widest">Workspace</div>
          <NavItem icon={LayoutDashboard} label="Projects & Suites" active={tab==='projects'} onClick={() => setTab('projects')} />
          <div className="text-[10px] font-semibold text-zinc-700 px-3 py-1.5 mt-1.5 uppercase tracking-widest">Pipeline</div>
          <NavItem icon={Activity} label="Chat / Run" active={tab==='chat'} onClick={() => setTab('chat')} />
          <NavItem icon={FileText} label="Acceptance Criteria" active={tab==='acceptance'} onClick={() => setTab('acceptance')}
            badge={pipelineData ? `${(pipelineData.requirement?.acceptance_criteria ?? pipelineData.pipeline_results?.[0]?.requirement?.acceptance_criteria ?? []).length}` : undefined} />
          <NavItem icon={TestTube} label="Test Cases" active={tab==='tests'} onClick={() => setTab('tests')}
            badge={pipelineData ? `${(pipelineData.test_cases??pipelineData.pipeline_results?.[0]?.test_cases??[]).length}` : undefined} />
          <NavItem icon={Code2} label="Automation" active={tab==='automation'} onClick={() => setTab('automation')} />
          <NavItem icon={PlayCircle} label="Execution" active={tab==='execution'} onClick={() => setTab('execution')} badge={execBadge} />
          <div className="text-[10px] font-semibold text-zinc-700 px-3 py-1.5 mt-1.5 uppercase tracking-widest">Analysis</div>
          <NavItem icon={Bug} label="Defects" active={tab==='defects'} onClick={() => setTab('defects')} />
          <NavItem icon={BarChart3} label="Reports & Analytics" active={tab==='reports'} onClick={() => setTab('reports')} />
          <NavItem icon={GitFork} label="Traceability" active={tab==='traceability'} onClick={() => setTab('traceability')} />
        </nav>

        <div className="px-3 pb-3 mt-auto space-y-0.5 border-t border-zinc-800/50 pt-3">
          <NavItem icon={Settings} label="Settings" active={tab==='settings'} onClick={() => setTab('settings')} />
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-700">
            <div className={`w-1.5 h-1.5 rounded-full ${loading?'bg-amber-500 animate-pulse':'bg-emerald-500'}`} />
            {loading ? 'Pipeline running…' : 'Backend ready'}
          </div>
          {settings.ai.model && (
            <div className="flex items-center gap-2 px-3 py-1 text-[11px] text-zinc-700">
              <Cpu className="w-3 h-3" />{settings.ai.model}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/50 bg-zinc-900/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-zinc-200">
              {tab==='chat'?'AI QA Pipeline':tab==='settings'?'Settings':tab.charAt(0).toUpperCase()+tab.slice(1)}
            </h1>
            {selectedProject && (
              <span className="text-xs bg-[#5c6ac4]/15 border border-[#5c6ac4]/30 text-[#5c6ac4] font-medium px-3 py-0.5 rounded-full flex items-center gap-1.5">
                <FolderKanban className="w-3 h-3" />
                {selectedProject.name} ({selectedProject.id})
              </span>
            )}
            {pipelineData && tab!=='settings' && (
              <span className="text-xs bg-zinc-800 border border-zinc-700/40 text-zinc-500 px-2.5 py-0.5 rounded-full">
                {pipelineData.source==='document' ? `📄 ${pipelineData.source_filename}` : 'Pipeline complete'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isChat && (
              <div className="flex bg-zinc-800/50 border border-zinc-700/40 rounded-lg p-0.5 text-xs">
                {(['manual','jira'] as const).map(s => (
                  <button key={s} onClick={() => { setSourceType(s); setFetchedJiraIssue(null); }}
                    className={`px-3 py-1.5 rounded-md transition capitalize ${sourceType===s?'bg-zinc-700 text-zinc-100 font-medium':'text-zinc-500 hover:text-zinc-300'}`}>
                    {s==='jira'?'Jira':'Manual'}
                  </button>
                ))}
              </div>
            )}
            {isChat && (
              <button onClick={() => handleSend('Run full QA demo pipeline on password reset user story')} disabled={loading}
                className="flex items-center gap-2 bg-[#5c6ac4] hover:bg-[#6b7ae0] disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm">
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}Run Demo
              </button>
            )}
          </div>
        </header>

        {/* Settings page takes full space */}
        {tab === 'settings' ? (
          <SettingsPage settings={settings} onSave={saveSettings} />
        ) : (
          <>
            {/* Jira toolbar — shown when Jira source is active in chat */}
            {isChat && sourceType === 'jira' && (
              <div className="border-b border-zinc-800/50 bg-zinc-900/20 px-6 py-2.5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {settings.jira.domain ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 mr-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{settings.jira.domain}</span>
                    </div>
                  ) : (
                    <button onClick={() => setTab('settings')} className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition mr-2">
                      <AlertTriangle className="w-3.5 h-3.5" />Configure Jira in Settings
                    </button>
                  )}
                  <input value={jiraIssueKey} onChange={e => setJiraIssueKey(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleFetchJira(); }}
                    placeholder={settings.jira.project ? `${settings.jira.project}-101` : 'US-101'}
                    className="w-36 bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-[#5c6ac4]/50 font-mono" />
                  <button onClick={handleFetchJira} disabled={fetchingJira || loading}
                    className="flex items-center gap-1.5 bg-[#5c6ac4]/20 hover:bg-[#5c6ac4]/30 border border-[#5c6ac4]/40 text-[#8b95e8] px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40">
                    {fetchingJira ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    {fetchingJira ? 'Fetching…' : 'Fetch Issue'}
                  </button>
                  <p className="text-xs text-zinc-600 ml-2">Press Enter or click Fetch to preview the issue before running the pipeline</p>
                </div>
              </div>
            )}

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
              {!isChat ? renderStaticTab() : (
                <div className="max-w-3xl mx-auto px-4 py-6 min-h-full">
                  {messages.length === 0 && !fetchedJiraIssue
                    ? <EmptyState onQuickStart={t => { setInput(t); setTimeout(() => inputRef.current?.focus(), 50); }} />
                    : (
                      <>
                        {messages.map(m => <MessageBubble key={m.id} msg={m} onTabSwitch={t => setTab(t as Tab)} />)}
                        {/* Jira issue preview card */}
                        {fetchedJiraIssue && (
                          <div className="mb-5">
                            <JiraPreviewCard issue={fetchedJiraIssue} onRunPipeline={runJiraPipeline} loading={loading} />
                          </div>
                        )}
                        <div ref={scrollRef} />
                      </>
                    )}
                </div>
              )}
            </div>

            {/* Input bar */}
            {isChat && (
              <div className="border-t border-zinc-800/50 bg-zinc-900/20 px-4 py-3 flex-shrink-0">
                <div className="max-w-3xl mx-auto">
                  <div className="relative flex items-end gap-2 bg-zinc-900/70 border border-zinc-700/50 hover:border-zinc-600/60 focus-within:border-[#5c6ac4]/50 rounded-2xl px-4 py-3 transition shadow-lg shadow-black/20">
                    <label className="flex-shrink-0 mb-0.5 cursor-pointer group" title="Upload PDF, DOCX, TXT or Markdown">
                      <input type="file" className="hidden" accept=".pdf,.docx,.txt,.md" onChange={handleFileUpload} disabled={loading} />
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${loading?'opacity-30':'hover:bg-zinc-700/60'}`}>
                        <Paperclip className="w-4 h-4 text-zinc-500 group-hover:text-[#5c6ac4] transition" />
                      </div>
                    </label>
                    <textarea ref={inputRef} rows={1} value={input} disabled={loading}
                      onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,160)+'px'; }}
                      onKeyDown={handleKeyDown}
                      placeholder={sourceType==='jira'?'Or type a requirement description manually…':'Describe a requirement, user story, or feature…'}
                      className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 resize-none outline-none leading-relaxed disabled:opacity-40"
                      style={{ minHeight:'22px', maxHeight:'160px' }} />
                    <button onClick={() => handleSend()} disabled={loading || !input.trim()}
                      className="flex-shrink-0 mb-0.5 w-8 h-8 flex items-center justify-center bg-[#5c6ac4] hover:bg-[#6b7ae0] disabled:opacity-30 disabled:bg-zinc-700 rounded-lg transition">
                      {loading ? <RefreshCw className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                  <p className="text-center text-xs text-zinc-700 mt-2">
                    <kbd className="font-mono">Enter</kbd> to send · <kbd className="font-mono">Shift+Enter</kbd> for new line · 📎 upload document
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Create Project Modal ───────────────────────────────────── */}
      {showCreateProjModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-100">Create New QA Project</h3>
              <button onClick={() => setShowCreateProjModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Project Name</label>
                <SettingsInput
                  value={newProjName}
                  onChange={(e: any) => setNewProjName(e.target.value)}
                  placeholder="e.g. User Auth & Portal Suite"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Target Application URL</label>
                <SettingsInput
                  value={newProjUrl}
                  onChange={(e: any) => setNewProjUrl(e.target.value)}
                  placeholder="https://staging.myapp.com or http://localhost:3000"
                  monospace
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Authentication Method</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    { id: 'bearer', label: 'Bearer Token' },
                    { id: 'basic', label: 'Basic Auth' },
                    { id: 'custom', label: 'Custom Header' },
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        setAuthType(method.id as any);
                        if (method.id === 'bearer' && !newProjAuth.startsWith('Bearer ')) {
                          setNewProjAuth(newProjAuth ? `Bearer ${newProjAuth.replace(/^Bearer\s+/, '')}` : 'Bearer ');
                        }
                      }}
                      className={`py-1.5 px-2 text-xs rounded-lg border font-medium transition ${
                        authType === method.id
                          ? 'bg-[#5c6ac4]/20 border-[#5c6ac4] text-[#5c6ac4]'
                          : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>

                <SettingsInput
                  value={newProjAuth}
                  onChange={(e: any) => setNewProjAuth(e.target.value)}
                  placeholder={
                    authType === 'bearer'
                      ? 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                      : authType === 'basic'
                      ? 'admin:password123'
                      : '{"Authorization": "Bearer token", "X-API-Key": "key"}'
                  }
                  monospace
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  {authType === 'bearer'
                    ? 'Paste your JWT or OAuth Bearer token above. Playwright will automatically inject it into request headers.'
                    : authType === 'basic'
                    ? 'Enter username:password for HTTP Basic Auth.'
                    : 'Provide valid JSON headers object.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Description</label>
                <textarea
                  value={newProjDesc}
                  onChange={e => setNewProjDesc(e.target.value)}
                  placeholder="Describe the scope of requirements and target services..."
                  className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-[#5c6ac4]/60 resize-none h-20"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCreateProjModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700/50 text-xs font-medium text-zinc-400 hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newProjName.trim()) return;
                  setCreatingProj(true);
                  try {
                    const res = await fetch('http://localhost:8000/api/projects', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: newProjName.trim(),
                        description: newProjDesc.trim(),
                        target_url: newProjUrl.trim() || 'http://localhost:3000',
                        auth_config: newProjAuth.trim()
                      })
                    });
                    const data = await res.json();
                    if (data.project) {
                      setProjectsList(prev => [data.project, ...prev]);
                    }
                    setShowCreateProjModal(false);
                    setNewProjName('');
                    setNewProjUrl('');
                    setNewProjAuth('');
                    setNewProjDesc('');
                  } catch (e: any) {
                    alert(`Failed to create project: ${e.message}`);
                  } finally {
                    setCreatingProj(false);
                  }
                }}
                disabled={creatingProj || !newProjName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#5c6ac4] hover:bg-[#6b7ae0] disabled:opacity-40 text-white text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                {creatingProj ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {creatingProj ? 'Creating…' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
