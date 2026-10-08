import { create } from "zustand";
import { loadThemeId, saveThemeId } from "@/utils/theme";

interface AppState {
  /** 当前活动工具 ID */
  activeId: string;
  /** 当前主题 ID */
  themeId: string;
  /** 待解析的 URL（跨工具跳转用，消费后置 null） */
  pendingUrl: string | null;
  /** 切换活动工具 */
  setActiveId: (id: string) => void;
  /** 切换主题（同步写入 localStorage） */
  setThemeId: (id: string) => void;
  /** 加载 URL 到解析器并切换工具 */
  loadUrl: (url: string) => void;
  /** 消费完 pendingUrl 后清空 */
  clearPendingUrl: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeId: "url-parser",
  themeId: loadThemeId(),
  pendingUrl: null,

  setActiveId: (id) => set({ activeId: id }),
  setThemeId: (id) => {
    saveThemeId(id);
    set({ themeId: id });
  },
  loadUrl: (url) => set({ pendingUrl: url, activeId: "url-parser" }),
  clearPendingUrl: () => set({ pendingUrl: null }),
}));
