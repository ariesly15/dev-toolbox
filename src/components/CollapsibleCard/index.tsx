import type { CollapsibleCardProps } from "@/interface";
import { useState } from "react";
import { ArrowIcon } from "@/components/icons";
import { clsx } from "clsx";
import { useT } from "@/i18n";
import "./styles.css";

/**
 * 可折叠卡片组件
 * - 点击标题栏折叠/展开
 * - 可选副标题（折叠/展开时不同）
 * - 可选操作按钮（支持函数式，按 collapsed 状态渲染）
 * - 箭头独立按钮置于最右
 * - 样式见同目录 styles.css
 */
export default function CollapsibleCard(props: CollapsibleCardProps) {
  const {
    title,
    subtitle,
    collapsedSubtitle,
    titleExtra,
    actions,
    defaultCollapsed = false,
    className,
    children,
    onCollapsedChange,
  } = props;

  const t = useT();

  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  const resolvedActions = typeof actions === "function" ? actions(collapsed) : actions;

  return (
    <section className={clsx("card", collapsed && "card-collapsed", className)}>
      <h2 className="card-title card-title-collapsible">
        <button
          className="collapse-toggle"
          onClick={toggle}
          aria-expanded={!collapsed}
          title={collapsed ? t("common.expand") : t("common.collapse")}
        >
          {title}
          {collapsed && collapsedSubtitle}
          {!collapsed && subtitle}
        </button>
        {resolvedActions}
        {titleExtra}
        <button
          className="collapse-arrow-btn"
          onClick={toggle}
          tabIndex={-1}
          aria-hidden="true"
          title={collapsed ? t("common.expand") : t("common.collapse")}
        >
          <ArrowIcon className={clsx("collapse-arrow", collapsed && "collapsed")} />
        </button>
      </h2>
      {!collapsed && children}
    </section>
  );
}
