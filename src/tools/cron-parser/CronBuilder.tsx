import type { CronBuilderProps } from "@/interface";
import { useMemo, useState } from "react";
import Dropdown from "@/components/Dropdown";
import type { DropdownItem } from "@/interface";
import Input from "@/components/Input";
import { CRON_FIELD_DEFS } from "@/utils/cron";
import { copyText } from "@/utils/url";
import { ShieldIcon } from "@/components/icons";
import { useT } from "@/i18n";

type BuilderMode = "every" | "value" | "range" | "step" | "list";

interface FieldState {
  mode: BuilderMode;
  value: string;
  from: string;
  to: string;
  step: string;
  list: string;
}

/** 常用预设（点击载入逐字段构建器） */
const PRESETS: { key: string; expr: string }[] = [
  { key: "preset-every-5", expr: "*/5 * * * *" },
  { key: "preset-hourly", expr: "0 * * * *" },
  { key: "preset-daily-midnight", expr: "0 0 * * *" },
  { key: "preset-daily-morning", expr: "30 8 * * *" },
  { key: "preset-weekday-hourly", expr: "0 9-17 * * 1-5" },
  { key: "preset-work-15", expr: "*/15 9-17 * * 1-5" },
  { key: "preset-monthly-first", expr: "0 0 1 * *" },
];

const initState = (def: { min: number; max: number }): FieldState => ({
  mode: "every",
  value: String(def.min),
  from: String(def.min),
  to: String(def.max),
  step: "2",
  list: "",
});

/** 数字输入过滤：仅保留数字并限长 */
const digits = (v: string) => v.replace(/\D/g, "").slice(0, 2);

const clampNum = (v: string, min: number, max: number, fallback: number) => {
  const n = Number(v);
  if (v === "" || Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/** 单字段状态 → 表达式片段 */
const stateToExpr = (s: FieldState, def: { min: number; max: number }): string => {
  switch (s.mode) {
    case "every":
      return "*";
    case "value":
      return String(clampNum(s.value, def.min, def.max, def.min));
    case "range": {
      const a = clampNum(s.from, def.min, def.max, def.min);
      const b = clampNum(s.to, def.min, def.max, def.max);
      return a <= b ? `${a}-${b}` : `${b}-${a}`;
    }
    case "step":
      return `*/${clampNum(s.step, 1, Math.max(1, def.max - def.min), 1)}`;
    case "list":
      return s.list.replace(/\s+/g, "") || "*";
  }
};

/** 表达式片段 → 单字段状态（预设载入时反向填充） */
const rawToState = (raw: string, def: { min: number; max: number }): FieldState => {
  const base = initState(def);
  const trimmed = raw.trim();
  if (trimmed === "*" || trimmed === "?") return base;
  const stepMatch = /^\*\/(\d+)$/.exec(trimmed);
  if (stepMatch) return { ...base, mode: "step", step: stepMatch[1] };
  if (/^\d+$/.test(trimmed)) return { ...base, mode: "value", value: trimmed };
  const rangeMatch = /^(\d+)-(\d+)$/.exec(trimmed);
  if (rangeMatch) return { ...base, mode: "range", from: rangeMatch[1], to: rangeMatch[2] };
  // 其余复杂语法（如 a-b/n、列表）原样放入列表输入
  return { ...base, mode: "list", list: trimmed };
};

/**
 * 构建表达式面板
 * - 常用预设一键载入
 * - 逐字段选择语法模式（每/指定/范围/步长/列表）并填参
 * - 「使用此表达式」回写主输入框
 */
export default function CronBuilder(props: CronBuilderProps) {
  const { onUse } = props;
  const t = useT();
  const [states, setStates] = useState<FieldState[]>(() => CRON_FIELD_DEFS.map((d) => initState(d)));
  const [copied, setCopied] = useState(false);

  const expression = useMemo(() => CRON_FIELD_DEFS.map((def, i) => stateToExpr(states[i], def)).join(" "), [states]);

  const updateState = (idx: number, patch: Partial<FieldState>) =>
    setStates((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const applyPreset = (expr: string) => {
    const raws = expr.split(/\s+/);
    setStates(CRON_FIELD_DEFS.map((def, i) => rawToState(raws[i], def)));
  };

  const handleCopy = async () => {
    const ok = await copyText(expression);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const modeItems: DropdownItem[] = [
    { id: "every", label: t("cron-builder.mode-every") },
    { id: "value", label: t("cron-builder.mode-value") },
    { id: "range", label: t("cron-builder.mode-range") },
    { id: "step", label: t("cron-builder.mode-step") },
    { id: "list", label: t("cron-builder.mode-list") },
  ];

  return (
    <div className="cron-builder">
      {/* 常用预设 */}
      <div className="cron-sub-label">{t("cron-builder.presets-title")}</div>
      <div className="cron-presets">
        {PRESETS.map((p) => (
          <button key={p.key} type="button" className="cron-preset-chip" onClick={() => applyPreset(p.expr)}>
            {t(`cron-builder.${p.key}`)}
          </button>
        ))}
      </div>

      {/* 逐字段构建器 */}
      <div className="cron-sub-label">{t("cron-builder.field-builder-title")}</div>
      <div className="cron-field-rows">
        {CRON_FIELD_DEFS.map((def, idx) => {
          const s = states[idx];
          return (
            <div key={def.name} className="cron-field-row">
              <span className="cron-field-label">{t(`cron-field.${def.name}`)}</span>
              <Dropdown
                items={modeItems}
                value={s.mode}
                onChange={(mode) => updateState(idx, { mode: mode as BuilderMode })}
                triggerClassName="cron-mode-trigger"
                minWidth={90}
              />
              <div className="cron-field-controls">
                {s.mode === "value" && (
                  <Input
                    wrapperClassName="cron-num-wrap"
                    value={s.value}
                    onChange={(v) => updateState(idx, { value: digits(v) })}
                    clearable={false}
                  />
                )}
                {s.mode === "range" && (
                  <>
                    <Input
                      wrapperClassName="cron-num-wrap"
                      value={s.from}
                      onChange={(v) => updateState(idx, { from: digits(v) })}
                      clearable={false}
                    />
                    <span className="cron-sep">–</span>
                    <Input
                      wrapperClassName="cron-num-wrap"
                      value={s.to}
                      onChange={(v) => updateState(idx, { to: digits(v) })}
                      clearable={false}
                    />
                  </>
                )}
                {s.mode === "step" && (
                  <>
                    <span className="cron-step-prefix">*/</span>
                    <Input
                      wrapperClassName="cron-num-wrap"
                      value={s.step}
                      onChange={(v) => updateState(idx, { step: digits(v) })}
                      clearable={false}
                    />
                  </>
                )}
                {s.mode === "list" && (
                  <Input
                    wrapperClassName="cron-list-wrap"
                    value={s.list}
                    onChange={(v) => updateState(idx, { list: v })}
                    placeholder="1,5,10"
                    clearable={false}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 操作按钮 */}
      <div className="cron-builder-actions">
        <button type="button" className="btn btn-primary" onClick={() => onUse(expression)}>
          {t("cron-builder.use-expression")}
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleCopy}>
          {t("common.copy")}
        </button>
        {copied && <span className="copied-tip">{t("cron-parser.copied")}</span>}
        <span className="cron-local-note">
          <ShieldIcon />
          {t("cron-parser.local-note")}
        </span>
      </div>
      <input className="mono-input cron-built-expression" readOnly tabIndex={-1} value={expression} />
    </div>
  );
}
