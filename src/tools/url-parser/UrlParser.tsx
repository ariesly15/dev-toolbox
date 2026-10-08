import { useState, useImperativeHandle, forwardRef, useMemo, useEffect, useRef } from "react";
import { parseUrl, buildUrl, toJsonRepresentation, copyText, buildUrlTree } from "@/utils/url";
import type {
  UrlParts,
  PartName,
  ParseStatus,
  URLTreeNode,
  HistoryEntry,
  CustomQuery,
  UrlParserProps,
  UrlParserHandle,
} from "@/interface";
import {
  loadHistory,
  saveHistory,
  sortEntries,
  HISTORY_LIMIT,
  loadCustomQueries,
  saveCustomQueries,
} from "@/utils/history";
import PartFields from "@/tools/url-parser/PartFields";
import ParamsTable from "@/tools/url-parser/ParamsTable";
import QrPanel from "@/tools/url-parser/QrPanel";
import HistoryPanel from "@/tools/url-parser/HistoryPanel";
import CustomQueryPanel from "@/tools/url-parser/CustomQueryPanel";
import URLTreeView, { URLBreadcrumb } from "@/tools/url-parser/URLTreeView";
import { assignTags } from "@/tools/url-parser/URLTreeView";
import { GearIcon } from "@/components/icons";
import { EXAMPLE_URL } from "@/utils/const";
import CollapsibleCard from "@/components/CollapsibleCard";
import ToggleSwitch from "@/components/Switch";
import Input from "@/components/Input";
import { useT } from "@/i18n";

type CopiedKind = "url" | "json" | null;
type IField = "key" | "value";

const UrlParser = forwardRef<UrlParserHandle, UrlParserProps>(function UrlParser(_props, ref) {
  const t = useT();
  const [input, setInput] = useState("");
  const [parts, setParts] = useState<UrlParts | null>(null);
  const [status, setStatus] = useState<ParseStatus>("empty");
  const [copied, setCopied] = useState<CopiedKind>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [customQueries, setCustomQueries] = useState<CustomQuery[]>(loadCustomQueries);
  const [customVisible, setCustomVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTreePath, setActiveTreePath] = useState<number[]>([]);
  const [treeRootUrl, setTreeRootUrl] = useState("");
  const isTreeNav = useRef(false);

  const syncCustomQueryValues = (parsed: UrlParts): UrlParts => {
    if (customQueries.length === 0) return parsed;
    const keyMap = new Map(customQueries.map((q) => [q.key, q.id]));

    // 将解析到的值同步到匹配的自定义参数
    const updates: Record<string, string> = {};
    for (const p of parsed.params) {
      const id = keyMap.get(p.key);
      if (id) updates[id] = p.value;
    }
    if (Object.keys(updates).length > 0) {
      setCustomQueries((prev) => {
        const next = prev.map((q) =>
          updates[q.id] !== undefined ? { ...q, value: updates[q.id] } : q,
        );
        saveCustomQueries(next);
        return next;
      });
    }

    return parsed;
  };

  const applyText = (text: string) => {
    setInput(text);
    const r = parseUrl(text);
    setStatus(r.status);
    if (r.status === "ok" && r.parts) setParts(syncCustomQueryValues(r.parts));
    else if (r.status === "empty") setParts(null);
  };

  // URL 嵌套树：基于原始根 URL 构建，树内导航时不重建
  const urlTree = useMemo(() => {
    if (!treeRootUrl.trim()) return null;
    const tree = buildUrlTree(treeRootUrl);
    return tree && tree.children.length > 0 ? tree : null;
  }, [treeRootUrl]);

  // 树节点标签（深度优先序号）
  const treeTags = useMemo(() => (urlTree ? assignTags(urlTree) : null), [urlTree]);

  // 用户输入变化时重置树根（树内导航通过 ref 标记跳过）
  useEffect(() => {
    if (isTreeNav.current) {
      isTreeNav.current = false;
      return;
    }
    setTreeRootUrl(input);
    setActiveTreePath([]);
  }, [input]);

  const navigateToNode = (path: number[]) => {
    if (!urlTree) return;
    let current = urlTree;
    for (const idx of path) {
      if (idx >= current.children.length) return;
      current = current.children[idx].node;
    }
    isTreeNav.current = true;
    setActiveTreePath(path);
    applyText(current.url);
  };

  const addHistory = (url: string, fromHistory = false) => {
    const trimmed = url.trim();
    if (!trimmed || parseUrl(trimmed).status !== "ok") return;
    setHistory((prev) => {
      const existing = prev.find((h) => h.url === trimmed);
      const next = sortEntries([
        {
          url: trimmed,
          ts: fromHistory && existing ? existing.ts : Date.now(),
          note: existing?.note,
          pinned: existing?.pinned,
        },
        ...prev.filter((h) => h.url !== trimmed),
      ]).slice(0, HISTORY_LIMIT);
      saveHistory(next);
      return next;
    });
  };

  // 在树中查找 URL 对应的路径，找到返回路径数组，未找到返回 null
  const findPathInTree = (
    tree: URLTreeNode,
    targetUrl: string,
    currentPath: number[] = [],
  ): number[] | null => {
    if (tree.url === targetUrl) return currentPath;
    for (let i = 0; i < tree.children.length; i++) {
      const result = findPathInTree(tree.children[i].node, targetUrl, [...currentPath, i]);
      if (result) return result;
    }
    return null;
  };

  // addToHistory=false 时仅加载 URL 而不写入历史记录（如表格行内的「解析」）
  // fromHistory=true 时保留原时间戳（从历史面板点击加载）
  const handleLoadUrl = (url: string, opts?: { addToHistory?: boolean; fromHistory?: boolean }) => {
    const trimmed = url.trim();
    const addToHistory = opts?.addToHistory ?? true;
    const fromHistory = opts?.fromHistory ?? false;
    // 如果 URL 在当前树中，走树内导航（不重建树）
    if (urlTree) {
      const path = findPathInTree(urlTree, trimmed);
      if (path) {
        isTreeNav.current = true;
        setActiveTreePath(path);
        applyText(trimmed);
        if (addToHistory) addHistory(trimmed, fromHistory);
        return;
      }
    }
    // 外部加载：替换 URL 并重建树
    applyText(trimmed);
    if (addToHistory) addHistory(trimmed, fromHistory);
    setActiveTreePath([]);
  };

  // 表格行内「解析」参数值中的 URL：加载但不进入历史记录
  const handleParseParamUrl = (url: string) => handleLoadUrl(url, { addToHistory: false });

  // 暴露 loadUrl 给父组件（跨工具跳转）
  useImperativeHandle(ref, () => ({ loadUrl: handleLoadUrl }), []);

  const handleHistoryDelete = (url: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.url !== url);
      saveHistory(next);
      return next;
    });
  };

  const handleHistoryNote = (url: string, note: string) => {
    setHistory((prev) => {
      const next = prev.map((h) => (h.url === url ? { ...h, note: note.trim() || undefined } : h));
      saveHistory(next);
      return next;
    });
  };

  const handleHistoryPin = (url: string) => {
    setHistory((prev) => {
      const next = sortEntries(prev.map((h) => (h.url === url ? { ...h, pinned: !h.pinned } : h)));
      saveHistory(next);
      return next;
    });
  };

  const handleHistoryClear = () => {
    setHistory([]);
    saveHistory([]);
  };

  const mergeCustomQueries = (nextParts: UrlParts, queries: CustomQuery[]): UrlParts => {
    // 只过滤启用状态的自定义参数 key
    const enabledQueries = queries.filter((q) => q.enabled !== false);
    let params = nextParts.params.filter((p) => !enabledQueries.some((q) => q.key === p.key));
    for (const q of enabledQueries) {
      if (q.key && q.value) {
        params = [...params, { key: q.key, value: q.value, enabled: true }];
      }
    }
    return { ...nextParts, params };
  };

  const syncUrl = (currentParts: UrlParts) => {
    const queries = customVisible ? customQueries : [];
    const merged = mergeCustomQueries(currentParts, queries);
    const built = buildUrl(merged);
    if (built) {
      setInput(built);
      setStatus(parseUrl(built).status);
      return;
    }
    setStatus("invalid");
  };

  const updateParts = (next: UrlParts) => {
    setParts(next);
    syncUrl(next);
  };

  const handleFieldChange = (name: PartName, value: string) => {
    if (!parts) return;
    updateParts({ ...parts, [name]: value });
  };

  const handleParamChange = (idx: number, field: IField, v: string) => {
    if (!parts) return;
    const params = parts.params.map((p, i) => {
      return i === idx ? { ...p, [field]: v } : p;
    });
    updateParts({ ...parts, params });
  };

  const handleParamToggle = (index: number, enabled: boolean) => {
    if (!parts) return;
    const params = parts.params.map((p, i) => {
      return i === index ? { ...p, enabled } : p;
    });
    updateParts({ ...parts, params });
  };

  const allEnabled = parts
    ? parts.params.length > 0 && parts.params.every((p) => p.enabled)
    : false;
  const someEnabled = parts ? parts.params.some((p) => p.enabled) : false;

  const handleToggleAll = () => {
    if (!parts) return;
    const enabled = !allEnabled;
    const params = parts.params.map((p) => ({ ...p, enabled }));
    updateParts({ ...parts, params });
  };

  const handleParamDelete = (index: number) => {
    if (!parts) return;
    updateParts({
      ...parts,
      params: parts.params.filter((_, i) => i !== index),
    });
  };

  const handleParamAdd = () => {
    updateParts({
      protocol: "https",
      username: "",
      password: "",
      hostname: "",
      port: "",
      pathname: "",
      hash: "",
      ...(parts || {}),
      params: [...(parts?.params || []), { key: "", value: "", enabled: true }],
    });
  };

  const handleParamEncode = (idx: number) => {
    if (!parts) return;
    const params = parts.params.map((p, i) =>
      i === idx ? { ...p, value: encodeURIComponent(p.value) } : p,
    );
    updateParts({ ...parts, params });
  };

  const handleParamDecode = (idx: number) => {
    if (!parts) return;
    const params = parts.params.map((p, i) => {
      if (i !== idx) return p;
      try {
        return { ...p, value: decodeURIComponent(p.value) };
      } catch {
        return p;
      }
    });
    updateParts({ ...parts, params });
  };

  const handleEncodeAll = () => {
    if (!parts) return;
    const params = parts.params.map((p) => ({ ...p, value: encodeURIComponent(p.value) }));
    updateParts({ ...parts, params });
  };

  const handleDecodeAll = () => {
    if (!parts) return;
    const params = parts.params.map((p) => {
      try {
        return { ...p, value: decodeURIComponent(p.value) };
      } catch {
        return p;
      }
    });
    updateParts({ ...parts, params });
  };

  const handleSort = () => {
    if (!parts) return;
    const sorted = [...parts.params].sort((a, b) => a.key.localeCompare(b.key));
    updateParts({ ...parts, params: sorted });
  };

  const handleExport = async () => {
    if (!parts) return;
    const data = parts.params
      .filter((p) => p.enabled !== false)
      .map((p) => ({ key: p.key, value: p.value }));
    await copyText(JSON.stringify(data, null, 2));
  };

  const handleImport = (json: string): boolean => {
    if (!parts) return false;
    try {
      const data = JSON.parse(json);
      if (!Array.isArray(data)) return false;
      const newParams = data
        .filter((d: any) => typeof d.key === "string")
        .map((d: any) => ({
          key: String(d.key),
          value: String(d.value ?? ""),
          enabled: d.enabled !== false,
        }));
      if (newParams.length === 0) return false;
      updateParts({ ...parts, params: [...parts.params, ...newParams] });
      return true;
    } catch {
      return false;
    }
  };

  const stringJson = (parts: UrlParts) => {
    return JSON.stringify(toJsonRepresentation(parts), null, 2);
  };

  const handleCopy = async (kind: Exclude<CopiedKind, null>) => {
    if (!parts) return;

    const isUrl = kind === "url";
    const text = isUrl ? input : stringJson(parts);
    const ok = await copyText(text);
    if (ok) {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    }
  };

  const handleCustomQueryChange = (id: string, value: string) => {
    setCustomQueries((prev) => {
      const next = prev.map((q) => (q.id === id ? { ...q, value } : q));
      saveCustomQueries(next);
      if (parts && customVisible) {
        const merged = mergeCustomQueries(parts, next);
        const built = buildUrl(merged);
        if (built != null) {
          setInput(built);
          setStatus(parseUrl(built).status);
        }
      }
      return next;
    });
  };

  const handleToggleCustomVisible = (visible: boolean) => {
    setCustomVisible(visible);
    if (parts) {
      const queries = visible ? customQueries : [];
      const merged = mergeCustomQueries(parts, queries);
      const built = buildUrl(merged);
      if (built != null) {
        setInput(built);
        setStatus(parseUrl(built).status);
      }
    }
  };

  const handleCustomQueryToggle = (id: string, enabled: boolean) => {
    setCustomQueries((prev) => {
      const next = prev.map((q) => (q.id === id ? { ...q, enabled } : q));
      saveCustomQueries(next);
      if (parts && customVisible) {
        const merged = mergeCustomQueries(parts, next);
        const built = buildUrl(merged);
        if (built != null) {
          setInput(built);
          setStatus(parseUrl(built).status);
        }
      }
      return next;
    });
  };

  const handleSaveCustomQueries = (queries: CustomQuery[]) => {
    setCustomQueries(queries);
    saveCustomQueries(queries);
    if (parts) {
      const activeQueries = customVisible ? queries : [];
      const merged = mergeCustomQueries(parts, activeQueries);
      const built = buildUrl(merged);
      if (built != null) {
        setInput(built);
        setStatus(parseUrl(built).status);
      }
    }
  };

  const qrUrl = status === "ok" ? input.trim() : null;

  const renderResult = () => {
    if (!parts) {
      return <section className="card empty-card">{t("url-parser.empty")}</section>;
    }
    return (
      <div className="tool-layout">
        <div className="tool-main">
          {/* URL 嵌套树 */}
          {urlTree && treeTags && (
            <CollapsibleCard
              title={t("url-parser.url-chain-title")}
              defaultCollapsed={false}
              subtitle={
                <URLBreadcrumb
                  root={urlTree}
                  activePath={activeTreePath}
                  onSelect={navigateToNode}
                  tags={treeTags}
                />
              }
            >
              <URLTreeView
                root={urlTree}
                activePath={activeTreePath}
                onSelect={navigateToNode}
                tags={treeTags}
              />
            </CollapsibleCard>
          )}

          {/* URL 组成部分编辑 */}
          <CollapsibleCard title={t("url-parser.parts-title")} defaultCollapsed={true}>
            <PartFields parts={parts} onChange={handleFieldChange} />
          </CollapsibleCard>

          {/* 查询参数表格 */}
          <section className="card">
            <h2 className="card-title">
              {t("url-parser.params-title")}
              <span className="card-sub">{t("url-parser.params-subtitle")}</span>
              <span className="card-title-actions">
                {customQueries.length > 0 && (
                  <ToggleSwitch
                    checked={customVisible}
                    onChange={handleToggleCustomVisible}
                    title={
                      customVisible
                        ? t("url-parser.hide-custom-params")
                        : t("url-parser.show-custom-params")
                    }
                  />
                )}
                <button
                  className="btn-icon settings-btn"
                  title={t("url-parser.custom-params-settings")}
                  onClick={() => setSettingsOpen(true)}
                >
                  <GearIcon />
                </button>
              </span>
            </h2>
            <ParamsTable
              params={parts.params}
              onChange={handleParamChange}
              onToggle={handleParamToggle}
              onToggleAll={handleToggleAll}
              allEnabled={allEnabled}
              someEnabled={someEnabled}
              onDelete={handleParamDelete}
              onAdd={handleParamAdd}
              onEncode={handleParamEncode}
              onDecode={handleParamDecode}
              onEncodeAll={handleEncodeAll}
              onDecodeAll={handleDecodeAll}
              onSort={handleSort}
              onExport={handleExport}
              onImport={handleImport}
              onLoadUrl={handleParseParamUrl}
              customQueries={customQueries}
              customVisible={customVisible}
              onCustomQueryChange={handleCustomQueryChange}
              onCustomQueryToggle={handleCustomQueryToggle}
            />
          </section>
        </div>
        {/* 二维码面板 */}
        <aside className="tool-side">
          <QrPanel url={qrUrl} />
        </aside>
      </div>
    );
  };

  return (
    <div className="url-parser">
      {/* URL 输入 */}
      <section className="card">
        <Input
          wrapperClassName="url-input-wrap"
          value={input}
          placeholder={t("url-parser.input-placeholder")}
          onChange={applyText}
          onKeyDown={(e) => {
            if (e.key === "Enter") addHistory(input);
          }}
          onBlur={() => addHistory(input)}
          clearable
          spellCheck={false}
          autoComplete="off"
        />
        <div className="toolbar">
          <button className="btn" onClick={() => handleCopy("url")} disabled={!parts}>
            {t("url-parser.copy-url")}
          </button>
          <button className="btn" onClick={() => handleCopy("json")} disabled={!parts}>
            {t("url-parser.copy-json")}
          </button>
          <button className="btn btn-ghost" onClick={() => applyText("")} disabled={!input}>
            {t("common.clear")}
          </button>
          {copied && (
            <span className="copied-tip">
              {copied === "url" ? t("url-parser.copied-url") : t("url-parser.copied-json")}
            </span>
          )}
          <button className="btn btn-right" onClick={() => applyText(EXAMPLE_URL)}>
            {t("common.sample")}
          </button>
        </div>
        {status === "invalid" && (
          <div className="banner banner-warning">{t("url-parser.invalid-banner")}</div>
        )}
      </section>

      {/* 历史记录 */}
      <HistoryPanel
        history={history}
        onLoad={(url) => handleLoadUrl(url, { fromHistory: true })}
        onDelete={handleHistoryDelete}
        onNote={handleHistoryNote}
        onPin={handleHistoryPin}
        onClear={handleHistoryClear}
      />

      {/* 解析结果 */}
      {renderResult()}

      {/* 自定义参数设置面板 */}
      {settingsOpen && (
        <CustomQueryPanel
          queries={customQueries}
          onSave={handleSaveCustomQueries}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
});

export default UrlParser;

export type { CustomQueryType, CustomQuery, UrlParserHandle } from "@/interface";
