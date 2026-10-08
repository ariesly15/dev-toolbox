import { useT } from "@/i18n";

export default function JsonPathHelp(props: { show?: boolean }) {
  const { show = true } = props;
  const t = useT();

  if (!show) return null;

  return (
    <div className="jv-jsonpath-help">
      <Item code="$" desc={t("json-viewer.jph-root")} />
      <Item code="$.key" desc={t("json-viewer.jph-dot")} />
      <Item code="$['key']" desc={t("json-viewer.jph-bracket")} />
      <Item code="$..key" desc={t("json-viewer.jph-recursive")} />
      <Item code="$.arr[0]" desc={t("json-viewer.jph-index")} />
      <Item code="$.arr[*]" desc={t("json-viewer.jph-wildcard")} />
      <Item code="$.arr[0:3]" desc={t("json-viewer.jph-slice")} />
      <Item code="$..*[?(@.name)]" desc={t("json-viewer.jph-filter")} />
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
    <div className="jv-jsonpath-help-item">
      <code>{code}</code>
      <span>{desc}</span>
    </div>
  );
}
