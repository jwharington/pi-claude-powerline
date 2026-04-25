import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { AssistantMessage } from "@mariozechner/pi-ai";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

const WIDGET_KEY = "claude-powerline-bar";


type ThemeName = "dark" | "light" | "nord" | "tokyo-night" | "rose-pine" | "gruvbox";
type SegmentKey =
  | "spinner"
  | "directory"
  | "git"
  | "model"
  | "session"
  | "context"
  | "today"
  | "weekly"
  | "env"
  | "tmux";

type SegmentColor = { bg: string; fg: string };
type ColorTheme = Record<SegmentKey, SegmentColor>;

type SegmentVisibility = Record<SegmentKey, boolean>;
type PersistedConfig = {
  enabled?: boolean;
  theme?: ThemeName;
  segments?: Partial<SegmentVisibility>;
};

const DEFAULT_SEGMENT_VISIBILITY: SegmentVisibility = {
  spinner: false,
  directory: true,
  git: true,
  model: true,
  session: true,
  context: true,
  today: true,
  weekly: false,
  env: false,
  tmux: false,
};

const ALL_SEGMENTS: SegmentKey[] = [
  "spinner",
  "directory",
  "git",
  "model",
  "session",
  "context",
  "today",
  "weekly",
  "env",
  "tmux",
];

const THEMES: Record<ThemeName, ColorTheme> = {
  dark: {
    spinner: { bg: "#1f2937", fg: "#93c5fd" },
    directory: { bg: "#8b4513", fg: "#ffffff" },
    git: { bg: "#404040", fg: "#ffffff" },
    model: { bg: "#2d2d2d", fg: "#ffffff" },
    session: { bg: "#202020", fg: "#00ffff" },
    context: { bg: "#4a5568", fg: "#cbd5e0" },
    today: { bg: "#1a1a1a", fg: "#98fb98" },
    weekly: { bg: "#2a2a3a", fg: "#a0c4e8" },
    env: { bg: "#2d2d3d", fg: "#d0a0d0" },
    tmux: { bg: "#2f4f2f", fg: "#90ee90" },
  },
  light: {
    spinner: { bg: "#dbeafe", fg: "#1d4ed8" },
    directory: { bg: "#ff6b47", fg: "#ffffff" },
    git: { bg: "#4fb3d9", fg: "#ffffff" },
    model: { bg: "#87ceeb", fg: "#000000" },
    session: { bg: "#da70d6", fg: "#ffffff" },
    context: { bg: "#718096", fg: "#ffffff" },
    today: { bg: "#10b981", fg: "#ffffff" },
    weekly: { bg: "#4f46e5", fg: "#ffffff" },
    env: { bg: "#d45dbf", fg: "#ffffff" },
    tmux: { bg: "#32cd32", fg: "#ffffff" },
  },
  nord: {
    spinner: { bg: "#2e3440", fg: "#88c0d0" },
    directory: { bg: "#434c5e", fg: "#d8dee9" },
    git: { bg: "#3b4252", fg: "#a3be8c" },
    model: { bg: "#4c566a", fg: "#81a1c1" },
    session: { bg: "#2e3440", fg: "#88c0d0" },
    context: { bg: "#5e81ac", fg: "#eceff4" },
    today: { bg: "#2e3440", fg: "#8fbcbb" },
    weekly: { bg: "#3b4252", fg: "#88c0d0" },
    env: { bg: "#3b4252", fg: "#b48ead" },
    tmux: { bg: "#2e3440", fg: "#8fbcbb" },
  },
  "tokyo-night": {
    spinner: { bg: "#1f2335", fg: "#7aa2f7" },
    directory: { bg: "#2f334d", fg: "#82aaff" },
    git: { bg: "#1e2030", fg: "#c3e88d" },
    model: { bg: "#191b29", fg: "#fca7ea" },
    session: { bg: "#222436", fg: "#86e1fc" },
    context: { bg: "#414868", fg: "#c0caf5" },
    today: { bg: "#1a202c", fg: "#4fd6be" },
    weekly: { bg: "#24283b", fg: "#7dcfff" },
    env: { bg: "#24283b", fg: "#fca7ea" },
    tmux: { bg: "#191b29", fg: "#4fd6be" },
  },
  "rose-pine": {
    spinner: { bg: "#1f1d2e", fg: "#c4a7e7" },
    directory: { bg: "#26233a", fg: "#c4a7e7" },
    git: { bg: "#1f1d2e", fg: "#9ccfd8" },
    model: { bg: "#191724", fg: "#ebbcba" },
    session: { bg: "#26233a", fg: "#f6c177" },
    context: { bg: "#393552", fg: "#e0def4" },
    today: { bg: "#232136", fg: "#9ccfd8" },
    weekly: { bg: "#21202e", fg: "#c4a7e7" },
    env: { bg: "#21202e", fg: "#eb6f92" },
    tmux: { bg: "#26233a", fg: "#908caa" },
  },
  gruvbox: {
    spinner: { bg: "#3c3836", fg: "#fabd2f" },
    directory: { bg: "#504945", fg: "#ebdbb2" },
    git: { bg: "#3c3836", fg: "#b8bb26" },
    model: { bg: "#665c54", fg: "#83a598" },
    session: { bg: "#282828", fg: "#8ec07c" },
    context: { bg: "#458588", fg: "#ebdbb2" },
    today: { bg: "#282828", fg: "#fabd2f" },
    weekly: { bg: "#3c3836", fg: "#8ec07c" },
    env: { bg: "#3c3836", fg: "#d3869b" },
    tmux: { bg: "#282828", fg: "#fe8019" },
  },
};

const RESET = "\u001b[0m";
const POWERLINE_GLYPH = process.env.POWERLINE_NERD_FONTS === "0" ? ">" : "\uE0B0";
const SPINNER_FRAMES = process.env.POWERLINE_NERD_FONTS === "0"
  ? ["-", "\\", "|", "/"]
  : ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function fg(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `\u001b[38;2;${r};${g};${b}m`;
}

function bg(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `\u001b[48;2;${r};${g};${b}m`;
}

function fmtTokens(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value < 1000) return String(Math.round(value));
  return `${(value / 1000).toFixed(1)}k`;
}

function fmtCost(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (value < 10) return `$${value.toFixed(2)}`;
  if (value < 1000) return `$${value.toFixed(1)}`;
  return `$${(value / 1000).toFixed(1)}k`;
}

function parseTimestamp(candidate: unknown): number | null {
  if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
  if (typeof candidate === "string") {
    const parsed = Date.parse(candidate);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function usageWindowStart(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function getUsageStats(ctx: any): {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  sessionTokens: number;
  sessionCost: number;
  todayCost: number;
  weeklyCost: number;
} {
  let input = 0;
  let output = 0;
  let cacheRead = 0;
  let cacheWrite = 0;
  let sessionTokens = 0;
  let sessionCost = 0;
  let todayCost = 0;
  let weeklyCost = 0;

  const todayStart = usageWindowStart(1);
  const weeklyStart = usageWindowStart(7);

  for (const entry of ctx.sessionManager.getEntries()) {
    if (entry.type !== "message") continue;
    const msg = entry.message as AssistantMessage;
    if (msg.role !== "assistant" || !msg.usage) continue;

    const msgInput = msg.usage.input ?? 0;
    const msgOutput = msg.usage.output ?? 0;
    const msgCacheRead = msg.usage.cacheRead ?? 0;
    const msgCacheWrite = msg.usage.cacheWrite ?? 0;
    const cost = msg.usage.cost?.total ?? 0;

    input += msgInput;
    output += msgOutput;
    cacheRead += msgCacheRead;
    cacheWrite += msgCacheWrite;
    sessionTokens += msgInput + msgOutput;
    sessionCost += cost;

    const ts = parseTimestamp(msg.timestamp) ?? parseTimestamp(entry.timestamp);
    if (ts === null) continue;
    if (ts >= todayStart) todayCost += cost;
    if (ts >= weeklyStart) weeklyCost += cost;
  }

  return { input, output, cacheRead, cacheWrite, sessionTokens, sessionCost, todayCost, weeklyCost };
}

type RenderSegment = { id: SegmentKey; text: string; color: SegmentColor };

function shouldRenderSeparator(
  current: RenderSegment,
  next: RenderSegment,
  options?: { omitSeparators?: string[] },
): boolean {
  const pair = `${current.id}:${next.id}`;
  return !(options?.omitSeparators?.includes(pair));
}

function renderPowerlineRow(
  segments: RenderSegment[],
  width: number,
  options?: {
    fillLast?: boolean;
    fillLastRatio?: number;
    fillLastUnusedBg?: string;
    omitLastGlyph?: boolean;
    rightAlignLastText?: boolean;
    omitSeparators?: string[];
  },
): string {
  if (segments.length === 0) return "";

  const renderDefault = (): string => {
    let out = "";
    for (let i = 0; i < segments.length; i += 1) {
      const current = segments[i]!;
      const next = segments[i + 1];

      out += `${fg(current.color.fg)}${bg(current.color.bg)} ${current.text} ${RESET}`;

      if (next) {
        if (shouldRenderSeparator(current, next, options)) {
          out += `${fg(current.color.bg)}${bg(next.color.bg)}${POWERLINE_GLYPH}${RESET}`;
        }
      } else {
        out += `${fg(current.color.bg)}${POWERLINE_GLYPH}${RESET}`;
      }
    }

    return truncateToWidth(`${out} `, width);
  };

  if (!options?.fillLast || segments.length < 1) {
    return renderDefault();
  }

  const allButLast = segments.slice(0, -1);
  const last = segments[segments.length - 1]!;

  let out = "";
  let usedWidth = 0;

  for (let i = 0; i < allButLast.length; i += 1) {
    const current = allButLast[i]!;
    const next = segments[i + 1]!;

    const content = ` ${current.text} `;
    out += `${fg(current.color.fg)}${bg(current.color.bg)}${content}${RESET}`;
    usedWidth += visibleWidth(content);

    if (shouldRenderSeparator(current, next, options)) {
      out += `${fg(current.color.bg)}${bg(next.color.bg)}${POWERLINE_GLYPH}${RESET}`;
      usedWidth += visibleWidth(POWERLINE_GLYPH);
    }
  }

  const lastTextWidth = visibleWidth(last.text);
  const glyphWidth = options?.omitLastGlyph ? 0 : visibleWidth(POWERLINE_GLYPH);
  const minLastWidth = lastTextWidth + 2 + glyphWidth;
  const remaining = width - usedWidth;

  if (remaining < minLastWidth) {
    return renderDefault();
  }

  const lastAreaWidth = remaining - glyphWidth;
  const baseLastContent = ` ${last.text} `;
  const baseLastContentWidth = visibleWidth(baseLastContent);
  const paddingWidth = Math.max(0, lastAreaWidth - baseLastContentWidth);
  const lastContent = options?.rightAlignLastText
    ? `${" ".repeat(paddingWidth)}${baseLastContent}`
    : ` ${last.text}${" ".repeat(Math.max(0, lastAreaWidth - (lastTextWidth + 2)))} `;

  if (typeof options?.fillLastRatio === "number" && Number.isFinite(options.fillLastRatio)) {
    const ratio = Math.max(0, Math.min(1, options.fillLastRatio));
    const fillWidth = Math.max(0, Math.min(lastAreaWidth, Math.round(lastAreaWidth * ratio)));

    const chars = Array.from(lastContent);
    let splitIndex = chars.length;
    let widthSoFar = 0;
    for (let i = 0; i < chars.length; i += 1) {
      const w = visibleWidth(chars[i] ?? "");
      if (widthSoFar + w > fillWidth) {
        splitIndex = i;
        break;
      }
      widthSoFar += w;
      splitIndex = i + 1;
    }

    const filledPart = chars.slice(0, splitIndex).join("");
    const unfilledPart = chars.slice(splitIndex).join("");
    const unfilledBg = options.fillLastUnusedBg ?? last.color.bg;

    if (filledPart.length > 0) {
      out += `${fg(last.color.fg)}${bg(last.color.bg)}${filledPart}${RESET}`;
    }
    if (unfilledPart.length > 0) {
      out += `${fg(last.color.fg)}${bg(unfilledBg)}${unfilledPart}${RESET}`;
    }

    if (!options?.omitLastGlyph) {
      out += `${fg(last.color.bg)}${POWERLINE_GLYPH}${RESET}`;
    }
    return truncateToWidth(out, width);
  }

  out += `${fg(last.color.fg)}${bg(last.color.bg)}${lastContent}${RESET}`;
  if (!options?.omitLastGlyph) {
    out += `${fg(last.color.bg)}${POWERLINE_GLYPH}${RESET}`;
  }

  return truncateToWidth(out, width);
}

function parseTmuxLabel(): string | null {
  const tmuxRaw = process.env.TMUX;
  if (!tmuxRaw) return null;

  const pieces = tmuxRaw.split(",");
  const sessionId = pieces[2] ?? "tmux";
  return `tmux:${sessionId}`;
}

function parseEnvLabel(): string | null {
  const value = process.env.CLAUDE_POWERLINE_ENV
    ?? process.env.PI_ENV
    ?? process.env.NODE_ENV
    ?? null;

  return value ? String(value) : null;
}

function parseSegmentKey(value: string): SegmentKey | null {
  const candidate = value.trim().toLowerCase();
  return ALL_SEGMENTS.includes(candidate as SegmentKey) ? (candidate as SegmentKey) : null;
}

function mutedContextFillColor(percent: number | undefined, fallback: SegmentColor): SegmentColor {
  if (typeof percent !== "number" || !Number.isFinite(percent)) {
    return fallback;
  }

  if (percent > 70) {
    return { bg: "#5b2d2f", fg: "#f8d7da" }; // muted critical
  }

  if (percent > 40) {
    return { bg: "#5b4a2a", fg: "#f5e6c8" }; // muted warning
  }

  return { bg: "#2f4f46", fg: "#d7efe8" }; // muted healthy
}

function sanitizeStatusText(text: string): string {
  return text
    .replace(/[\r\n\t]/g, " ")
    .replace(/ +/g, " ")
    .trim();
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePersistedConfig(value: unknown): PersistedConfig {
  if (!isRecord(value)) return {};

  const parsed: PersistedConfig = {};

  if (typeof value.enabled === "boolean") {
    parsed.enabled = value.enabled;
  }

  if (typeof value.theme === "string" && Object.prototype.hasOwnProperty.call(THEMES, value.theme)) {
    parsed.theme = value.theme as ThemeName;
  }

  if (isRecord(value.segments)) {
    const segments: Partial<SegmentVisibility> = {};
    for (const key of ALL_SEGMENTS) {
      const v = value.segments[key];
      if (typeof v === "boolean") segments[key] = v;
    }
    parsed.segments = segments;
  }

  return parsed;
}

function readSettingsFile(path: string): Record<string, unknown> {
  try {
    if (!existsSync(path)) return {};
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function getGlobalSettingsPath(): string {
  return join(process.env.HOME || process.env.USERPROFILE || homedir(), ".pi", "agent", "settings.json");
}

function getProjectSettingsPath(cwd: string): string {
  return join(cwd, ".pi", "settings.json");
}

function loadPersistedConfig(cwd: string): PersistedConfig {
  const global = readSettingsFile(getGlobalSettingsPath());
  const project = readSettingsFile(getProjectSettingsPath(cwd));
  const g = parsePersistedConfig(global.claudePowerline);
  const p = parsePersistedConfig(project.claudePowerline);

  return {
    enabled: p.enabled ?? g.enabled,
    theme: p.theme ?? g.theme,
    segments: { ...(g.segments ?? {}), ...(p.segments ?? {}) },
  };
}

function writePersistedConfig(cwd: string, config: PersistedConfig): boolean {
  const globalPath = getGlobalSettingsPath();
  const projectPath = getProjectSettingsPath(cwd);
  const global = readSettingsFile(globalPath);
  const project = readSettingsFile(projectPath);

  const writeToProject = Object.prototype.hasOwnProperty.call(project, "claudePowerline");
  const targetPath = writeToProject ? projectPath : globalPath;
  const target = writeToProject ? project : global;

  target.claudePowerline = {
    enabled: config.enabled,
    theme: config.theme,
    segments: config.segments,
  };

  try {
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, `${JSON.stringify(target, null, 2)}\n`, "utf8");
    return true;
  } catch {
    return false;
  }
}

export default function (pi: ExtensionAPI) {
  let enabled = true;
  let theme: ThemeName = "dark";
  let isStreaming = false;
  let spinnerIndex = 0;
  let spinnerTimer: ReturnType<typeof setInterval> | null = null;
  let latestCtx: any = null;
  let gitBranch = "";
  let requestRender: (() => void) | null = null;
  let segmentVisibility: SegmentVisibility = { ...DEFAULT_SEGMENT_VISIBILITY };

  const maybeRender = () => requestRender?.();

  const stopSpinner = () => {
    if (spinnerTimer) {
      clearInterval(spinnerTimer);
      spinnerTimer = null;
    }
  };

  const startSpinner = () => {
    stopSpinner();
    spinnerTimer = setInterval(() => {
      if (!isStreaming) return;
      spinnerIndex = (spinnerIndex + 1) % SPINNER_FRAMES.length;
      maybeRender();
    }, 90);
  };

  const refreshBranch = async () => {
    const ctx = latestCtx;
    if (!ctx) return;

    try {
      const result = await pi.exec("git", ["branch", "--show-current"], { timeout: 2_000 });
      gitBranch = (result.stdout ?? "").trim();
    } catch {
      gitBranch = "";
    }

    maybeRender();
  };

  const applyBar = (ctx: any) => {
    if (!ctx.hasUI) return;

    if (!enabled) {
      ctx.ui.setWidget(WIDGET_KEY, undefined);
      ctx.ui.setFooter(undefined);
      ctx.ui.setEditorComponent(undefined);
      return;
    }

    // Keep default editor behavior.
    ctx.ui.setEditorComponent(undefined);

    // Keep only non-redundant footer info (extension status texts).
    ctx.ui.setFooter((_tui, uiTheme, footerData) => ({
      invalidate() {},
      render(width: number): string[] {
        const statuses = Array.from(footerData.getExtensionStatuses().entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, value]) => sanitizeStatusText(value))
          .filter((value) => value.length > 0);

        if (statuses.length === 0) return [];

        const raw = statuses.join(" ");
        const truncated = truncateToWidth(raw, width, "...");
        const pad = Math.max(0, width - visibleWidth(truncated));
        const line = `${" ".repeat(pad)}${truncated}`;
        return [uiTheme.fg("dim", line)];
      },
    }));

    // Render powerline above the editor for stable layout behavior.
    ctx.ui.setWidget(
      WIDGET_KEY,
      (tui) => {
        requestRender = () => tui.requestRender();

        return {
          dispose() {
            if (requestRender) requestRender = null;
          },
          invalidate() {},
          render(width: number): string[] {
            const currentTheme = THEMES[theme];
            const model = ctx.model?.id ?? "no-model";
            const provider = ctx.model?.provider;
            const thinkingLevel = typeof ctx.getThinkingLevel === "function" ? ctx.getThinkingLevel() : "off";
            const cwdName = basename(ctx.cwd || process.cwd()) || "/";
            const sessionName = ctx.sessionManager?.getSessionName?.();
            const usage = getUsageStats(ctx);
            const contextUsage = ctx.getContextUsage?.();
            const contextPercent = contextUsage?.percent;
            const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
            const contextText = typeof contextPercent === "number"
              ? `◔ ${contextPercent.toFixed(1)}%/${fmtTokens(contextWindow)}`
              : `◔ ?/${fmtTokens(contextWindow)}`;
            const envLabel = parseEnvLabel();
            const tmuxLabel = parseTmuxLabel();

            const dirText = sessionName ? `📁 ${cwdName} • ${sessionName}` : `📁 ${cwdName}`;
            const modelText = provider
              ? `✱ (${provider}) ${model} • ${thinkingLevel}`
              : `✱ ${model} • ${thinkingLevel}`;

            const segments: RenderSegment[] = [];

            if (segmentVisibility.directory) segments.push({ id: "directory", text: dirText, color: currentTheme.directory });
            if (segmentVisibility.git) segments.push({ id: "git", text: gitBranch ? `⎇ ${gitBranch}` : "⎇ no-git", color: currentTheme.git });
            if (segmentVisibility.model) segments.push({ id: "model", text: modelText, color: currentTheme.model });
            if (segmentVisibility.session) {
              segments.push({
                id: "session",
                text: `§ ↑${fmtTokens(usage.input)} ↓${fmtTokens(usage.output)} R${fmtTokens(usage.cacheRead)} W${fmtTokens(usage.cacheWrite)} ${fmtCost(usage.sessionCost)}`,
                color: currentTheme.session,
              });
            }
            if (segmentVisibility.today) segments.push({ id: "today", text: `☀ ${fmtCost(usage.todayCost)}`, color: currentTheme.today });
            if (segmentVisibility.weekly) segments.push({ id: "weekly", text: `◷ ${fmtCost(usage.weeklyCost)}`, color: currentTheme.weekly });
            if (segmentVisibility.env && envLabel) segments.push({ id: "env", text: `⚑ ${envLabel}`, color: currentTheme.env });
            if (segmentVisibility.tmux && tmuxLabel) segments.push({ id: "tmux", text: `⌂ ${tmuxLabel}`, color: currentTheme.tmux });

            let contextRatio: number | undefined;
            if (segmentVisibility.context) {
              const contextColor = mutedContextFillColor(contextPercent, currentTheme.context);
              segments.push({ id: "context", text: contextText, color: contextColor });
              contextRatio = typeof contextPercent === "number" ? contextPercent / 100 : 0;
            }

            return [renderPowerlineRow(segments, width, {
              fillLast: segmentVisibility.context,
              fillLastRatio: segmentVisibility.context ? contextRatio : undefined,
              fillLastUnusedBg: "#1f2937",
              omitLastGlyph: segmentVisibility.context,
              rightAlignLastText: segmentVisibility.context,
              omitSeparators: ["git:model"],
            })];
          },
        };
      },
      { placement: "aboveEditor" },
    );
  };

  const showSegmentStatus = (ctx: any) => {
    const enabledSegments = ALL_SEGMENTS.filter((key) => segmentVisibility[key]);
    ctx.ui.notify(`Segments on: ${enabledSegments.join(", ")}`, "info");
  };

  pi.on("session_start", async (_event, ctx) => {
    latestCtx = ctx;
    isStreaming = false;
    spinnerIndex = 0;

    const persisted = loadPersistedConfig(ctx.cwd);
    if (typeof persisted.enabled === "boolean") enabled = persisted.enabled;
    if (persisted.theme) theme = persisted.theme;
    if (persisted.segments) {
      segmentVisibility = { ...DEFAULT_SEGMENT_VISIBILITY, ...persisted.segments };
    }

    if (!ctx.hasUI) return;

    ctx.ui.setFooter(undefined);
    ctx.ui.setWidget(WIDGET_KEY, undefined);
    applyBar(ctx);
    await refreshBranch();
  });

  pi.on("session_shutdown", async () => {
    stopSpinner();
    requestRender = null;
    if (latestCtx?.hasUI) {
      latestCtx.ui.setWidget(WIDGET_KEY, undefined);
      latestCtx.ui.setFooter(undefined);
      latestCtx.ui.setEditorComponent(undefined);
    }
    latestCtx = null;
  });

  pi.on("agent_start", async () => {
    isStreaming = true;
    spinnerIndex = 0;
    startSpinner();
    maybeRender();
  });

  pi.on("agent_end", async () => {
    isStreaming = false;
    spinnerIndex = 0;
    stopSpinner();
    maybeRender();
  });

  pi.on("tool_result", async (event) => {
    if (event.toolName === "edit" || event.toolName === "write" || event.toolName === "bash") {
      await refreshBranch();
    }
  });

  pi.on("user_bash", async () => {
    await refreshBranch();
  });

  pi.on("model_select", async () => {
    maybeRender();
  });

  pi.registerCommand("claude-powerline", {
    description: "Claude-style powerline bar: /claude-powerline [on|off|toggle|theme <name>|segments ...]",
    handler: async (args, ctx) => {
      latestCtx = ctx;
      const input = (args ?? "").trim();
      const parts = input.length > 0 ? input.split(/\s+/) : [];

      if (parts.length === 0 || parts[0] === "toggle") {
        enabled = !enabled;
      } else if (parts[0] === "on") {
        enabled = true;
      } else if (parts[0] === "off") {
        enabled = false;
      } else if (parts[0] === "theme") {
        const next = (parts[1] ?? "").trim() as ThemeName;
        if (!Object.prototype.hasOwnProperty.call(THEMES, next)) {
          ctx.ui.notify("Unknown theme. Use: dark, light, nord, tokyo-night, rose-pine, gruvbox", "warning");
          return;
        }
        theme = next;
        enabled = true;
      } else if (parts[0] === "segments") {
        const action = (parts[1] ?? "").toLowerCase();
        const targets = parts.slice(2).map(parseSegmentKey).filter((v): v is SegmentKey => v !== null);

        if (!action || action === "list") {
          showSegmentStatus(ctx);
          return;
        }

        if (action === "reset") {
          segmentVisibility = { ...DEFAULT_SEGMENT_VISIBILITY };
        } else if (action === "on") {
          if (targets.length === 0) {
            ctx.ui.notify("Usage: /claude-powerline segments on <segment...>", "info");
            return;
          }
          for (const target of targets) segmentVisibility[target] = true;
        } else if (action === "off") {
          if (targets.length === 0) {
            ctx.ui.notify("Usage: /claude-powerline segments off <segment...>", "info");
            return;
          }
          for (const target of targets) segmentVisibility[target] = false;
        } else if (action === "toggle") {
          if (targets.length === 0) {
            ctx.ui.notify("Usage: /claude-powerline segments toggle <segment...>", "info");
            return;
          }
          for (const target of targets) segmentVisibility[target] = !segmentVisibility[target];
        } else {
          ctx.ui.notify("Usage: /claude-powerline segments [list|reset|on|off|toggle] ...", "info");
          return;
        }

        enabled = true;
        const saved = writePersistedConfig(ctx.cwd, {
          enabled,
          theme,
          segments: segmentVisibility,
        });
        if (!saved) {
          ctx.ui.notify("Could not persist claude-powerline settings", "warning");
        }
        applyBar(ctx);
        await refreshBranch();
        maybeRender();
        showSegmentStatus(ctx);
        return;
      } else {
        ctx.ui.notify(
          "Usage: /claude-powerline [on|off|toggle|theme <name>|segments <list|reset|on|off|toggle> ...]",
          "info",
        );
        return;
      }

      if (!ctx.hasUI) return;

      const saved = writePersistedConfig(ctx.cwd, {
        enabled,
        theme,
        segments: segmentVisibility,
      });
      if (!saved) {
        ctx.ui.notify("Could not persist claude-powerline settings", "warning");
      }

      applyBar(ctx);
      await refreshBranch();
      maybeRender();

      if (enabled) {
        ctx.ui.notify(`Claude powerline enabled (${theme})`, "info");
      } else {
        ctx.ui.notify("Claude powerline disabled", "info");
      }
    },
  });
}
