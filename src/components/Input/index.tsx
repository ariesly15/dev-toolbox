import { useCallback, useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { fuzzyMatch } from "@/utils/fuzzy";
import { CloseIcon } from "@/components/icons";
import { clsx } from "clsx";
import { useT } from "@/i18n";
import "./styles.css";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  title?: string;
  maxLength?: number;
  spellCheck?: boolean;
  autoComplete?: string;
  /** 内层 input 附加类名 */
  className?: string;
  /** 外层容器附加类名（控制宽度/字体等，如 history-search-wrap） */
  wrapperClassName?: string;
  /** 有内容时是否显示清空按钮，默认 true */
  clearable?: boolean;
  clearTitle?: string;
  /** 输入框左侧内容（渲染在 input 内部） */
  prefix?: React.ReactNode;
  /** 右侧扩展按钮，与清空按钮并列（渲染在清空左侧） */
  addons?: React.ReactNode;
  /** 提供即启用模糊自动补全下拉（复用 utils/fuzzy） */
  suggestions?: string[];
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** 挂载即聚焦（如历史备注框进入编辑态） */
  autoFocus?: boolean;
}

const LIST_MAX_HEIGHT = 160;

/**
 * 通用输入框组件
 * - 外层带边框容器，内层无边框 input；聚焦时容器高亮
 * - 有内容时右侧显示清空按钮（clearable，默认开）
 * - addons 可在清空按钮左侧并列扩展按钮（如历史搜索的模糊匹配开关）
 * - 传入 suggestions 即启用模糊自动补全下拉
 * - 样式见同目录 styles.css
 */
export default function Input(props: InputProps) {
  const t = useT();
  const {
    value,
    onChange,
    placeholder,
    disabled,
    title,
    maxLength,
    spellCheck = false,
    autoComplete = "off",
    className,
    wrapperClassName,
    clearable = true,
    clearTitle = t("common.clear"),
    prefix,
    addons,
    suggestions,
    onKeyDown,
    onBlur,
    autoFocus,
  } = props;

  const hasSuggest = !!suggestions && suggestions.length > 0;
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [dropUp, setDropUp] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // 模糊子序列匹配（复用 utils/fuzzy）：排除与当前值完全相同的项
  const filtered = hasSuggest ? suggestions!.filter((s) => s !== value && fuzzyMatch(value, s) !== null) : [];

  // 输入变化时重置高亮
  useEffect(() => {
    setHighlightIndex(0);
  }, [value]);

  // 计算下拉展开方向（下方空间不足则向上）
  const calcDirection = useCallback(() => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setDropUp(spaceBelow < LIST_MAX_HEIGHT + 40);
  }, []);

  // 点击组件外部关闭下拉
  useClickOutside(wrapRef, () => setOpen(false), open);

  // 保证高亮项可见
  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, open]);

  const selectItem = (key: string) => {
    onChange(key);
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const handleChange = (next: string) => {
    onChange(next);
    if (hasSuggest) {
      calcDirection();
      setOpen(true);
    }
  };

  const handleFocus = () => {
    if (hasSuggest && filtered.length > 0) {
      calcDirection();
      setOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (hasSuggest && open && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectItem(filtered[highlightIndex]);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    onKeyDown?.(e);
  };

  const showClear = clearable && !disabled && value.length > 0;
  const showActions = !!addons || showClear;

  return (
    <div className={clsx("input-wrap", disabled && "input-wrap-disabled", wrapperClassName)} ref={wrapRef}>
      {prefix && <span className="input-prefix">{prefix}</span>}
      <input
        ref={inputRef}
        className={clsx("input-field", className)}
        type="text"
        value={value}
        placeholder={placeholder}
        title={title}
        maxLength={maxLength}
        spellCheck={spellCheck}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        autoFocus={autoFocus}
      />
      {showActions && (
        <div className="input-actions">
          {showClear && (
            <button
              type="button"
              className="input-clear"
              title={clearTitle}
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClear}
            >
              <CloseIcon />
            </button>
          )}
          {addons}
        </div>
      )}
      {hasSuggest && open && !disabled && filtered.length > 0 && (
        <ul
          ref={listRef}
          className={clsx("key-suggestions", dropUp && "drop-up")}
          style={{ maxHeight: LIST_MAX_HEIGHT }}
          onWheel={(e) => {
            const el = listRef.current;
            if (!el) return;
            const { scrollTop, scrollHeight, clientHeight } = el;
            const atTop = scrollTop === 0;
            const atBottom = scrollTop + clientHeight >= scrollHeight;
            const scrollingUp = e.deltaY < 0;
            const scrollingDown = e.deltaY > 0;
            // 列表已到边界且继续同方向滚动时，不阻止（允许透传给页面）
            if ((atTop && scrollingUp) || (atBottom && scrollingDown)) return;
            e.stopPropagation();
          }}
        >
          {filtered.map((key, i) => (
            <li
              key={key}
              className={clsx(i === highlightIndex && "highlighted")}
              onMouseEnter={() => setHighlightIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                selectItem(key);
              }}
            >
              {key}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
