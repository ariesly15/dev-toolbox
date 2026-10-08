import { useT } from "@/i18n";

export default function CronSyntaxChips() {
  const t = useT();

  return (
    <div className="cron-syntax-chips">
      <span>
        <code>*</code> {t("cron-syntax.any")}
      </span>
      <span>
        <code>5</code> {t("cron-syntax.exact")}
      </span>
      <span>
        <code>1,3,5</code> {t("cron-syntax.list")}
      </span>
      <span>
        <code>1-5</code> {t("cron-syntax.range")}
      </span>
      <span>
        <code>*/5</code> {t("cron-syntax.step")}
      </span>
      <span>
        <code>1-10/2</code> {t("cron-syntax.range-step")}
      </span>
    </div>
  );
}
