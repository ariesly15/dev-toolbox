import { useT } from "@/i18n";

interface CronPresetsProps {
  onUse: (expression: string) => void;
}

export default function CronPresets(props: CronPresetsProps) {
  const { onUse } = props;
  const t = useT();

  const presets = [
    { expr: "* * * * *", label: t("cron-presets.every-minute") },
    { expr: "0 * * * *", label: t("cron-presets.every-hour") },
    { expr: "0 0 * * *", label: t("cron-presets.daily-midnight") },
    { expr: "0 9 * * *", label: t("cron-presets.daily-9am") },
    { expr: "0 9 * * 1-5", label: t("cron-presets.weekdays-9am") },
    { expr: "0 0 * * 1", label: t("cron-presets.weekly-monday") },
    { expr: "0 0 1 * *", label: t("cron-presets.monthly-first") },
    { expr: "0 0 1 */3 *", label: t("cron-presets.quarterly") },
  ];

  return (
    <div className="cron-presets-list">
      {presets.map((p) => (
        <button
          key={p.expr}
          type="button"
          className="cron-preset-item"
          onClick={() => onUse(p.expr)}
          title={p.expr}
        >
          <span className="cron-preset-label">{p.label}</span>
          <code className="cron-preset-expr">{p.expr}</code>
        </button>
      ))}
    </div>
  );
}
