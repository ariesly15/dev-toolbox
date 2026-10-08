/**
 * 模糊子序列匹配：query 的字符按顺序出现在 text 中即算命中（大小写不敏感），
 * 不要求连续。例如 query="pp" 可命中 text="person p"（p…p）。
 *
 * @returns 命中字符在 text 中的下标数组（可用于高亮）；未命中返回 null；
 *          query 为空时返回 []（视为全部命中、无需高亮）。
 */
export function fuzzyMatch(query: string, text: string): number[] | null {
  if (!query) return [];
  const q = query.toLowerCase();
  const indices: number[] = [];
  let qi = 0;
  for (let ti = 0; ti < text.length && qi < q.length; ti++) {
    if (text[ti].toLowerCase() === q[qi]) {
      indices.push(ti);
      qi++;
    }
  }
  return qi === q.length ? indices : null;
}

/**
 * 连续子串匹配（大小写不敏感）：返回所有命中片段覆盖的下标；未命中返回 null；
 * query 为空返回 []。用于「关闭模糊匹配」时的精确子串搜索与高亮。
 */
export function substringMatch(query: string, text: string): number[] | null {
  if (!query) return [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const indices: number[] = [];
  let from = 0;
  let idx = lowerText.indexOf(lowerQuery, from);
  while (idx !== -1) {
    for (let i = 0; i < lowerQuery.length; i++) indices.push(idx + i);
    from = idx + lowerQuery.length;
    idx = lowerText.indexOf(lowerQuery, from);
  }
  return indices.length > 0 ? indices : null;
}
