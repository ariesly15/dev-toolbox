import type { UrlParam, UrlParts, ParseResult, ValueType, UrlJsonRepresentation, URLTreeNode } from "@/interface";
function decodeForm(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s;
  }
}

function decodeRaw(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function encodeForm(s: string): string {
  return encodeURIComponent(s).replace(/%20/g, "+");
}

function parseParams(search: string): UrlParam[] {
  const q = search.startsWith("?") ? search.slice(1) : search;
  if (!q) return [];
  return q
    .split("&")
    .filter(Boolean)
    .map((pair) => {
      const eq = pair.indexOf("=");
      const rawKey = eq === -1 ? pair : pair.slice(0, eq);
      const rawVal = eq === -1 ? "" : pair.slice(eq + 1);
      return {
        key: decodeForm(rawKey),
        value: decodeForm(rawVal),
        enabled: true,
      };
    });
}

export function encodeParams(params: UrlParam[]): string {
  return params
    .filter((p) => p && p.enabled !== false && p.key !== "")
    .map((p) => {
      const val = p.value ?? "";
      const compressed = compressJson(val);
      return `${encodeForm(p.key)}=${encodeForm(compressed ?? val)}`;
    })
    .join("&");
}

export function parseUrl(text: string): ParseResult {
  const trimmed = (text || "").trim();
  if (!trimmed) return { status: "empty", parts: null };
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { status: "invalid", parts: null };
  }
  return {
    status: "ok",
    parts: {
      protocol: url.protocol.replace(/:$/, ""),
      username: decodeRaw(url.username),
      password: decodeRaw(url.password),
      hostname: url.hostname,
      port: url.port,
      pathname: decodeRaw(url.pathname),
      hash: decodeRaw(url.hash.replace(/^#/, "")),
      params: parseParams(url.search),
    },
  };
}

export function buildUrl(parts: UrlParts): string | null {
  const scheme = (parts.protocol || "").trim().replace(/:$/, "");
  if (!scheme) return null;
  const hostname = (parts.hostname || "").trim();
  const username = parts.username || "";
  const password = parts.password || "";
  const port = (parts.port || "").trim();
  const pathname = (parts.pathname || "").trim();
  const hash = (parts.hash || "").replace(/^#/, "");
  const search = encodeParams(parts.params || []);

  let out: string;
  if (hostname || username) {
    let auth = "";
    if (username) auth += encodeURIComponent(username);
    if (password) auth += ":" + encodeURIComponent(password);
    if (auth) auth += "@";
    out = `${scheme}://${auth}${hostname}`;
    if (port) out += `:${port}`;
    if (pathname) out += pathname.startsWith("/") ? pathname : "/" + pathname;
  } else {
    out = `${scheme}:${pathname}`;
  }
  if (search) out += "?" + search;
  if (hash) out += "#" + hash;
  return out;
}

export function detectValueType(value: string): ValueType {
  const t = (value || "").trim();
  if (!t) return "plain";

  const maybeObject = t.startsWith("{") && t.endsWith("}");
  const maybeArray = t.startsWith("[") && t.endsWith("]");
  if (maybeObject || maybeArray) {
    try {
      JSON.parse(t);
      return "json";
    } catch {
      /* fallthrough */
    }
  }
  if (/^https?:\/\//i.test(t)) {
    try {
      new URL(t);
      return "url";
    } catch {
      /* fallthrough */
    }
  }
  return "plain";
}

export function prettyJson(value: string): string | null {
  try {
    return JSON.stringify(JSON.parse(value.trim()), null, 2);
  } catch {
    return null;
  }
}

export function compressJson(value: string): string | null {
  try {
    return JSON.stringify(JSON.parse(value.trim()));
  } catch {
    return null;
  }
}

export function toJsonRepresentation(parts: UrlParts): UrlJsonRepresentation {
  const params: Record<string, string | string[]> = {};
  for (const { key, value, enabled } of parts.params) {
    if (enabled === false) continue;
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const prev = params[key];
      params[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
    } else {
      params[key] = value;
    }
  }
  const search = encodeParams(parts.params);
  return {
    href: buildUrl(parts),
    protocol: parts.protocol,
    username: parts.username,
    password: parts.password,
    hostname: parts.hostname,
    port: parts.port,
    pathname: parts.pathname,
    search: search ? "?" + search : "",
    hash: parts.hash ? "#" + parts.hash : "",
    params,
  };
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

// ──── URL 嵌套树 ────

const MAX_DEPTH = 10;

export function buildUrlTree(url: string, depth = 0): URLTreeNode | null {
  if (depth > MAX_DEPTH) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const label = parsed.host + (parsed.pathname !== "/" ? parsed.pathname : "");
  const node: URLTreeNode = { url: trimmed, label, children: [] };

  for (const [key, value] of parsed.searchParams) {
    if (detectValueType(value) === "url") {
      const child = buildUrlTree(value, depth + 1);
      if (child) node.children.push({ paramName: key, node: child });
    }
  }

  return node;
}

export type { UrlParam, UrlParts, PartName, ParseStatus, ParseResult, ValueType, UrlJsonRepresentation, URLTreeNode } from "@/interface";
