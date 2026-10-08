import React, { useState, useCallback, useContext, createContext } from "react";
import { formatMessage } from "@/i18n/icu";
import zhCN from "@/i18n/zh-CN";
import enUS from "@/i18n/en-US";
type Locale = typeof zhCN;
export type { Locale };

// ──── 语言包注册 ────
const locales = {
  "zh-CN": zhCN,
  "en-US": enUS,
} as const;

export type Lang = keyof typeof locales;

// ──── 语言状态 ────
let currentLang: Lang = (() => {
  try {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved && saved in locales) return saved;
  } catch {}
  return "zh-CN";
})();

export const getLang = (): Lang => currentLang;

// 通知 React 重渲染：setLang 更新此计数器 → I18nProvider 状态变化 → 子树重渲染
type LangListener = () => void;
let listeners: LangListener[] = [];

export const setLang = (lang: Lang) => {
  currentLang = lang;
  try {
    localStorage.setItem("lang", lang);
  } catch {}
  listeners.forEach((fn) => fn());
};

// ──── t() 核心函数 ────
// 字符串值经 ICU MessageFormat 解析（支持 {var}、{n, plural, ...}、{v, select, ...}）
// 函数值作为向后兼容的兑底（旧代码可能仍有函数式 key）
export function t(key: string, ...args: any[]): string {
  const keys = key.split(".");
  let val: any = locales[currentLang];
  for (const k of keys) {
    val = val?.[k];
    if (val === undefined) return key;
  }
  if (typeof val === "function") return String(val(...args));
  if (typeof val === "string") return formatMessage(val, args[0] ?? {});
  return String(val);
}

// ──── React Context ────
interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const I18nCtx = createContext<I18nContextValue>({
  lang: currentLang,
  setLang,
});

/** 包裹应用根节点，提供 i18n 上下文；语言切换时子树自动重渲染 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(currentLang);

  React.useEffect(() => {
    const listener: LangListener = () => setLangState(currentLang);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return React.createElement(I18nCtx.Provider, { value: { lang, setLang } }, children);
}

/**
 * React 组件获取 t 函数。返回值随语言切换更新，触发组件重渲染。
 *
 * 用法：
 * ```tsx
 * const t = useT();
 * <span>{t("nav.brand")}</span>
 * <span>{t("history-panel.count", { n: 5 })}</span>
 * ```
 */
export function useT() {
  const { lang } = useContext(I18nCtx);
  return useCallback((key: string, ...args: any[]) => t(key, ...args), [lang]);
}

// ──── i18n Proxy（非 React 上下文，如 theme.ts） ────
// 始终代理到当前语言包，语言切换后自动跟随；但不会触发重渲染（非 React 代码无需）
// 注意：使用此代理的模块需在被 React 组件调用时读取（如 theme.ts 的 THEMES 在 Nav render 时重建）
export const i18n: Locale = new Proxy({} as Locale, {
  get(_target, prop: string) {
    return (locales[currentLang] as any)[prop];
  },
});

export default i18n;
