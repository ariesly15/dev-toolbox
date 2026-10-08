import { useT } from "@/i18n";

export default function CronSyntaxHelp() {
  const t = useT();

  return (
    <div className="cron-syntax">
      <Item code="*" desc={t("cron-syntax.any")} />
      <Item code="5" desc={t("cron-syntax.exact")} />
      <Item code="1,3,5" desc={t("cron-syntax.list")} />
      <Item code="1-5" desc={t("cron-syntax.range")} />
      <Item code="*/5" desc={t("cron-syntax.step")} />
      <Item code="1-10/2" desc={t("cron-syntax.range-step")} />
    </div>
  );
}

interface ItemProps {
  code: string;
  desc: string;
}

function Item(props: ItemProps) {
  const { code, desc } = props;
  return (
    <div className="cron-syntax-item">
      <code>{code}</code>
      <span>{desc}</span>
    </div>
  );
}
