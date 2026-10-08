import { useState } from "react";
import { detectValueType, prettyJson, compressJson } from "@/utils/url";
import type { UrlParam } from "@/utils/url";
import type { CustomQuery } from "@/tools/url-parser/UrlParser";
import { TagIcon, EncodeIcon, DecodeIcon, ExportIcon, ImportIcon, CloseIcon, SortIcon } from "@/components/icons";
import Input from "@/components/Input";
import Dropdown from "@/components/Dropdown";
import { useT } from "@/i18n";
import { clsx } from "clsx";

interface ParamRowProps {
  index: number;
  param: UrlParam;
  onChange: (index: number, field: "key" | "value", value: string) => void;
  onToggle: (index: number, enabled: boolean) => void;
  onDelete: (index: number) => void;
  onEncode: (index: number) => void;
  onDecode: (index: number) => void;
  onLoadUrl: (url: string) => void;
  customQueryKeys?: Set<string>;
  customQueryTypeMap?: Map<string, CustomQuery["type"]>;
  customQueryOptionsMap?: Map<string, string[]>;
  t: (key: string, ...args: any[]) => string;
}

function ParamRow(props: ParamRowProps) {
  const {
    index,
    param,
    onChange,
    onToggle,
    onDelete,
    onEncode,
    onDecode,
    onLoadUrl,
    customQueryKeys,
    customQueryTypeMap,
    customQueryOptionsMap,
    t,
  } = props;

  const disabled = param.enabled === false;
  const hasConflict = !disabled && (customQueryKeys?.has(param.key) ?? false);
  const isBooleanCustomQuery = customQueryTypeMap?.get(param.key) === "boolean";
  const isListCustomQuery = customQueryTypeMap?.get(param.key) === "list";
  const listOptions = isListCustomQuery ? customQueryOptionsMap?.get(param.key) : undefined;
  const type = disabled ? "plain" : detectValueType(param.value);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const openEditor = () => {
    setEditValue(prettyJson(param.value) ?? param.value);
    setEditing(true);
  };

  const closeEditor = () => {
    const compressed = compressJson(editValue);
    onChange(index, "value", compressed ?? editValue);
    setEditing(false);
  };

  // 获取所有自定义参数 key 作为建议
  const allCustomKeys = customQueryTypeMap ? Array.from(customQueryTypeMap.keys()) : [];

  const renderValue = () => {
    if (isBooleanCustomQuery) {
      return (
        <div className="cq-radio-group">
          <label className="cq-radio">
            <input
              type="radio"
              name={`param-bool-${index}`}
              checked={param.value === "true"}
              disabled={disabled}
              onChange={() => onChange(index, "value", "true")}
            />
            true
          </label>
          <label className="cq-radio">
            <input
              type="radio"
              name={`param-bool-${index}`}
              checked={param.value === "false"}
              disabled={disabled}
              onChange={() => onChange(index, "value", "false")}
            />
            false
          </label>
        </div>
      );
    }

    if (isListCustomQuery && listOptions && listOptions.length > 0) {
      return (
        <Dropdown
          items={listOptions.map((o) => ({ id: o, label: o }))}
          value={param.value}
          onChange={(v) => onChange(index, "value", v)}
        />
      );
    }

    return (
      <>
        <Input
          wrapperClassName="mono-input"
          value={param.value}
          placeholder={t("params-table.value-placeholder")}
          disabled={disabled}
          clearable={false}
          onChange={(value) => onChange(index, "value", value)}
        />
        {type === "json" && (
          <>
            <span className="badge badge-json">JSON</span>
            <button
              className={clsx("badge", editing ? "badge-close" : "badge-edit")}
              title={editing ? t("params-table.close-edit-title") : t("params-table.edit-json-title")}
              onClick={() => (editing ? closeEditor() : openEditor())}
            >
              {editing ? t("common.close") : t("params-table.edit")}
            </button>
          </>
        )}
        {type === "url" && (
          <>
            <span className="badge badge-url">URL</span>
            <button
              className="badge badge-load"
              title={t("params-table.parse-url-title")}
              onClick={() => onLoadUrl(param.value.trim())}
            >
              {t("params-table.parse")}
            </button>
          </>
        )}
      </>
    );
  };

  return (
    <>
      <tr className={clsx(disabled && "row-disabled", hasConflict && "has-conflict")}>
        <td className="check-cell">
          <input
            type="checkbox"
            checked={!disabled}
            title={disabled ? t("params-table.check-enable-title") : t("params-table.check-disable-title")}
            onChange={(e) => onToggle(index, e.target.checked)}
          />
        </td>
        <td className="key-cell">
          <Input
            wrapperClassName="key-input"
            value={param.key}
            suggestions={allCustomKeys}
            placeholder={t("params-table.key-placeholder")}
            disabled={disabled}
            clearable={false}
            onChange={(v) => onChange(index, "key", v)}
          />
        </td>
        <td>
          <div className="value-cell">{renderValue()}</div>
        </td>
        <td className="op-cell">
          <div className="op-btns">
            <button
              className="btn-icon op-btn"
              title={t("params-table.encode-value")}
              disabled={disabled || !param.value}
              onClick={() => onEncode(index)}
            >
              <EncodeIcon size={15} />
            </button>
            <button
              className="btn-icon op-btn"
              title={t("params-table.decode-value")}
              disabled={disabled || !param.value}
              onClick={() => onDecode(index)}
            >
              <DecodeIcon size={15} />
            </button>
            <button
              className="btn-icon op-btn"
              title={t("params-table.delete-param")}
              disabled={disabled}
              onClick={() => onDelete(index)}
            >
              <CloseIcon size={15} />
            </button>
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="json-edit-row">
          <td colSpan={4}>
            <div className="json-edit-wrap">
              <textarea
                className="mono-input json-edit-textarea"
                value={editValue}
                spellCheck={false}
                autoComplete="off"
                rows={Math.min(Math.max(editValue.split("\n").length, 3), 6)}
                onChange={(e) => setEditValue(e.target.value)}
              />
              <button className="btn json-edit-done" onClick={closeEditor}>
                {t("params-table.done")}
              </button>
            </div>
          </td>
        </tr>
      )}
      {hasConflict && (
        <tr className="conflict-row">
          <td colSpan={4}>
            <div className="conflict-hint">
              <span className="conflict-icon">⚠</span>
              <span>
                {t("params-table.conflict", { key: param.key })}
              </span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

interface CustomRowProps {
  query: CustomQuery;
  onChange: (id: string, value: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  t: (key: string, ...args: any[]) => string;
}

function CustomRow(props: CustomRowProps) {
  const { query, onChange, onToggle, t } = props;
  const disabled = query.enabled === false;

  return (
    <tr className={clsx("cq-row", disabled && "row-disabled")}>
      <td className="check-cell">
        <input
          type="checkbox"
          checked={!disabled}
          title={disabled ? t("params-table.check-enable-title") : t("params-table.check-disable-title")}
          onChange={(e) => onToggle(query.id, e.target.checked)}
        />
      </td>
      <td>
        <div className="cq-key-cell">
          <input className="mono-input" type="text" value={query.key} disabled />
          <span className="cq-key-badge" title={t("params-table.custom-badge-title")}>
            <TagIcon className="cq-key-icon" />
          </span>
        </div>
      </td>
      <td>
        <div className="value-cell">
          {query.type === "boolean" && (
            <div className="cq-radio-group">
              <label className="cq-radio">
                <input
                  type="radio"
                  name={`cq-${query.id}`}
                  checked={query.value === "true"}
                  onChange={() => onChange(query.id, "true")}
                />
                true
              </label>
              <label className="cq-radio">
                <input
                  type="radio"
                  name={`cq-${query.id}`}
                  checked={query.value === "false"}
                  onChange={() => onChange(query.id, "false")}
                />
                false
              </label>
            </div>
          )}
          {query.type === "list" && (
            <Dropdown
              items={query.options.map((o) => ({ id: o, label: o }))}
              value={query.value}
              onChange={(v) => onChange(query.id, v)}
            />
          )}
          {query.type === "string" && (
            <input
              className="mono-input"
              value={query.value}
              placeholder={t("params-table.custom-value-placeholder")}
              onChange={(e) => onChange(query.id, e.target.value)}
            />
          )}
        </div>
      </td>
      <td className="op-cell">
        <span className="cq-op-label">—</span>
      </td>
    </tr>
  );
}

interface ParamsTableProps {
  params: UrlParam[];
  onChange: (index: number, field: "key" | "value", value: string) => void;
  onToggle: (index: number, enabled: boolean) => void;
  onToggleAll: () => void;
  allEnabled: boolean;
  someEnabled: boolean;
  onDelete: (index: number) => void;
  onAdd: () => void;
  onEncode: (index: number) => void;
  onDecode: (index: number) => void;
  onEncodeAll: () => void;
  onDecodeAll: () => void;
  onSort: () => void;
  onExport: () => void;
  onImport: (json: string) => boolean;
  onLoadUrl: (url: string) => void;
  customQueries?: CustomQuery[];
  customVisible?: boolean;
  onCustomQueryChange?: (id: string, value: string) => void;
  onCustomQueryToggle?: (id: string, enabled: boolean) => void;
}

export default function ParamsTable(props: ParamsTableProps) {
  const {
    params,
    onChange,
    onToggle,
    onToggleAll,
    allEnabled,
    someEnabled,
    onDelete,
    onAdd,
    onEncode,
    onDecode,
    onEncodeAll,
    onDecodeAll,
    onSort,
    onExport,
    onImport,
    onLoadUrl,
    customQueries,
    customVisible,
    onCustomQueryChange,
    onCustomQueryToggle,
  } = props;

  const t = useT();
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState(false);

  const enabledCount = params.filter((p) => p.enabled !== false).length;
  const hasCustomQueries = customQueries && customQueries.length > 0;
  const visibleCustom = customVisible && hasCustomQueries;
  // 只有当自定义参数可见且启用时，才检测冲突
  const enabledCustomKeys = customQueries?.filter((q) => q.enabled !== false).map((q) => q.key) ?? [];
  const customQueryKeys = visibleCustom ? new Set(enabledCustomKeys) : undefined;
  // 类型映射始终可用（用于 datalist 选择后的 radio 展示）
  const customQueryTypeMap = hasCustomQueries ? new Map(customQueries.map((q) => [q.key, q.type])) : undefined;
  // 选项映射（用于 list 类型的下拉选择）
  const listQueries = customQueries?.filter((q) => q.type === "list") ?? [];
  const customQueryOptionsMap = hasCustomQueries ? new Map(listQueries.map((q) => [q.key, q.options])) : undefined;

  const renderCustomRows = () => {
    if (!visibleCustom || !onCustomQueryChange || !onCustomQueryToggle) return null;
    return customQueries!.map((q) => (
      <CustomRow key={q.id} query={q} onChange={onCustomQueryChange} onToggle={onCustomQueryToggle} t={t} />
    ));
  };

  const renderParams = () => {
    if (params.length > 0) {
      return params.map((p, i) => (
        <ParamRow
          key={i}
          index={i}
          param={p}
          onChange={onChange}
          onToggle={onToggle}
          onDelete={onDelete}
          onEncode={onEncode}
          onDecode={onDecode}
          onLoadUrl={onLoadUrl}
          customQueryKeys={customQueryKeys}
          customQueryTypeMap={customQueryTypeMap}
          customQueryOptionsMap={customQueryOptionsMap}
          t={t}
        />
      ));
    }

    if (!visibleCustom) {
      return (
        <tr>
          <td colSpan={4} className="empty-params">
            {t("params-table.empty")}
          </td>
        </tr>
      );
    }
    return null;
  };

  const customEnabledCount = visibleCustom ? customQueries!.filter((q) => q.enabled !== false).length : 0;
  const totalCount = params.length + (visibleCustom ? customQueries!.length : 0);
  const totalEnabled = enabledCount + customEnabledCount;

  return (
    <div>
      <table className="params-table">
        <thead>
          <tr>
            <th className="col-check">
              {params.length > 0 && (
                <input
                  type="checkbox"
                  checked={allEnabled}
                  ref={(el) => {
                    if (el) el.indeterminate = !allEnabled && someEnabled;
                  }}
                  title={allEnabled ? t("params-table.deselect-all") : t("params-table.select-all")}
                  onChange={onToggleAll}
                />
              )}
            </th>
            <th className="col-key">{t("params-table.col-key")}</th>
            <th>{t("params-table.col-value")}</th>
            <th className="col-op">{t("params-table.col-op")}</th>
          </tr>
        </thead>
        <tbody>
          {renderCustomRows()}
          {renderParams()}
        </tbody>
      </table>
      <div className="params-footer">
        <span className="params-count">
          {totalCount > 0 && t("params-table.enabled-count", { enabled: totalEnabled, total: totalCount })}
        </span>
        <div className="params-actions">
          <button className="btn-icon op-btn" title={t("params-table.sort")} onClick={onSort} disabled={params.length < 2}>
            <SortIcon size={15} />
          </button>
          <button className="btn-icon op-btn" title={t("params-table.encode-all")} onClick={onEncodeAll} disabled={!params.length}>
            <EncodeIcon size={15} />
          </button>
          <button className="btn-icon op-btn" title={t("params-table.decode-all")} onClick={onDecodeAll} disabled={!params.length}>
            <DecodeIcon size={15} />
          </button>
          <button className="btn-icon op-btn" title={t("params-table.export")} onClick={onExport} disabled={!params.length}>
            <ExportIcon size={15} />
          </button>
          <button
            className="btn-icon op-btn"
            title={t("params-table.import")}
            onClick={() => {
              setImportOpen((v) => !v);
              setImportText("");
              setImportError(false);
            }}
          >
            <ImportIcon size={15} />
          </button>
        </div>
        <button className="btn btn-dashed" onClick={onAdd}>
          {t("common.add-param")}
        </button>
      </div>
      {importOpen && (
        <div className="params-import">
          <textarea
            className="mono-input params-import-textarea"
            value={importText}
            placeholder={t("params-table.import-placeholder")}
            spellCheck={false}
            rows={4}
            onChange={(e) => {
              setImportText(e.target.value);
              setImportError(false);
            }}
          />
          <div className="params-import-actions">
            {importError && <span className="banner banner-warning">{t("params-table.import-error")}</span>}
            <button
              className="btn"
              onClick={() => {
                const ok = onImport(importText);
                if (ok) {
                  setImportOpen(false);
                  setImportText("");
                } else {
                  setImportError(true);
                }
              }}
            >
              {t("params-table.import-confirm")}
            </button>
            <button className="btn btn-ghost" onClick={() => setImportOpen(false)}>
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
