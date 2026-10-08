import { useState } from "react";
import type { CustomQuery, CustomQueryType } from "@/tools/url-parser/UrlParser";
import Dropdown from "@/components/Dropdown";
import Modal from "@/components/Modal";
import { useT } from "@/i18n";

interface CustomQueryPanelProps {
  queries: CustomQuery[];
  onSave: (queries: CustomQuery[]) => void;
  onClose: () => void;
}

const getTypeLabels = (t: (key: string, ...args: any[]) => string): Record<CustomQueryType, string> => ({
  boolean: t("custom-query.type-boolean"),
  list: t("custom-query.type-list"),
  string: t("custom-query.type-string"),
});

let nextId = Date.now();

export default function CustomQueryPanel(props: CustomQueryPanelProps) {
  const { queries, onSave, onClose } = props;
  const t = useT();
  const TYPE_LABELS = getTypeLabels(t);
  const [draft, setDraft] = useState<CustomQuery[]>(() => queries.map((q) => ({ ...q })));
  const [rawTextMap, setRawTextMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const q of queries) {
      if (q.type === "list") map[q.id] = q.options.join("\n");
    }
    return map;
  });

  const handleAdd = () => {
    setDraft([
      ...draft,
      { id: String(nextId++), key: "", type: "string", options: [], value: "", enabled: true },
    ]);
  };

  const handleRemove = (id: string) => setDraft(draft.filter((q) => q.id !== id));

  const handleChange = (id: string, patch: Partial<CustomQuery>) => {
    setDraft(
      draft.map((q) => {
        if (q.id !== id) return q;
        const next = { ...q, ...patch };
        if (patch.type && patch.type !== "list") next.options = [];
        if (patch.type === "boolean") next.value = "true";
        else if (patch.type === "string") next.value = "";
        else if (patch.type === "list") next.value = q.options[0] || "";
        return next;
      }),
    );
    if (patch.type === "list" && !rawTextMap[id]) {
      const q = draft.find((q) => q.id === id);
      setRawTextMap((m) => ({ ...m, [id]: q?.options.join("\n") || "" }));
    }
  };

  const handleRawTextChange = (id: string, text: string) => {
    setRawTextMap((m) => ({ ...m, [id]: text }));
    const opts = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    setDraft(
      draft.map((q) =>
        q.id === id ? { ...q, options: opts, value: opts.includes(q.value) ? q.value : opts[0] || "" } : q,
      ),
    );
  };

  const handleSave = () => {
    onSave(draft.filter((q) => q.key.trim()));
    onClose();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={t("custom-query.title")}
      className="cq-modal"
      footer={
        <>
          <button className="btn btn-dashed" onClick={handleAdd}>
            {t("common.add-param")}
          </button>
          <div className="cq-actions">
            <button className="btn" onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              {t("common.save")}
            </button>
          </div>
        </>
      }
    >
      <table className="params-table cq-table">
        <thead>
          <tr>
            <th className="col-key">{t("custom-query.col-key")}</th>
            <th className="col-type">{t("custom-query.col-type")}</th>
            <th className="col-op">{t("custom-query.col-op")}</th>
          </tr>
        </thead>
        <tbody>
          {draft.length === 0 && (
            <tr>
              <td colSpan={3} className="empty-params">
                {t("custom-query.empty")}
              </td>
            </tr>
          )}
          {draft.map((q) => (
            <>
              <tr key={q.id}>
                <td className="key-cell">
                  <input
                    className="mono-input"
                    value={q.key}
                    placeholder={t("custom-query.key-placeholder")}
                    onChange={(e) => handleChange(q.id, { key: e.target.value })}
                  />
                </td>
                <td>
                  <Dropdown
                    items={Object.keys(TYPE_LABELS).map((k) => ({ id: k, label: TYPE_LABELS[k as CustomQueryType] }))}
                    value={q.type}
                    onChange={(v) => handleChange(q.id, { type: v as CustomQueryType })}
                  />
                </td>
                <td className="op-cell">
                  <button className="btn-icon" title={t("common.remove")} onClick={() => handleRemove(q.id)}>
                    ✕
                  </button>
                </td>
              </tr>
              {q.type === "list" && (
                <tr className="cq-options-row">
                  <td colSpan={3}>
                    <textarea
                      className="cq-options-textarea"
                      value={rawTextMap[q.id] ?? ""}
                      placeholder={t("custom-query.options-placeholder")}
                      onChange={(e) => handleRawTextChange(q.id, e.target.value)}
                    />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
