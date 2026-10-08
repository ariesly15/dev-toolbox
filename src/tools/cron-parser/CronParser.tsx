import { useMemo, useState } from "react";
import { parseCron, describeCron, nextRuns, expandField, formatRun } from "@/utils/cron";
import type { CronField } from "@/utils/cron";
import CollapsibleCard from "@/components/CollapsibleCard";
import Input from "@/components/Input";
import CronBuilder from "@/tools/cron-parser/CronBuilder";
import CronSyntaxChips from "@/tools/cron-parser/CronSyntaxChips";
import { copyText } from "@/utils/url";
import { useT, getLang } from "@/i18n";
import { clsx } from "clsx";
import "./styles.css";

type TzMode = "local" | "utc";

const NEXT_COUNT = 7;

/** 首字母大写（仅英文描述需要） */
const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function CronParser() {
  const t = useT();
  const [input, setInput] = useState("");
  const [tz, setTz] = useState<TzMode>("local");
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseCron(input), [input]);
  const isEmpty = input.trim().length === 0;

  // 自然语言描述（英文首字母大写）
  const description = useMemo(() => {
    if (!parsed.ok) return "";
    const text = describeCron(parsed.fields, t);
    return getLang() === "en-US" ? capitalize(text) : text;
  }, [parsed, t]);

  // 接下来 N 次运行时间
  const runs = useMemo(
    () => (parsed.ok ? nextRuns(parsed.fields, new Date(), NEXT_COUNT, tz === "utc") : []),
    [parsed, tz],
  );

  const handleCopy = async () => {
    const ok = await copyText(input.trim());
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const renderFieldTable = (fields: CronField[]) => (
    <div className="cron-table-wrap">
      <table className="cron-field-table">
        <thead>
          <tr>
            <th>{t("cron-parser.col-field")}</th>
            <th>{t("cron-parser.col-raw")}</th>
            <th>{t("cron-parser.col-expanded")}</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.name}>
              <td className="cron-field-name">{t(`cron-field.${field.name}`)}</td>
              <td className="cron-cell-raw">{field.raw}</td>
              <td className="cron-cell-expanded">{expandField(field, t)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderList = () => {
    if (runs.length > 0) {
      return runs.map((run) => (
        <span key={run.getTime()} className="cron-run-item">
          {formatRun(run, tz === "utc", t)}
        </span>
      ));
    }
    return <span className="cron-runs-empty">{t("cron-parser.next-empty")}</span>;
  };

  const renderResult = () => {
    if (parsed.ok) {
      return (
        <>
          <div className="cron-desc-banner">{description}</div>
          <div className="cron-grid">
            <h3 className="cron-col-title cron-title-next">
              {t("cron-parser.next-title", { n: NEXT_COUNT })}
              <span className="cron-tz-switch">
                <button
                  type="button"
                  className={clsx("cron-tz-btn", tz === "local" && "active")}
                  onClick={() => setTz("local")}
                >
                  {t("cron-parser.tz-local")}
                </button>
                <button
                  type="button"
                  className={clsx("cron-tz-btn", tz === "utc" && "active")}
                  onClick={() => setTz("utc")}
                >
                  {t("cron-parser.tz-utc")}
                </button>
              </span>
            </h3>
            <h3 className="cron-col-title cron-title-fields">{t("cron-parser.fields-title")}</h3>
            <div className="cron-runs">{renderList()}</div>
            {renderFieldTable(parsed.fields)}
          </div>
        </>
      );
    }
    if (!isEmpty && parsed.error) {
      return <div className="banner banner-warning">{t(parsed.error.key, parsed.error.vars)}</div>;
    }
    return null;
  };

  return (
    <div className="cron-parser">
      {/* 表达式输入 */}
      <section className="card">
        <div className="cron-input-row">
          <label className="field-label cron-input-label">{t("cron-parser.input-label")}</label>
          <span className="cron-input-hint">{t("cron-parser.input-hint")}</span>
        </div>
        <Input
          wrapperClassName="cron-input-wrap"
          value={input}
          placeholder={t("cron-parser.input-placeholder")}
          onChange={setInput}
          spellCheck={false}
          autoComplete="off"
        />

        <CronSyntaxChips />

        <div className="toolbar">
          <button className="btn" onClick={handleCopy} disabled={isEmpty}>
            {t("common.copy")}
          </button>
          <button className="btn btn-ghost" onClick={() => setInput("")} disabled={isEmpty}>
            {t("common.clear")}
          </button>
          {copied && <span className="copied-tip">{t("cron-parser.copied")}</span>}
          <button
            className="btn btn-right"
            onClick={() => setInput(t("cron-parser.sample-expression"))}
          >
            {t("common.sample")}
          </button>
        </div>
        {/* 解析结果（描述 + 双栏） */}
        {renderResult()}
      </section>

      {/* 空态提示 */}
      {isEmpty && <section className="card empty-card">{t("cron-parser.empty")}</section>}

      {/* 构建表达式 */}
      <CollapsibleCard title={t("cron-parser.builder-title")} defaultCollapsed={false}>
        <CronBuilder onUse={setInput} />
      </CollapsibleCard>
    </div>
  );
}
