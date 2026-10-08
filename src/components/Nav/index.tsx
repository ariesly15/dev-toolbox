import { useState, useRef } from "react";
import type { Tool } from "@/interface";
import { THEMES } from "@/utils/theme";
import { GlobeIcon } from "@/components/icons";
import Dropdown from "@/components/Dropdown";
import { clsx } from "clsx";
import { useT, getLang, setLang, type Lang } from "@/i18n";
import { useAppStore } from "@/store/app";
import "./styles.css";

interface NavProps {
  tools: Tool[];
  /** 菜单触发方式："click"（默认）点击展开，"hover" 鼠标悬停展开 */
  menuTrigger?: "click" | "hover";
}

const LANGUAGES: { id: Lang; label: string }[] = [
  { id: "zh-CN", label: "中文" },
  { id: "en-US", label: "English" },
];

/**
 * 顶部导航栏：品牌 + 工具切换 + 主题菜单 + 语言菜单
 * - 主题/语言使用 Dropdown 组件，通过 triggerPrefix 展示色块/图标
 * - hover 模式：菜单内联渲染（portal=false），鼠标离开后延迟关闭
 * - 样式见同目录 styles.css
 */
export default function Nav(props: NavProps) {
  const { tools, menuTrigger = "click" } = props;
  const { activeId, setActiveId, themeId, setThemeId } = useAppStore();
  const t = useT();
  const isHover = menuTrigger === "hover";

  const [themeOpen, setThemeOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const currentTheme = THEMES.find((theme) => theme.id === themeId) || THEMES[0];
  const currentLang = getLang();
  const currentLangLabel = LANGUAGES.find((l) => l.id === currentLang)?.label ?? currentLang;

  const themeItems = THEMES.map((theme) => ({
    id: theme.id,
    label: theme.name,
    prefix: <span className="theme-dot" style={{ background: theme.accent }} />,
  }));

  const langItems = LANGUAGES.map((lang) => ({
    id: lang.id,
    label: lang.label,
  }));

  /** hover 模式：进入立即开（同时关掉另一个），离开延迟关 */
  const hoverHandlers = (setOpen: (v: boolean) => void, setOther: (v: boolean) => void) => {
    if (!isHover) return {};

    return {
      onMouseEnter: () => {
        clearTimeout(closeTimer.current);
        setOther(false);
        setOpen(true);
      },
      onMouseLeave: () => {
        closeTimer.current = setTimeout(() => setOpen(false), 120);
      },
    };
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="brand">
          <span className="brand-logo">P</span>
          <span className="brand-name">{t("nav.brand")}</span>
        </div>
        <nav className="nav-tabs">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={clsx("nav-tab", tool.id === activeId && "active")}
              onClick={() => setActiveId(tool.id)}
            >
              {tool.name}
            </button>
          ))}
          <span className="nav-tab disabled">{t("nav.more-tools")}</span>
        </nav>

        <div className="nav-settings">
          <div className="nav-menu" {...hoverHandlers(setThemeOpen, setLangOpen)}>
            <Dropdown
              items={themeItems}
              value={themeId}
              onChange={setThemeId}
              triggerShape="circle"
              triggerClassName="dropdown-trigger-nav"
              triggerPrefix={<span className="theme-dot" style={{ background: currentTheme.accent }} />}
              align="right"
              title={t("nav.current-theme", { name: currentTheme.name })}
              {...(isHover && { open: themeOpen, onOpenChange: setThemeOpen, portal: false })}
            />
          </div>
          <div className="nav-menu" {...hoverHandlers(setLangOpen, setThemeOpen)}>
            <Dropdown
              items={langItems}
              value={currentLang}
              onChange={(id) => setLang(id as Lang)}
              triggerShape="circle"
              triggerClassName="dropdown-trigger-nav"
              triggerPrefix={<GlobeIcon size={12} />}
              align="right"
              title={t("nav.current-language", { lang: currentLangLabel })}
              {...(isHover && { open: langOpen, onOpenChange: setLangOpen, portal: false })}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
