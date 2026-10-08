import { useState, useCallback, useMemo } from "react";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import { SAMPLE_JSON } from "@/utils/const";
import { copyText } from "@/utils/url";
import { clsx } from "clsx";
import { useT } from "@/i18n";
import { useKey } from "@/hooks/useKey";
import { useAppStore } from "@/store/app";
import Input from "@/components/Input";
import ToggleSwitch from "@/components/Switch";
import JsonPathHelp from "@/tools/json-viewer/JsonPathHelp";
import { JSONPath } from "jsonpath-plus";
import Modal from "@/components/Modal";
import { ImageIcon, LinkIcon } from "@/components/icons";

const URL_REGEX = /^https?:\/\/[^\s]+$/i;
const IMAGE_URL_REGEX =
  /^https?:\/\/[^\s]+\.(png|jpe?g|gif|webp|svg|bmp|ico|avif|tiff?)(\?[^\s]*)?(#.*)?$/i;

// 字节数格式化为 B / KB / MB（抽成函数，替代原嵌套三元）
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function JsonViewer() {
  const loadUrl = useAppStore((s) => s.loadUrl);
  const t = useT();
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [jsonPathQuery, setJsonPathQuery] = useState("");
  const [jsonPathData, setJsonPathData] = useState<any>(null);
  const [jsonPathHelpOpen, setJsonPathHelpOpen] = useState(false);
  const [editEnabled, setEditEnabled] = useState(false);
  const [treeCollapse, setTreeCollapse] = useState<number | boolean>(3);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useKey("Escape", () => setPreviewImage(null), !!previewImage);

  // 解析 JSON
  const parsed = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return { data: null, error: null, isEmpty: true };
    try {
      const data = JSON.parse(trimmed);
      return { data, error: null, isEmpty: false };
    } catch (e) {
      return { data: null, error: (e as Error).message, isEmpty: false };
    }
  }, [input]);

  // 格式化
  const handleFormat = useCallback(() => {
    if (parsed.data !== null && parsed.error === null) {
      setInput(JSON.stringify(parsed.data, null, 2));
    }
  }, [parsed]);

  // 压缩
  const handleCompress = useCallback(() => {
    if (parsed.data !== null && parsed.error === null) {
      setInput(JSON.stringify(parsed.data));
    }
  }, [parsed]);

  // 加载示例
  const handleSample = useCallback(() => {
    setInput(JSON.stringify(SAMPLE_JSON, null, 2));
  }, []);

  // 复制格式化后的 JSON
  const handleCopy = useCallback(async () => {
    if (parsed.data !== null && parsed.error === null) {
      const text = JSON.stringify(parsed.data, null, 2);
      const ok = await copyText(text);
      if (ok) {
        setCopied(t("json-viewer.copied-json"));
        setTimeout(() => setCopied(null), 1500);
      }
    }
  }, [parsed]);

  // 复制 URL 编码
  const handleCopyEncoded = useCallback(async () => {
    if (parsed.data !== null && parsed.error === null) {
      const compressed = JSON.stringify(parsed.data);
      const encoded = encodeURIComponent(compressed);
      const ok = await copyText(encoded);
      if (ok) {
        setCopied(t("json-viewer.copied-encoded"));
        setTimeout(() => setCopied(null), 1500);
      }
    }
  }, [parsed]);

  // 清空
  const handleClear = useCallback(() => {
    setInput("");
  }, []);

  // 转义：将 JSON 转为转义字符串
  const handleEscape = useCallback(() => {
    if (parsed.data !== null && parsed.error === null) {
      setInput(JSON.stringify(JSON.stringify(parsed.data)));
    }
  }, [parsed]);

  // 反转义：将转义字符串还原为 JSON
  const handleUnescape = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      const unescaped = JSON.parse(trimmed);
      if (typeof unescaped === "string") {
        const data = JSON.parse(unescaped);
        setInput(JSON.stringify(data, null, 2));
      }
    } catch {
      /* 非转义字符串，静默忽略 */
    }
  }, [input]);

  // 执行 JSONPath 查询（空查询回车还原原始数据）
  const handleJsonPathExec = useCallback(() => {
    if (!parsed.data) return;
    const q = jsonPathQuery.trim();
    if (!q) {
      setJsonPathData(null);
      return;
    }
    try {
      const result = JSONPath({ path: q, json: parsed.data });
      setJsonPathData(result);
    } catch (e) {
      setJsonPathData({ error: (e as Error).message });
    }
  }, [parsed, jsonPathQuery]);

  // 树视图数据源：JSONPath 结果优先，否则原始数据
  const treeSrc = jsonPathData !== null ? jsonPathData : parsed.data;

  // 树内编辑：react18-json-view onChange 回写 textarea（参数为操作元数据，取 .src）
  const handleTreeEdit = useCallback(
    (params: any) => {
      if (!editEnabled) return;

      setInput(JSON.stringify(params.src, null, 2));
    },
    [editEnabled],
  );

  // 统计信息
  const stats = useMemo(() => {
    if (parsed.data === null || parsed.error !== null) return null;
    const text = JSON.stringify(parsed.data, null, 2);
    const lines = text.split("\n").length;
    const size = new Blob([text]).size;
    const sizeStr = formatSize(size);
    return { lines, size: sizeStr };
  }, [parsed]);

  // 节点级操作按钮：URL 解析 + 图片预览
  const NodeOperation: React.FC<{ node: any }> = ({ node }) => {
    if (typeof node !== "string") return null;
    const isUrl = URL_REGEX.test(node);
    const isImage = IMAGE_URL_REGEX.test(node);
    if (!isUrl && !isImage) return null;
    return (
      <>
        {isImage && (
          <span
            className="jv-node-action json-view--edit"
            title={t("json-viewer.preview-image-title")}
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(node);
            }}
          >
            <ImageIcon size={12} />
          </span>
        )}
        {isUrl && (
          <span
            className="jv-node-action json-view--edit"
            title={t("json-viewer.parse-url-title")}
            onClick={(e) => {
              e.stopPropagation();
              loadUrl(node);
            }}
          >
            <LinkIcon size={12} />
          </span>
        )}
      </>
    );
  };

  // 结果区：空输入 → 空态；解析失败 → 不渲染（错误已在输入区 banner 提示）；解析成功 → 结果卡片
  const renderResult = () => {
    if (parsed.isEmpty)
      return <section className="card empty-card">{t("json-viewer.empty")}</section>;

    if (parsed.error !== null) return null;

    return (
      <section className="card jv-result-card">
        <div className="jv-result-bar">
          {stats && (
            <span className="jv-stats">
              {t("json-viewer.stats", { lines: stats.lines, size: stats.size })}
            </span>
          )}
          <div className="jv-collapse-btns">
            <button
              className="jv-collapse-btn"
              onClick={() => setTreeCollapse(false)}
              title={t("json-viewer.expand-all-title")}
            >
              {t("json-viewer.expand-all")}
            </button>
            <button
              className="jv-collapse-btn"
              onClick={() => setTreeCollapse(1)}
              title={t("json-viewer.collapse-all-title")}
            >
              {t("json-viewer.collapse-all")}
            </button>
          </div>
          <label className="jv-edit-label" title={t("json-viewer.edit-toggle-title")}>
            <span>{t("json-viewer.edit-toggle")}</span>
            <ToggleSwitch checked={editEnabled} onChange={setEditEnabled} />
          </label>
        </div>
        <div className="jv-tree-wrapper">
          <JsonView
            src={treeSrc}
            enableClipboard={true}
            editable={editEnabled}
            onChange={handleTreeEdit}
            collapsed={treeCollapse}
            displaySize={true}
            collapseStringsAfterLength={80}
            matchesURL={true}
            CustomOperation={NodeOperation}
          />
        </div>
        {previewImage && (
          <Modal
            open={true}
            onClose={() => setPreviewImage(null)}
            title={t("json-viewer.image-preview-title")}
            className="jv-image-modal"
            animation="zoom"
          >
            <img
              className="jv-preview-img"
              src={previewImage}
              alt={t("json-viewer.preview-image-alt")}
            />
          </Modal>
        )}
      </section>
    );
  };

  return (
    <div className="json-viewer">
      {/* 输入区 */}
      <section className="card">
        <label className="field-label" htmlFor="json-input">
          {t("json-viewer.input-label")}
        </label>
        <textarea
          id="json-input"
          className="json-textarea mono-input"
          value={input}
          placeholder={t("json-viewer.input-placeholder")}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          rows={10}
        />
        <div className="toolbar">
          <button
            className="btn"
            onClick={handleFormat}
            disabled={parsed.error !== null || parsed.isEmpty}
          >
            {t("json-viewer.format")}
          </button>
          <button
            className="btn"
            onClick={handleCompress}
            disabled={parsed.error !== null || parsed.isEmpty}
          >
            {t("json-viewer.compress")}
          </button>
          <button
            className="btn"
            onClick={handleCopy}
            disabled={parsed.error !== null || parsed.isEmpty}
          >
            {t("common.copy")}
          </button>
          <button
            className="btn"
            onClick={handleCopyEncoded}
            disabled={parsed.error !== null || parsed.isEmpty}
          >
            {t("json-viewer.copy-encoded")}
          </button>
          <button
            className="btn"
            onClick={handleEscape}
            disabled={parsed.error !== null || parsed.isEmpty}
          >
            {t("json-viewer.escape")}
          </button>
          <button className="btn" onClick={handleUnescape} disabled={parsed.isEmpty}>
            {t("json-viewer.unescape")}
          </button>
          <button className="btn btn-ghost" onClick={handleClear} disabled={parsed.isEmpty}>
            {t("common.clear")}
          </button>

          {copied && <span className="copied-tip">{copied}</span>}

          <button className="btn btn-right" onClick={handleSample}>
            {t("common.sample")}
          </button>
        </div>
        {parsed.error && (
          <div className="banner banner-warning jv-error-banner">
            {t("json-viewer.parse-error", { msg: parsed.error })}
          </div>
        )}
      </section>

      {/* JSONPath 查询 */}
      {parsed.data !== null && parsed.error === null && (
        <section className="card jv-jsonpath-card">
          <Input
            wrapperClassName="jv-jsonpath-input-wrap"
            value={jsonPathQuery}
            placeholder={t("json-viewer.jsonpath-placeholder")}
            onChange={(v) => {
              setJsonPathQuery(v);
              if (!v) setJsonPathData(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleJsonPathExec()}
            addons={
              <button
                type="button"
                className={clsx("jv-jsonpath-help-btn", jsonPathHelpOpen && "active")}
                onClick={() => setJsonPathHelpOpen((v) => !v)}
                title={t("json-viewer.jsonpath-help-title")}
              >
                ?
              </button>
            }
          />
          <JsonPathHelp show={jsonPathHelpOpen} />
        </section>
      )}

      {/* 可视化区 */}
      {renderResult()}
    </div>
  );
}
