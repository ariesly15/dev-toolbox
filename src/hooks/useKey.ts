import { useEffect } from "react";

/**
 * 监听指定键盘按键，active 为 true 时生效
 * @param key - 要监听的按键名（如 "Escape"）
 * @param callback - 按键触发时的回调
 * @param active - 是否激活监听（默认 true）
 */
export function useKey(key: string, callback: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === key) callback();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, callback, active]);
}
