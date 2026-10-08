import type { PartName, UrlParts } from "@/utils/url";
import { useT } from "@/i18n";

interface PartFieldDef {
  name: PartName;
  label: string;
  placeholder: string;
}

const getFields = (t: (key: string, ...args: any[]) => string): PartFieldDef[] => [
  { name: "protocol", label: t("part-fields.protocol"), placeholder: "https" },
  { name: "hostname", label: t("part-fields.hostname"), placeholder: "example.com" },
  { name: "port", label: t("part-fields.port"), placeholder: "443" },
  { name: "pathname", label: t("part-fields.pathname"), placeholder: "/path/to/page" },
  { name: "hash", label: t("part-fields.hash"), placeholder: "section-1" },
  { name: "username", label: t("part-fields.username"), placeholder: "user" },
  { name: "password", label: t("part-fields.password"), placeholder: "pass" },
];

interface PartFieldsProps {
  parts: UrlParts;
  onChange: (name: PartName, value: string) => void;
}

export default function PartFields({ parts, onChange }: PartFieldsProps) {
  const t = useT();
  const FIELDS = getFields(t);
  return (
    <div className="parts-grid">
      {FIELDS.map((f) => (
        <div className={`part-field part-field-${f.name}`} key={f.name}>
          <label className="field-label">{f.label}</label>
          <input
            className="mono-input"
            type="text"
            value={parts[f.name] || ""}
            placeholder={f.placeholder}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => onChange(f.name, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
