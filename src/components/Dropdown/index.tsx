import type { DropdownProps } from "@/interface";
import { useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import ToggleSwitch from "@/components/Switch";
import { ChevronDownIcon } from "@/components/icons";
import { clsx } from "clsx";
import "./styles.css";

/** 下拉菜单的 fixed 定位坐标（right 与 left/minWidth 二选一，取决于 align） */
interface MenuPosition {
  top: number;
  left?: number;
  right?: number;
  minWidth?: number;
}

/**
 * 通用下拉组件（合并原 LightDropdown 单选 + FilterDropdown 多选）
 * - mode="single"（默认）：点击选项即选中并关闭，触发器展示所选 label
 * - mode="multi"：选项为「文案 + 开关」，切换不关闭菜单，触发器展示自定义 label
 * - 菜单用 fixed 定位挂到触发器下方，避免被父容器裁剪；点击外部关闭
 * - 样式见同目录 styles.css
 */
export default function Dropdown(props: DropdownProps) {
  const { items, triggerClassName, minWidth = 120, maxHeight, title, disabled, portal = true, triggerShape } = props;
  const isMulti = props.mode === "multi";
  const align = props.align ?? (isMulti ? "right" : "left");

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = props.open !== undefined;
  const open = isControlled ? props.open : internalOpen;
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useClickOutside(
    wrapRef,
    () => {
      if (isControlled) props.onOpenChange?.(false);
      else setInternalOpen(false);
    },
    open,
  );

  /** 依据 align 计算菜单 fixed 坐标：右对齐用 right，左对齐用 left + minWidth */
  const getMenuPosition = (rect: DOMRect): MenuPosition => {
    const top = rect.bottom + 4;
    if (align === "right") return { top, right: window.innerWidth - rect.right };
    return { top, left: rect.left, minWidth: Math.max(rect.width, minWidth) };
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!open && triggerRef.current) {
      setMenuPos(getMenuPosition(triggerRef.current.getBoundingClientRect()));
    }
    if (isControlled) props.onOpenChange?.(!open);
    else setInternalOpen((v) => !v);
  };

  const getMenuStyle = () => {
    const base = maxHeight != null ? { maxHeight } : {};
    if (!portal) {
      return {
        ...base,
        position: "absolute" as const,
        top: "calc(100% + 4px)",
        ...(!isMulti && { minWidth }),
        ...(align === "right" ? { right: 0 } : { left: 0 }),
      };
    }
    if (menuPos) {
      return {
        ...base,
        position: "fixed" as const,
        top: menuPos.top,
        left: menuPos.left,
        right: menuPos.right,
        minWidth: menuPos.minWidth,
      };
    }
    return base;
  };

  const renderTriggerContent = () => {
    const prefix = props.triggerPrefix;
    // circle：仅展示 prefix（需配合 triggerPrefix 使用）
    if (triggerShape === "circle") return <>{prefix}</>;
    // 默认：prefix + label 共存，至少有一个
    if (props.mode === "multi") {
      return (
        <>
          {prefix}
          <span className="dropdown-label">{props.label}</span>
        </>
      );
    }
    const selected = items.find((it) => it.id === props.value);
    return (
      <>
        {prefix}
        <span className="dropdown-value">{selected?.label ?? props.placeholder ?? "—"}</span>
      </>
    );
  };

  const renderDropdownMenu = () => {
    if (!open) return null;

    return (
      <ul className="dropdown-menu" style={getMenuStyle()}>
        {items.map((item) => {
          if (props.mode === "multi") {
            return (
              <li key={item.id}>
                <div className="dropdown-filter" onClick={() => props.onToggle(item.id)}>
                  <span>{item.label}</span>
                  {/* 阻止冒泡：开关自身已触发 onToggle，避免与整行点击重复触发 */}
                  <span onClick={(e) => e.stopPropagation()}>
                    <ToggleSwitch checked={!!item.checked} onChange={() => props.onToggle(item.id)} />
                  </span>
                </div>
              </li>
            );
          }

          return (
            <li key={item.id}>
              <button
                type="button"
                className={clsx("dropdown-option", item.id === props.value && "active")}
                onClick={() => {
                  props.onChange(item.id);
                  if (isControlled) props.onOpenChange?.(false);
                  else setInternalOpen(false);
                }}
              >
                {item.prefix}
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={clsx("dropdown", isMulti ? "dropdown-multi" : "dropdown-single")} ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className={clsx(
          triggerClassName,
          "dropdown-trigger",
          !triggerClassName && "dropdown-trigger-default",
          triggerShape === "circle" && "dropdown-trigger-circle",
          props.mode === "multi" && props.active && "active",
        )}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={open}
        title={title}
      >
        {renderTriggerContent()}
        <ChevronDownIcon className={clsx("dropdown-caret", open && "open")} />
      </button>
      {renderDropdownMenu()}
    </div>
  );
}
