import type { ComponentType, ReactNode } from "react";

// ──── URL 解析 ────

/** URL 查询参数条目 */
export interface UrlParam {
  key: string;
  value: string;
  enabled: boolean;
}

/** URL 各组成部分 */
export interface UrlParts {
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  params: UrlParam[];
}

/** URL 组成部分名称（排除 params） */
export type PartName = Exclude<keyof UrlParts, "params">;

/** URL 解析状态 */
export type ParseStatus = "ok" | "invalid" | "empty";

/** URL 解析结果 */
export interface ParseResult {
  status: ParseStatus;
  parts: UrlParts | null;
}

/** URL 参数值类型 */
export type ValueType = "plain" | "json" | "url";

/** URL JSON 序列化结构 */
export interface UrlJsonRepresentation {
  href: string | null;
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  params: Record<string, string | string[]>;
}

/** URL 嵌套树节点 */
export interface URLTreeNode {
  url: string;
  label: string;
  children: { paramName: string; node: URLTreeNode }[];
}

// ──── 历史记录 ────

/** 历史记录条目 */
export interface HistoryEntry {
  url: string;
  ts: number;
  note?: string;
  pinned?: boolean;
}

// ──── Cron 表达式 ────

/** Cron 字段名称 */
export type CronFieldName = "minute" | "hour" | "dom" | "month" | "dow";

/** Cron 字段解析结果 */
export interface CronField {
  name: CronFieldName;
  raw: string;
  /** 归一化后的取值边界（星期为 0-6） */
  min: number;
  max: number;
  /** 展开去重升序值（星期归一化到 0-6） */
  values: number[];
  /** 是否覆盖全范围 */
  isAll: boolean;
  /** /n 语法的步长（非步长语法为 null） */
  step: number | null;
  /** 步长/范围的原始起止（星期可能为 7，展示时按 %7 取名） */
  rangeFrom: number | null;
  rangeTo: number | null;
  /** 原始字段是否受限（非 * / ?） */
  restricted: boolean;
}

/** Cron 表达式解析结果 */
export interface CronParseResult {
  ok: boolean;
  /** i18n key + 参数，由调用方经 t 渲染 */
  error: { key: string; vars: Record<string, unknown> } | null;
  fields: CronField[];
}

/** i18n 翻译函数签名（与 useT 返回值兼容） */
export type CronTFn = (key: string, vars?: Record<string, unknown>) => string;

// ──── 工具注册 ────

/** 工具注册条目 */
export interface Tool {
  id: string;
  name: string;
  component: ComponentType<any>;
}

// ──── JSX 组件 ────

/**
 * Dropdown 选项条目
 * - 用于单选/多选下拉菜单的每一项
 * - id 作为唯一标识，label 作为展示文案
 */
export interface DropdownItem {
  /** 选项唯一标识 */
  id: string;
  /** 选项展示文案 */
  label: string;
  /** 多选模式下的勾选状态 */
  checked?: boolean;
  /** 选项标签前的自定义内容（如图标、色块） */
  prefix?: ReactNode;
}

/**
 * Dropdown 公共 props（供 SingleSelect/MultiSelect 继承）
 * - 包含触发器样式、菜单定位、受控模式等通用配置
 */
export interface DropdownCommonProps {
  /** 选项列表 */
  items: DropdownItem[];
  /** 触发按钮附加类名（如 "btn btn-ghost history-filter"） */
  triggerClassName?: string;
  /** 菜单对齐方向，默认单选 left、多选 right */
  align?: "left" | "right";
  /** 单选菜单最小宽度（取触发器宽度与此值的较大者） */
  minWidth?: number;
  /** 菜单最大高度（px），覆盖默认的 200px */
  maxHeight?: number;
  /** 触发器原生 title 属性 */
  title?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 触发器 label 前的自定义内容（如图标、色块） */
  triggerPrefix?: ReactNode;
  /** 触发器外形，当前仅支持 "circle"（圆形，仅展示 prefix + caret） */
  triggerShape?: "circle";
  /** 菜单是否内联渲染（absolute）而非 fixed 定位，适用于 hover 场景 */
  portal?: boolean;
  /** 受控模式：外部控制开关状态 */
  open?: boolean;
  /** 开关状态变化回调 */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Dropdown 单选模式 props
 * - 点击选项即选中并关闭菜单
 * - 触发器展示所选 label
 */
export interface SingleSelectProps extends DropdownCommonProps {
  /** 模式标识，可选省略（默认单选） */
  mode?: "single";
  /** 当前选中项 id */
  value: string;
  /** 选中项变化回调 */
  onChange: (id: string) => void;
  /** value 无匹配项时触发器展示的占位文本，默认 "—" */
  placeholder?: string;
}

/**
 * Dropdown 多选模式 props
 * - 选项为「文案 + 开关」，切换不关闭菜单
 * - 触发器展示自定义 label（如 "过滤" / "过滤 · 2"）
 */
export interface MultiSelectProps extends DropdownCommonProps {
  /** 模式标识，必填 "multi" */
  mode: "multi";
  /** 选项开关切换回调 */
  onToggle: (id: string) => void;
  /** 触发按钮文案（如 "过滤" / "过滤 · 2"） */
  label: ReactNode;
  /** 触发按钮是否高亮（有生效项时） */
  active?: boolean;
}

/** Dropdown props 联合类型 */
export type DropdownProps = SingleSelectProps | MultiSelectProps;

/**
 * 可折叠卡片 props
 * - 点击标题栏折叠/展开
 * - 可选副标题（折叠/展开时不同）
 * - 可选操作按钮（支持函数式，按 collapsed 状态渲染）
 * - 箭头独立按钮置于最右
 */
export interface CollapsibleCardProps {
  /** 标题文案 */
  title: string;
  /** 副标题（展开时展示） */
  subtitle?: ReactNode;
  /** 副标题（折叠时展示） */
  collapsedSubtitle?: ReactNode;
  /** 标题行内、折叠按钮外的额外内容（展开时展示） */
  titleExtra?: ReactNode;
  /** 操作按钮区域（支持函数式，按 collapsed 状态渲染不同内容） */
  actions?: ReactNode | ((collapsed: boolean) => ReactNode);
  /** 默认是否折叠 */
  defaultCollapsed?: boolean;
  /** 卡片附加类名 */
  className?: string;
  /** 折叠状态变化回调 */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** 卡片内容 */
  children: ReactNode;
}

/**
 * 图标组件基础 props
 * - 所有图标组件的通用配置
 */
export interface IconProps {
  /** 附加类名 */
  className?: string;
  /** 图标尺寸（宽高），默认由各图标内部定义 */
  size?: number;
  /** 图标颜色，默认 "currentColor" */
  color?: string;
}

/**
 * Pin 图标 props（支持 filled 变体）
 * - 用于历史记录置顶功能
 */
export interface PinIconProps extends IconProps {
  /** 是否填充样式（已置顶状态） */
  filled?: boolean;
}

/**
 * URL 解析器组件 props
 * - 用于 URL 输入、解析、编辑的主面板
 */
export interface UrlParserProps {
  /** 初始 URL（跨工具跳转时传入） */
  initialUrl?: string | null;
  /** URL 消费完成回调（如从 JSON 查看器跳转后触发） */
  onUrlConsumed?: () => void;
}

/**
 * URL 解析器 ref handle（暴露给父组件的方法）
 * - 通过 useRef<UrlParserHandle> 获取
 * - 用于跨工具跳转：JSON 查看器点击 URL → 切换到 URL 解析器并加载
 */
export interface UrlParserHandle {
  /** 加载 URL 到解析器 */
  loadUrl: (url: string) => void;
}

/** 自定义查询参数类型 */
export type CustomQueryType = "boolean" | "list" | "string";

/** 自定义查询参数条目 */
export interface CustomQuery {
  id: string;
  key: string;
  type: CustomQueryType;
  options: string[];
  value: string;
  enabled?: boolean;
}

/**
 * URL 树节点组件 props
 * - 递归渲染 URL 嵌套树的单个节点
 */
export interface TreeNodeProps {
  /** 当前节点数据 */
  node: URLTreeNode;
  /** 当前节点在树中的路径索引数组 */
  path: number[];
  /** 当前激活节点的路径索引数组 */
  activePath: number[];
  /** 节点选择回调 */
  onSelect: (path: number[]) => void;
  /** 节点标签映射（URL → 深度优先序号如 "#1"、"#2"） */
  tags: Map<string, string>;
}

/**
 * URL 面包屑导航条目
 * - 用于构建面包屑路径中的单个节点
 */
export interface BreadcrumbItem {
  /** 节点展示文案 */
  label: string;
  /** 节点标签（深度优先序号） */
  tag: string;
  /** 节点在树中的路径索引数组 */
  path: number[];
}

/**
 * URL 面包屑组件 props
 * - 展示 URL 树导航路径，点击可跳转到任意祖先节点
 */
export interface URLBreadcrumbProps {
  /** 树根节点 */
  root: URLTreeNode;
  /** 当前激活节点的路径索引数组 */
  activePath: number[];
  /** 节点选择回调 */
  onSelect: (path: number[]) => void;
  /** 节点标签映射 */
  tags: Map<string, string>;
}

/**
 * URL 树视图组件 props
 * - 可视化展示 URL 嵌套结构（如 URL 中包含子 URL 参数）
 */
export interface URLTreeViewProps {
  /** 树根节点 */
  root: URLTreeNode;
  /** 当前激活节点的路径索引数组 */
  activePath: number[];
  /** 节点选择回调 */
  onSelect: (path: number[]) => void;
  /** 节点标签映射 */
  tags: Map<string, string>;
}

/**
 * 二维码面板 props
 * - 展示当前 URL 的二维码，支持下载
 */
export interface QrPanelProps {
  /** 待生成二维码的 URL，null 时展示空态 */
  url: string | null;
}

/**
 * Cron 构建器 props
 * - 可视化构建 Cron 表达式
 * - 支持预设载入与逐字段编辑
 */
export interface CronBuilderProps {
  /** 构建完成回调，返回生成的 Cron 表达式 */
  onUse: (expression: string) => void;
}
