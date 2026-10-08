import { useState, useMemo, useCallback } from "react";
import { useT } from "@/i18n";
import Input from "@/components/Input";
import Dropdown from "@/components/Dropdown";
import type { DropdownItem } from "@/interface";
import "./styles.css";

interface RxPreset {
  id: string;
  pattern: string;
  flags: string;
}

const FLAG_LIST = ["g", "m", "i", "s", "x", "u", "U"] as const;

const PRESETS: RxPreset[] = [
  { id: "email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", flags: "g" },
  { id: "url", pattern: "https?://[^\\s]+", flags: "gi" },
  {
    id: "ipv4",
    // prettier-ignore
    pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\b",
    flags: "g",
  },
  { id: "phone", pattern: "1[3-9]\\d{9}", flags: "g" },
  { id: "date-iso", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", flags: "g" },
  { id: "hex-color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "g" },
];

// prettier-ignore
const SAMPLE_TEXT = "联系邮箱：dev@example.com，备用 admin@test.org 和 http://example.com\n服务器 IP：192.168.1.100 和 10.0.0.1\n手机号：13812345678\n日期：2025-01-15、2024-12-31\n颜色：#ff0、#336699";

function formatMs(ms: number): string {
  return ms < 1 ? `${(ms * 1000).toFixed(0)} μs` : `${ms.toFixed(2)} ms`;
}

/** 交替高亮颜色（CSS 变量 --rx-hl-n） */
const HL_COLORS = 6;

export default function RegexTester() {
  const t = useT();
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testText, setTestText] = useState("");
  const [replacement, setReplacement] = useState("");
  const [showReplace, setShowReplace] = useState(false);

  const isPatternEmpty = pattern.length === 0;
  const isTestEmpty = testText.length === 0;

  // 构建正则 + 执行匹配
  const { regex, matches, error, elapsed } = useMemo(() => {
    if (isPatternEmpty || isTestEmpty) return { regex: null, matches: [], error: null, elapsed: 0 };
    try {
      const regex = new RegExp(pattern, flags.includes("g") ? flags : `g${flags}`);
      const start = performance.now();
      const matches = [...testText.matchAll(regex)];
      const elapsed = performance.now() - start;
      return { regex, matches, error: null, elapsed };
    } catch (e) {
      return { regex: null, matches: [], error: (e as Error).message, elapsed: 0 };
    }
  }, [pattern, flags, testText, isPatternEmpty, isTestEmpty]);

  // 替换结果
  const replaceResult = useMemo(() => {
    if (!regex || !testText || !showReplace) return null;
    try {
      return testText.replace(regex, replacement);
    } catch {
      return null;
    }
  }, [regex, testText, replacement, showReplace]);

  const toggleFlag = useCallback(
    (f: string) => setFlags((prev) => (prev.includes(f) ? prev.replace(f, "") : prev + f)),
    [],
  );

  const presetItems: DropdownItem[] = [
    { id: "_", label: t("regex-tester.preset-placeholder") },
    ...PRESETS.map((p) => ({ id: p.id, label: t(`regex-preset.${p.id}`) })),
  ];

  const handlePreset = useCallback((id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (preset) {
      setPattern(preset.pattern);
      setFlags(preset.flags);
    }
  }, []);

  const handleClear = useCallback(() => {
    setPattern("");
    setTestText("");
    setReplacement("");
    setShowReplace(false);
  }, []);

  // 高亮渲染（带交替颜色）
  const renderHighlighted = useCallback(() => {
    if (!matches.length || !testText) {
      return <span className="rx-placeholder">{t("regex-tester.text-placeholder")}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIdx = 0;

    matches.forEach((m, i) => {
      const start = m.index!;
      const end = start + m[0].length;
      if (start === end) {
        if (start > lastIdx)
          parts.push(<span key={`t${i}`}>{testText.slice(lastIdx, start)}</span>);
        parts.push(
          <mark key={`m${i}`} className="rx-hl rx-hl-zero">
            |
          </mark>,
        );
        lastIdx = start;
        return;
      }
      if (start > lastIdx) parts.push(<span key={`t${i}`}>{testText.slice(lastIdx, start)}</span>);
      parts.push(
        <mark key={`m${i}`} className={`rx-hl rx-c${i % HL_COLORS}`}>
          {m[0]}
        </mark>,
      );
      lastIdx = end;
    });

    if (lastIdx < testText.length) parts.push(<span key="tail">{testText.slice(lastIdx)}</span>);
    return <>{parts}</>;
  }, [matches, testText, t]);

  // 捕获组数据
  const groupData = useMemo(() => {
    if (!matches.length) return null;
    const rows = matches.map((m) => ({
      match: m[0],
      groups: [...m].slice(1).map((g) => g ?? ""),
      named: m.groups ? Object.entries(m.groups).filter(([, v]) => v !== undefined) : [],
    }));
    const maxGroups = Math.max(...rows.map((r) => r.groups.length), 0);
    if (maxGroups === 0 && rows.every((r) => r.named.length === 0)) return null;
    return { rows, maxGroups };
  }, [matches]);

  return (
    <div className="regex-tester">
      {/* ──── 正则输入（全宽） ──── */}
      <section className="card rx-pattern-card">
        <Input
          wrapperClassName="rx-pattern-wrap"
          className="rx-pattern-field"
          value={pattern}
          onChange={setPattern}
          placeholder={t("regex-tester.pattern-placeholder")}
          prefix={<span className="rx-slash-prefix">/</span>}
          clearable={false}
          addons={
            <Dropdown
              mode="multi"
              items={FLAG_LIST.map((f) => ({
                id: f,
                label: t(`regex-tester.flag-${f}`),
                checked: flags.includes(f),
              }))}
              onToggle={toggleFlag}
              label={
                <span className="rx-flag-badges">
                  {flags || <span className="rx-flag-none">—</span>}
                </span>
              }
              active={flags.length > 0}
              triggerPrefix={<span className="rx-flag-icon">ƒ</span>}
              triggerClassName="rx-flag-trigger"
              align="right"
              portal={false}
              minWidth={240}
              maxHeight={400}
            />
          }
        />

        {/* 替换行 */}
        {showReplace && (
          <Input
            wrapperClassName="rx-replace-wrap"
            value={replacement}
            onChange={setReplacement}
            placeholder={t("regex-tester.replace-placeholder")}
            prefix={<span className="rx-replace-icon">↩</span>}
            clearable={false}
          />
        )}

        {/* 工具栏 */}
        <div className="toolbar">
          <label className="rx-replace-toggle">
            <input
              type="checkbox"
              checked={showReplace}
              onChange={(e) => setShowReplace(e.target.checked)}
            />
            <span>{t("regex-tester.replace-toggle")}</span>
          </label>
          <button
            className="btn btn-ghost"
            onClick={handleClear}
            disabled={isPatternEmpty && isTestEmpty}
          >
            {t("common.clear")}
          </button>
          <Dropdown items={presetItems} value="_" onChange={handlePreset} triggerClassName="btn" />
          <button className="btn btn-right" onClick={() => setTestText(SAMPLE_TEXT)}>
            {t("common.sample")}
          </button>
        </div>
        {error && <div className="banner banner-warning">{error}</div>}
      </section>

      {/* ──── 双栏：测试文本 + 匹配详情 ──── */}
      <div className="rx-layout">
        {/* 左：高亮文本 */}
        <section className="card rx-editor">
          <pre className="rx-editor-pre">{renderHighlighted()}</pre>
          {/* 输入层：透明 textarea 叠在高亮上方 */}
          <textarea
            className="rx-editor-input"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder=""
            spellCheck={false}
            autoComplete="off"
          />
        </section>

        {/* 右：详情侧栏 */}
        <aside className="rx-sidebar">
          {/* 统计 */}
          <div className="rx-side-section">
            <div className="rx-side-title">
              {matches.length > 0
                ? t("regex-tester.match-stats", { n: matches.length, time: formatMs(elapsed) })
                : isPatternEmpty || isTestEmpty
                  ? "—"
                  : error
                    ? t("regex-tester.no-match")
                    : t("regex-tester.match-count", { n: 0 })}
            </div>
          </div>

          {/* 匹配列表 */}
          {matches.length > 0 && (
            <div className="rx-side-section">
              <div className="rx-side-title">{t("regex-tester.match-title")}</div>
              <div className="rx-match-list">
                {matches.map((m, i) => (
                  <div key={i} className="rx-match-item">
                    <span className={`rx-match-dot rx-c${i % HL_COLORS}`}>{i + 1}</span>
                    <code className="rx-match-text">{m[0] || "∅"}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 捕获组 */}
          {groupData && (
            <div className="rx-side-section">
              <div className="rx-side-title">{t("regex-tester.groups-title")}</div>
              <div className="rx-match-list">
                {groupData.rows.map((row, i) => (
                  <div key={i} className="rx-group-item">
                    <span className={`rx-match-dot rx-c${i % HL_COLORS}`}>{i + 1}</span>
                    <div className="rx-group-entries">
                      {row.groups.map((g, j) => (
                        <div key={j} className="rx-group-entry">
                          <span className="rx-group-key">{j + 1}</span>
                          <code>{g || "—"}</code>
                        </div>
                      ))}
                      {row.named.map(([k, v]) => (
                        <div key={k} className="rx-group-entry">
                          <span className="rx-group-key rx-group-named">{k}</span>
                          <code>{v}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 替换结果 */}
          {showReplace && replaceResult !== null && (
            <div className="rx-side-section">
              <div className="rx-side-title">{t("regex-tester.replace-toggle")}</div>
              <pre className="rx-replace-output">{replaceResult}</pre>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
