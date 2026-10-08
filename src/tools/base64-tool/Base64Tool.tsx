import { useState, useCallback } from "react";
import { copyText } from "@/utils/url";
import { useT } from "@/i18n";
import "./styles.css";

type Mode = "encode" | "decode";

const SAMPLE_TEXT = "Hello, Pone 工具箱!";

/** 字节数格式化为 B / KB / MB */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 判断字符串是否为图片 data URI */
function isImageDataUri(s: string): boolean {
  return /^data:image\/(png|jpe?g|gif|webp|svg\+xml|bmp|ico|avif|tiff?);base64,/i.test(s);
}

/** 将纯 base64 补全为 data URI 后检测是否为图片（含 WebP） */
function tryAsImage(s: string): string | null {
  if (isImageDataUri(s)) return s;
  try {
    const bin = atob(s.trim());
    if (bin.length < 4) return null;
    const h = bin.charCodeAt(0);
    const h2 = bin.charCodeAt(1);
    if (h === 0x89 && h2 === 0x50) return `data:image/png;base64,${s.trim()}`;
    if (h === 0xff && h2 === 0xd8) return `data:image/jpeg;base64,${s.trim()}`;
    if (h === 0x47 && h2 === 0x49) return `data:image/gif;base64,${s.trim()}`;
    if (h === 0x42 && h2 === 0x4d) return `data:image/bmp;base64,${s.trim()}`;
    if (bin.startsWith("RIFF") && bin.slice(8, 12) === "WEBP")
      return `data:image/webp;base64,${s.trim()}`;
  } catch {
    /* not valid base64 */
  }
  return null;
}

/** 从解码后的纯文本中检测 SVG 图片 */
function tryAsSvg(text: string): string | null {
  const trimmed = text.trim();
  if (/^<svg[\s>]/i.test(trimmed)) return `data:image/svg+xml;base64,${btoa(trimmed)}`;
  return null;
}

type ContentType = "image" | "json" | "html" | "text";

/** 检测解码内容的实际类型 */
function detectContent(text: string): { type: ContentType; imageSrc?: string } {
  const img = tryAsImage(text);
  if (img) return { type: "image", imageSrc: img };
  const svg = tryAsSvg(text);
  if (svg) return { type: "image", imageSrc: svg };
  const trimmed = text.trim();
  if (trimmed.length <= 100_000) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null) return { type: "json" };
    } catch {
      /* not JSON */
    }
  }
  if (/^<\/?[a-z][\s\S]*>/i.test(trimmed) && trimmed.includes("<")) return { type: "html" };
  return { type: "text" };
}

export default function Base64Tool() {
  const t = useT();
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [encoded, setEncoded] = useState("");
  const [decoded, setDecoded] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isEmpty = input.trim().length === 0;

  // 编码：文本 → Base64
  const handleEncode = useCallback(() => {
    if (isEmpty) return;
    try {
      const bytes = new TextEncoder().encode(input);
      let binary = "";
      for (const b of bytes) binary += String.fromCharCode(b);
      setEncoded(btoa(binary));
      setDecoded("");
      setError(null);
      setMode("encode");
    } catch {
      setError(t("base64.encode-error"));
    }
  }, [input, isEmpty, t]);

  // 解码：Base64 → 文本（图片 data URI 直接保留，不做 text 转换）
  const handleDecode = useCallback(() => {
    if (isEmpty) return;
    const raw = input.trim();
    try {
      // 图片 data URI：直接保留，由 detectContent 识别为图片
      if (isImageDataUri(raw)) {
        setDecoded(raw);
        setEncoded("");
        setError(null);
        setMode("decode");
        return;
      }
      // 非图片 data URI：提取 base64 部分，用魔数检测是否为图片
      const match = raw.match(/^data:[^;]+;base64,(.+)$/);
      const b64 = match ? match[1] : raw;
      const imgUri = tryAsImage(b64);
      if (imgUri) {
        setDecoded(imgUri);
        setEncoded("");
        setError(null);
        setMode("decode");
        return;
      }
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      setDecoded(new TextDecoder().decode(bytes));
      setEncoded("");
      setError(null);
      setMode("decode");
    } catch {
      setError(t("base64.decode-error"));
    }
  }, [input, isEmpty, t]);

  // 文件 → Base64 data URI
  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        setEncoded(reader.result as string);
        setDecoded("");
        setError(null);
        setMode("encode");
        setInput(file.name);
      };
      reader.onerror = () => setError(t("base64.file-error"));
      reader.readAsDataURL(file);
    },
    [t],
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  // 复制结果
  const handleCopy = useCallback(async () => {
    const text = mode === "encode" ? encoded : decoded;
    if (!text) return;
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [mode, encoded, decoded]);

  // 清空
  const handleClear = useCallback(() => {
    setInput("");
    setEncoded("");
    setDecoded("");
    setError(null);
  }, []);

  // 加载示例
  const handleSample = useCallback(() => {
    setInput(SAMPLE_TEXT);
    setEncoded("");
    setDecoded("");
    setError(null);
  }, []);

  // 当前展示的结果
  const result = error ?? (mode === "encode" ? encoded : decoded);
  const hasResult = result.length > 0;
  const contentType = mode === "decode" && decoded ? detectContent(decoded) : null;

  const renderStats = () => {
    if (mode === "decode" && isImageDataUri(decoded)) {
      return formatSize(new Blob([input]).size);
    }
    return t("base64.stats", {
      input: formatSize(new Blob([input]).size),
      output: formatSize(new Blob([result]).size),
    });
  };

  // 结果区：空输入 → 空态；有结果 → 根据内容类型智能渲染
  const renderResult = () => {
    if (!hasResult && !error) {
      return <section className="card empty-card">{t("base64.empty")}</section>;
    }

    if (!hasResult || error) return null;

    return (
      <section className="card">
        <div className="b64-result-bar">
          <span className="field-label">
            {mode === "encode" ? t("base64.result-encode") : t("base64.result-decode")}
          </span>
          <span className="b64-stats">{renderStats()}</span>
          {contentType && contentType.type !== "text" && (
            <span className="b64-type-badge">{t(`base64.type-${contentType.type}`)}</span>
          )}
        </div>

        {/* 编码结果 / 纯文本解码 → textarea */}
        {(mode === "encode" || contentType?.type === "text") && (
          <textarea
            className="b64-textarea mono-input"
            value={result}
            readOnly
            rows={8}
            spellCheck={false}
          />
        )}

        {/* 图片解码 → 内联预览 */}
        {contentType?.type === "image" && (
          <div className="b64-img-preview">
            <img
              className="b64-preview-img"
              src={contentType.imageSrc}
              alt={t("base64.preview-alt")}
            />
          </div>
        )}

        {/* JSON 解码 → 格式化展示 */}
        {contentType?.type === "json" && (
          <pre className="b64-json-pre mono-input">
            {JSON.stringify(JSON.parse(decoded.trim()), null, 2)}
          </pre>
        )}

        {/* HTML 解码 → 代码展示 */}
        {contentType?.type === "html" && <pre className="b64-html-pre mono-input">{decoded}</pre>}
      </section>
    );
  };

  return (
    <div className="base64-tool">
      {/* 输入区 */}
      <section className="card">
        <label className="field-label" htmlFor="b64-input">
          {t("base64.input-label")}
        </label>
        <textarea
          id="b64-input"
          className="b64-textarea mono-input"
          value={input}
          placeholder={t("base64.input-placeholder")}
          onChange={(e) => setInput(e.target.value)}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          spellCheck={false}
          autoComplete="off"
          rows={8}
        />
        <div className="toolbar">
          <button className="btn" onClick={handleEncode} disabled={isEmpty}>
            {t("base64.encode")}
          </button>
          <button className="btn" onClick={handleDecode} disabled={isEmpty}>
            {t("base64.decode")}
          </button>
          <button className="btn" onClick={handleCopy} disabled={!hasResult || !!error}>
            {t("common.copy")}
          </button>
          <button className="btn btn-ghost" onClick={handleClear} disabled={isEmpty && !hasResult}>
            {t("common.clear")}
          </button>
          {copied && <span className="copied-tip">{t("base64.copied")}</span>}
          <label className="btn b64-file-btn" title={t("base64.file-title")}>
            {t("base64.file-upload")}
            <input type="file" hidden onChange={handleFileUpload} />
          </label>
          <button className="btn btn-right" onClick={handleSample}>
            {t("common.sample")}
          </button>
        </div>
        {error && <div className="banner banner-warning">{error}</div>}
      </section>

      {/* 结果区 */}
      {renderResult()}
    </div>
  );
}
