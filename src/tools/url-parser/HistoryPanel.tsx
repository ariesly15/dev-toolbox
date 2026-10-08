import { useEffect, useMemo, useRef, useState } from "react";
import type { HistoryEntry } from "@/utils/history";
import { fuzzyMatch, substringMatch } from "@/utils/fuzzy";
import { FuzzyIcon, FunnelIcon, PinIcon } from "@/components/icons";
import CollapsibleCard from "@/components/CollapsibleCard";
import Dropdown from "@/components/Dropdown";
import Input from "@/components/Input";
import { clsx } from "clsx";
import { useT } from "@/i18n";

interface HistoryPanelProps {
  history: HistoryEntry[];
  onLoad: (url: string) => void;
  onDelete: (url: string) => void;
  onNote: (url: string, note: string) => void;
  onPin: (url: string) => void;
  onClear: () => void;
}

/** 历史记录过滤项定义：available 决定该项是否出现，test 判断单条记录是否命中 */
interface FilterDef {
  id: string;
  label: string;
  available: boolean;
  test: (entry: HistoryEntry) => boolean;
}

function formatTime(ts: number, t: (key: string, ...args: any[]) => string): string {
  const d = new Date(ts);
  const now = new Date();
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (d.toDateString() === now.toDateString()) return hm;
  return t("history-panel.date-with-day", { month: d.getMonth() + 1, date: d.getDate(), hm });
}

// 按命中下标把 text 拆成「命中/未命中」片段，命中片段用 <mark> 高亮（支持模糊匹配的非连续命中）
function HighlightText({ text, hits }: { text: string; hits: number[] }) {
  if (hits.length === 0) return <>{text}</>;
  const marked = new Set(hits);
  const segments: Array<{ text: string; hit: boolean }> = [];
  for (let i = 0; i < text.length; i++) {
    const hit = marked.has(i);
    const last = segments[segments.length - 1];
    if (last && last.hit === hit) last.text += text[i];
    else segments.push({ text: text[i], hit });
  }
  return (
    <>
      {segments.map((seg, i) =>
        seg.hit ? (
          <mark key={i} className="history-mark">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

// 域名柔和色板 —— 基于 hostname hash 取色，相同域名始终同色
const DOMAIN_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
];

function domainColor(hostname: string): string {
  let hash = 0;
  for (let i = 0; i < hostname.length; i++) {
    hash = (hash * 31 + hostname.charCodeAt(i)) | 0;
  }
  return DOMAIN_COLORS[Math.abs(hash) % DOMAIN_COLORS.length];
}

// 把完整 URL 的搜索命中下标拆分到 hostname / pathname 两段
function segmentUrlHits(
  url: string,
  hits: number[],
): { hostname: string; pathname: string; hostStart: number; pathStart: number; hostHits: number[]; pathHits: number[] } {
  try {
    const parsed = new URL(url);
    const hostStart = url.indexOf(parsed.hostname);
    const pathStart = hostStart + parsed.hostname.length + parsed.port.length + (parsed.port ? 1 : 0);
    const pathname = parsed.pathname === "/" ? "" : parsed.pathname;
    return {
      hostname: parsed.hostname,
      pathname,
      hostStart,
      pathStart,
      hostHits: hits.filter((i) => i >= hostStart && i < hostStart + parsed.hostname.length).map((i) => i - hostStart),
      pathHits: hits.filter((i) => i >= pathStart && i < pathStart + pathname.length).map((i) => i - pathStart),
    };
  } catch {
    return { hostname: url, pathname: "", hostStart: 0, pathStart: url.length, hostHits: hits, pathHits: [] };
  }
}

interface HistoryRowProps {
  entry: HistoryEntry;
  hits: number[];
  onLoad: (url: string) => void;
  onDelete: (url: string) => void;
  onNote: (url: string, note: string) => void;
  onPin: (url: string) => void;
  enhancedView: boolean;
}
function HistoryRow(props: HistoryRowProps) {
  const { entry, hits, onLoad, onDelete, onNote, onPin, enhancedView } = props;
  const t = useT();
  const [noteDraft, setNoteDraft] = useState<string | null>(null);

  const urlParts = useMemo(() => segmentUrlHits(entry.url, hits), [entry.url, hits]);
  const borderColor = useMemo(() => domainColor(urlParts.hostname), [urlParts.hostname]);

  const commitNote = () => {
    if (noteDraft === null) return;
    onNote(entry.url, noteDraft);
    setNoteDraft(null);
  };

  // 备注三态：编辑中 → 输入框；已有备注 → 可点击标签；无备注 → 添加按钮
  const renderNote = () => {
    if (noteDraft !== null) {
      return (
        <Input
          wrapperClassName="history-note-wrap"
          value={noteDraft}
          placeholder={t("history-panel.note-placeholder")}
          maxLength={100}
          autoFocus
          onChange={setNoteDraft}
          onBlur={commitNote}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitNote();
            if (e.key === "Escape") setNoteDraft(null);
          }}
        />
      );
    }
    if (entry.note) {
      return (
        <button
          className="history-note-tag"
          title={t("history-panel.note-title", { note: entry.note })}
          onClick={() => setNoteDraft(entry.note || "")}
        >
          {entry.note}
        </button>
      );
    }
    return (
      <button className="history-note-add" title={t("history-panel.add-note-title")} onClick={() => setNoteDraft("")}>
        {t("history-panel.add-note")}
      </button>
    );
  };

  return (
    <div
      className={clsx("history-item", entry.pinned && "history-item-pinned")}
      style={enhancedView ? ({ "--domain-color": borderColor } as React.CSSProperties) : undefined}
    >
      <button
        className={clsx("history-pin", entry.pinned && "active")}
        title={entry.pinned ? t("history-panel.unpin") : t("history-panel.pin")}
        onClick={() => onPin(entry.url)}
      >
        <PinIcon filled={entry.pinned} />
      </button>
      <div className="history-main">
        {renderNote()}
        <button className="history-url" title={entry.url} onClick={() => onLoad(entry.url)}>
          {enhancedView ? (
            <>
              <span className="history-url-host">
                <HighlightText text={urlParts.hostname} hits={urlParts.hostHits} />
              </span>
              {urlParts.pathname && (
                <span className="history-url-path">
                  <HighlightText text={urlParts.pathname} hits={urlParts.pathHits} />
                </span>
              )}
            </>
          ) : (
            <span className="history-url-compact">
              <HighlightText text={entry.url} hits={hits} />
            </span>
          )}
        </button>
      </div>
      <span className="history-time">{formatTime(entry.ts, t)}</span>
      <button className="btn-icon" title={t("history-panel.delete-entry")} onClick={() => onDelete(entry.url)}>
        ✕
      </button>
    </div>
  );
}

export default function HistoryPanel(props: HistoryPanelProps) {
  const { history, onLoad, onDelete, onNote, onPin, onClear } = props;
  const t = useT();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [fuzzyEnabled, setFuzzyEnabled] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [enhancedView, setEnhancedView] = useState(() => localStorage.getItem("dev-toolbox:history-enhanced") !== "false");
  const filterTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const pinnedCount = history.filter((h) => h.pinned).length;
  const notedCount = history.filter((h) => h.note && h.note.trim()).length;

  // 过滤项配置：后续新增过滤条件，只需在此数组追加一项（id / label / available / test）
  const filterDefs: FilterDef[] = [
    {
      id: "noted",
      label: t("history-panel.filter-only-noted"),
      available: notedCount > 0,
      test: (entry) => !!(entry.note && entry.note.trim()),
    },
  ];

  const availableFilters = filterDefs.filter((d) => d.available);
  const appliedFilters = availableFilters.filter((d) => activeFilters.includes(d.id));
  const keyword = query.trim();
  // 匹配模式：默认连续子串；开启模糊后按子序列匹配（如 "pp" 命中 "person p"）。两者均返回命中下标用于高亮
  const match = fuzzyEnabled ? fuzzyMatch : substringMatch;
  const visibleHistory = history.flatMap((entry) => {
    const hits = match(keyword, entry.url);
    if (hits === null) return [];
    if (!appliedFilters.every((d) => d.test(entry))) return [];
    return [{ entry, hits }];
  });

  // 过滤项失效时（如备注被全部删除）取消其勾选，避免日后意外恢复过滤
  useEffect(() => {
    if (notedCount > 0) return;
    setActiveFilters((prev) => (prev.includes("noted") ? prev.filter((id) => id !== "noted") : prev));
  }, [notedCount]);

  useEffect(() => {
    localStorage.setItem("dev-toolbox:history-enhanced", String(enhancedView));
  }, [enhancedView]);

  // 进入「确认清空」态后 3 秒未再次点击则自动回退，避免清空按钮长期停留在危险态
  useEffect(() => {
    if (!confirmingClear) return;
    const timer = setTimeout(() => setConfirmingClear(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmingClear]);

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleClear = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.stopPropagation();
    if (confirmingClear) {
      setConfirmingClear(false);
      onClear();
    } else {
      setConfirmingClear(true);
    }
  };

  const renderHistory = () => {
    if (visibleHistory.length > 0) {
      return (
        <div className="history-list">
          {visibleHistory.map(({ entry, hits }) => (
            <HistoryRow
              key={entry.url}
              entry={entry}
              hits={hits}
              onLoad={onLoad}
              onDelete={onDelete}
              onNote={onNote}
              onPin={onPin}
              enhancedView={enhancedView}
            />
          ))}
        </div>
      );
    }

    if (keyword || appliedFilters.length > 0) {
      return <p className="history-empty">{t("history-panel.no-match")}</p>;
    }

    return <p className="history-empty">{t("history-panel.empty")}</p>;
  };

  const renderCollapsedSub = () => {
    if (history.length === 0) return null;

    return (
      <span className="card-sub">
        {t("history-panel.count", { n: history.length })}
        {pinnedCount > 0 ? t("history-panel.pinned-suffix", { n: pinnedCount }) : ""}
      </span>
    );
  };

  const renderActions = (collapsed: boolean) => {
    if (history.length === 0) return null;

    return (
      <div className="history-actions">
        {!collapsed && (
          <Input
            wrapperClassName="history-search-wrap"
            value={query}
            onChange={setQuery}
            placeholder={t("history-panel.search-placeholder")}
            title={fuzzyEnabled ? t("history-panel.search-title-fuzzy") : t("history-panel.search-title-exact")}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            addons={
              <button
                type="button"
                className={clsx("history-fuzzy-btn", fuzzyEnabled && "active")}
                title={fuzzyEnabled ? t("history-panel.fuzzy-title-on") : t("history-panel.fuzzy-title-off")}
                aria-pressed={fuzzyEnabled}
                onClick={() => setFuzzyEnabled((v) => !v)}
              >
                <FuzzyIcon />
              </button>
            }
          />
        )}
        {!collapsed && availableFilters.length > 0 && (
          <div
            className="history-filter-wrap"
            onMouseEnter={() => {
              clearTimeout(filterTimer.current);
              setFilterOpen(true);
            }}
            onMouseLeave={() => {
              filterTimer.current = setTimeout(() => setFilterOpen(false), 120);
            }}
          >
            <Dropdown
              mode="multi"
              items={availableFilters.map((d) => ({
                id: d.id,
                label: d.label,
                checked: activeFilters.includes(d.id),
              }))}
              onToggle={toggleFilter}
              label={t("history-panel.filter-label", { n: appliedFilters.length })}
              active={appliedFilters.length > 0}
              triggerPrefix={<FunnelIcon />}
              triggerClassName="dropdown-trigger-nav"
              title={t("history-panel.filter-title")}
              triggerShape="circle"
              align="right"
              open={filterOpen}
              onOpenChange={setFilterOpen}
              portal={false}
            />
          </div>
        )}
        {!collapsed && (
          <button
            type="button"
            className={clsx("history-fuzzy-btn", enhancedView && "active")}
            title={enhancedView ? t("history-panel.enhanced-view-on") : t("history-panel.enhanced-view-off")}
            aria-pressed={enhancedView}
            onClick={() => setEnhancedView((v) => !v)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="5" y1="3.5" x2="12.5" y2="3.5" />
              <line x1="5" y1="7" x2="12.5" y2="7" />
              <line x1="5" y1="10.5" x2="12.5" y2="10.5" />
              <circle cx="2.5" cy="3.5" r="0.8" fill="currentColor" stroke="none" />
              <circle cx="2.5" cy="7" r="0.8" fill="currentColor" stroke="none" />
              <circle cx="2.5" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
            </svg>
          </button>
        )}
        <button
          className={clsx("btn btn-ghost history-clear", confirmingClear && "history-clear-confirm")}
          onClick={handleClear}
        >
          {confirmingClear ? t("history-panel.confirm-clear") : t("common.clear")}
        </button>
      </div>
    );
  };

  return (
    <CollapsibleCard
      title={t("history-panel.title")}
      className="history-card"
      defaultCollapsed={true}
      collapsedSubtitle={renderCollapsedSub()}
      subtitle={<span className="card-sub">{t("history-panel.subtitle")}</span>}
      actions={renderActions}
      onCollapsedChange={(collapsed) => {
        if (collapsed) {
          setQuery("");
          setConfirmingClear(false);
        }
      }}
    >
      {renderHistory()}
    </CollapsibleCard>
  );
}
