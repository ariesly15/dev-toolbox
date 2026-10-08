import { useEffect } from "react";
import type { RefObject } from "react";

type Ref = RefObject<HTMLElement | null>;
type RefOrRefs = Ref | Ref[];
type EventType = "mousedown" | "pointerdown";
type UseClickOutside = (refs: RefOrRefs, callback: () => void, active?: boolean, eventType?: EventType) => void;

/**
 * 监听外部点击，触发回调关闭弹出层
 * @param refs - 一个或多个 ref，点击这些元素外部时触发
 * @param callback - 外部点击时的回调
 * @param active - 是否激活监听（默认 true）
 * @param eventType - 监听的事件类型（默认 "mousedown"）
 */
export const useClickOutside: UseClickOutside = (refs, callback, active = true, eventType = "mousedown") => {
  useEffect(() => {
    if (!active) return;

    const refList = Array.isArray(refs) ? refs : [refs];
    const handler = (e: Event) => {
      const target = e.target as Node;
      const inside = refList.some((ref) => ref.current?.contains(target));
      if (!inside) callback();
    };

    document.addEventListener(eventType, handler);

    return () => document.removeEventListener(eventType, handler);
  }, [refs, callback, active, eventType]);
};
