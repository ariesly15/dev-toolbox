/**
 * 轻量级 ICU MessageFormat 解析器
 *
 * 支持的语法子集：
 * - 简单变量替换：{name}
 * - 复数规则：{count, plural, =0{没有} one{# 条} other{# 条}}
 * - 选择分支：{gender, select, male{他} female{她} other{ta}}
 * - # 在 plural 分支中替换为计数值
 * - 可嵌套（如 plural 内嵌 select）
 */

type Params = Record<string, any>;

/**
 * 格式化 ICU 消息模板
 * @param template ICU 模板字符串
 * @param params 变量映射
 * @returns 格式化后的字符串
 */
export function formatMessage(template: string, params: Params): string {
  return processSegment(template, 0, template.length, params);
}

// ──── 内部实现 ────

/** 处理模板的一个片段，递归处理嵌套结构 */
function processSegment(text: string, start: number, end: number, params: Params): string {
  let result = "";
  let i = start;

  while (i < end) {
    // 普通字符直接输出
    if (text[i] !== "{") {
      result += text[i];
      i++;
      continue;
    }

    // 找到 { 的匹配 }
    const closeBrace = findClosingBrace(text, i, end);
    if (closeBrace === -1) {
      result += text[i];
      i++;
      continue;
    }

    const inner = text.substring(i + 1, closeBrace);
    result += processFormat(inner, params);
    i = closeBrace + 1;
  }

  return result;
}

/** 处理单个 {...} 内的内容（不含外层花括号） */
function processFormat(inner: string, params: Params): string {
  // 检查是 plural / select 还是简单变量
  const pluralIdx = findKeyword(inner, "plural");
  const selectIdx = pluralIdx === -1 ? findKeyword(inner, "select") : -1;
  const fmtIdx = pluralIdx !== -1 ? pluralIdx : selectIdx;
  const fmtType = pluralIdx !== -1 ? "plural" : selectIdx !== -1 ? "select" : "";

  if (fmtType && fmtIdx !== -1) {
    // plural 或 select
    const varName = inner.substring(0, fmtIdx).replace(/[\s,]/g, "");
    // 跳过 keyword 后的逗号/空格
    let bStart = fmtIdx + fmtType.length;
    while (bStart < inner.length && /[\s,]/.test(inner[bStart])) bStart++;
    const branchContent = inner.substring(bStart);
    const varValue = params[varName];

    if (fmtType === "plural") return resolvePlural(branchContent, varValue, params);
    return resolveSelect(branchContent, varValue, params);
  }

  // 简单变量替换
  return String(params[inner.trim()] ?? "");
}

// ──── plural ────

function resolvePlural(content: string, count: any, params: Params): string {
  const branches = splitBranches(content);
  const n = Number(count) || 0;

  // 精确匹配 =N
  const exactKey = `=${n}`;
  let matched = branches.get(exactKey);

  // CLDR 类别匹配
  if (matched === undefined) {
    const category = getPluralCategory(n);
    matched = branches.get(category);
  }

  // 兜底 other
  if (matched === undefined) matched = branches.get("other") ?? "";

  // # 替换为计数值（在进一步解析嵌套结构之前）
  const replaced = matched.replace(/#/g, String(n));
  return processSegment(replaced, 0, replaced.length, params);
}

// ──── select ────

function resolveSelect(content: string, value: any, params: Params): string {
  const branches = splitBranches(content);
  const matched = branches.get(String(value)) ?? branches.get("other") ?? "";
  return processSegment(matched, 0, matched.length, params);
}

// ──── 辅助函数 ────

/** 在 content 中查找 keyword（如 plural/select），跳过嵌套花括号和字符串值 */
function findKeyword(content: string, keyword: string): number {
  let depth = 0;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "{") depth++;
    else if (content[i] === "}") depth--;
    else if (depth === 0 && content.substring(i, i + keyword.length) === keyword) {
      // 确认前面是空白/逗号或开头，后面是空白/逗号或结尾
      const before = i === 0 || /[\s,]/.test(content[i - 1]);
      const after = i + keyword.length >= content.length || /[\s,]/.test(content[i + keyword.length]);
      if (before && after) return i;
    }
  }
  return -1;
}

/** 从 start 位置（必须是 { ）找到匹配的 } 位置，限定在 end 范围内 */
function findClosingBrace(text: string, start: number, end: number): number {
  let depth = 0;
  for (let i = start; i < end; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** 将 plural/select 的分支内容解析为 Map<string, string>
 *  输入：'=0{没有} one{# 条} other{# 条}'
 *  输出：Map { '=0' => '没有', 'one' => '# 条', 'other' => '# 条' }
 */
function splitBranches(content: string): Map<string, string> {
  const branches = new Map<string, string>();
  let i = 0;

  while (i < content.length) {
    // 跳过空白
    while (i < content.length && /\s/.test(content[i])) i++;
    if (i >= content.length) break;

    // 读取 key（直到 { ）
    let key = "";
    while (i < content.length && content[i] !== "{") {
      key += content[i];
      i++;
    }
    key = key.trim();
    if (i >= content.length || !key) break;

    // 读取 { ... } 分支内容
    const branchStart = i;
    const branchEnd = findClosingBrace(content, branchStart, content.length);
    if (branchEnd === -1) break;

    branches.set(key, content.substring(branchStart + 1, branchEnd));
    i = branchEnd + 1;
  }

  return branches;
}

/** CLDR 英文复数类别（简化版，仅区分 1 和其他） */
function getPluralCategory(n: number): string {
  if (n === 1) return "one";
  return "other";
}
