import type { CronFieldName, CronField, CronParseResult, CronTFn } from "@/interface";

/**
 * Cron 表达式（5 字段：分 时 日 月 星期）解析与推演
 *
 * 约定：
 * - 支持 * 、n 、a-b 、* /n 、a-b/n 、n/step 及逗号列表；星期 7≡0；?≡*；星期/月份支持英文缩写名
 * - 日与星期同时受限时按「或」语义匹配（Vixie cron 规则）
 * - 纯逻辑层：描述/展开文案经注入的 t 函数走 i18n（key 见 i18n/zh-CN.ts 的 cron-desc / cron-field）
 */

export const CRON_FIELD_DEFS: { name: CronFieldName; min: number; max: number }[] = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "dom", min: 1, max: 31 },
  { name: "month", min: 1, max: 12 },
  { name: "dow", min: 0, max: 7 },
];

const DOW_NAMES: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const MAX_SCAN_DAYS = 366 * 30;

const pad2 = (n: number) => String(n).padStart(2, "0");

function tokenToNumber(token: string, fieldName: CronFieldName): number | null {
  if (/^\d+$/.test(token)) return Number(token);
  const lower = token.toLowerCase();
  if (fieldName === "dow" && lower in DOW_NAMES) return DOW_NAMES[lower];
  if (fieldName === "month" && lower in MONTH_NAMES) return MONTH_NAMES[lower];
  return null;
}

interface PartResult {
  values: number[];
  step: number | null;
  from: number;
  to: number;
}

/** 解析单个逗号分段（星号、单值、范围，以及各自的 /n 步进形式），非法返回 null */
function parsePart(part: string, def: { min: number; max: number }, fieldName: CronFieldName): PartResult | null {
  let step: number | null = null;
  let body = part;
  const slash = part.indexOf("/");
  if (slash !== -1) {
    const stepToken = part.slice(slash + 1);
    if (!/^\d+$/.test(stepToken)) return null;
    step = Number(stepToken);
    if (step < 1) return null;
    body = part.slice(0, slash);
  }

  let from: number;
  let to: number;
  if (body === "*") {
    from = def.min;
    to = def.max;
  } else if (body.includes("-")) {
    const [a, b] = body.split("-");
    const va = tokenToNumber(a, fieldName);
    const vb = tokenToNumber(b, fieldName);
    if (va === null || vb === null || va > vb) return null;
    from = va;
    to = vb;
  } else {
    const v = tokenToNumber(body, fieldName);
    if (v === null) return null;
    // n/step 按 Vixie 语义视为 n-max/step
    from = v;
    to = step !== null ? def.max : v;
  }
  if (from < def.min || to > def.max) return null;

  const values: number[] = [];
  for (let v = from; v <= to; v += step ?? 1) values.push(v);
  return { values, step, from, to };
}

function parseField(raw: string, def: { name: CronFieldName; min: number; max: number }): CronField | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const body = trimmed === "?" ? "*" : trimmed;

  const parts = body.split(",");
  const valueSet = new Set<number>();
  let step: number | null = null;
  let from: number | null = null;
  let to: number | null = null;
  for (const part of parts) {
    if (!part) return null;
    const r = parsePart(part, def, def.name);
    if (!r) return null;
    r.values.forEach((v) => valueSet.add(v));
    if (parts.length === 1) {
      step = r.step;
      from = r.from;
      to = r.to;
    }
  }

  // 星期归一化：7≡0，边界收敛到 0-6
  const isDow = def.name === "dow";
  const min = isDow ? 0 : def.min;
  const max = isDow ? 6 : def.max;
  const values = [...valueSet].map((v) => (isDow && v === 7 ? 0 : v));
  values.sort((a, b) => a - b);
  const unique = values.filter((v, i) => i === 0 || v !== values[i - 1]);

  return {
    name: def.name,
    raw: trimmed,
    min,
    max,
    values: unique,
    isAll: unique.length === max - min + 1 && unique[0] === min,
    step,
    rangeFrom: from,
    rangeTo: to,
    restricted: trimmed !== "*" && trimmed !== "?",
  };
}

/** 解析整条表达式；失败时返回 i18n error key 与参数 */
export function parseCron(expression: string): CronParseResult {
  const tokens = expression.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { ok: false, error: null, fields: [] };
  if (tokens.length !== CRON_FIELD_DEFS.length) {
    return { ok: false, error: { key: "cron-parser.error-fields", vars: { n: tokens.length } }, fields: [] };
  }
  const fields: CronField[] = [];
  for (let i = 0; i < CRON_FIELD_DEFS.length; i++) {
    const field = parseField(tokens[i], CRON_FIELD_DEFS[i]);
    if (!field) {
      return {
        ok: false,
        error: { key: "cron-parser.error-field", vars: { field: tokens[i], index: i + 1 } },
        fields: [],
      };
    }
    fields.push(field);
  }
  return { ok: true, error: null, fields };
}

/** 是否为「全范围等步长」语法（如 *\/15） */
function isSimpleStep(f: CronField): boolean {
  if (f.step === null) return false;
  const count = Math.floor((f.max - f.min) / f.step) + 1;
  return f.values.length === count && f.values.every((v, i) => v === f.min + i * f.step!);
}

const isSingle = (f: CronField) => f.values.length === 1 && f.step === null;

/** 值是否为连续区间（步长 1 的 a-b） */
const isContiguous = (f: CronField) =>
  f.step === null && f.values.length > 1 && f.values[f.values.length - 1] - f.values[0] === f.values.length - 1;

const joinList = (values: number[], t: CronTFn) => values.join(t("cron-desc.list-joiner"));

function minutePhrase(f: CronField, t: CronTFn): string {
  if (f.isAll) return t("cron-desc.every-minute");
  if (f.step !== null) {
    return isSimpleStep(f)
      ? t("cron-desc.every-minutes", { n: f.step })
      : t("cron-desc.minute-range-step", { n: f.step, a: f.rangeFrom, b: f.rangeTo });
  }
  if (isSingle(f)) return t("cron-desc.at-minute", { m: f.values[0] });
  if (isContiguous(f)) return t("cron-desc.minute-range", { a: f.values[0], b: f.values[f.values.length - 1] });
  return t("cron-desc.at-minutes", { list: joinList(f.values, t) });
}

function hourPhrase(f: CronField, t: CronTFn): string {
  if (f.isAll) return t("cron-desc.every-hour");
  if (f.step !== null) {
    return isSimpleStep(f)
      ? t("cron-desc.every-hours", { n: f.step })
      : t("cron-desc.hour-range-step", { n: f.step, a: pad2(f.rangeFrom!), b: pad2(f.rangeTo!) });
  }
  if (isSingle(f)) return t("cron-desc.at-hour", { h: f.values[0] });
  if (isContiguous(f))
    return t("cron-desc.hour-range", { a: pad2(f.values[0]), b: pad2(f.values[f.values.length - 1]) });
  return t("cron-desc.at-hours", { list: joinList(f.values, t) });
}

function domPhrase(f: CronField, t: CronTFn): string | null {
  if (!f.restricted) return null;
  if (f.step !== null) {
    return isSimpleStep(f)
      ? t("cron-desc.dom-step", { n: f.step })
      : t("cron-desc.dom-range-step", { n: f.step, a: f.rangeFrom, b: f.rangeTo });
  }
  if (isSingle(f)) return t("cron-desc.dom-single", { d: f.values[0] });
  if (isContiguous(f)) return t("cron-desc.dom-range", { a: f.values[0], b: f.values[f.values.length - 1] });
  return t("cron-desc.dom-list", { list: joinList(f.values, t) });
}

const monthName = (v: number, t: CronTFn) => t(`cron-date.month-${v}`);

function monthPhrase(f: CronField, t: CronTFn): string | null {
  if (!f.restricted) return null;
  if (f.step !== null) {
    return isSimpleStep(f)
      ? t("cron-desc.month-step", { n: f.step })
      : t("cron-desc.month-range-step", {
          n: f.step,
          a: monthName(f.rangeFrom!, t),
          b: monthName(f.rangeTo!, t),
        });
  }
  if (isSingle(f)) return t("cron-desc.month-single", { m: monthName(f.values[0], t) });
  if (isContiguous(f))
    return t("cron-desc.month-range", {
      a: monthName(f.values[0], t),
      b: monthName(f.values[f.values.length - 1], t),
    });
  return t("cron-desc.month-list", { list: f.values.map((v) => monthName(v, t)).join(t("cron-desc.list-joiner")) });
}

/** 星期名（取值允许 7，按 %7 映射到周日） */
const weekdayName = (v: number, t: CronTFn) => t(`cron-date.weekday-${v % 7}`);

function dowPhrase(f: CronField, t: CronTFn): string | null {
  if (!f.restricted) return null;
  if (f.step !== null) {
    return isSimpleStep(f)
      ? t("cron-desc.dow-step", { n: f.step })
      : t("cron-desc.dow-range-step", {
          n: f.step,
          a: weekdayName(f.rangeFrom!, t),
          b: weekdayName(f.rangeTo!, t),
        });
  }
  if (isSingle(f)) return t("cron-desc.dow-single", { d: weekdayName(f.values[0], t) });
  if (isContiguous(f))
    return t("cron-desc.dow-range", {
      a: weekdayName(f.values[0], t),
      b: weekdayName(f.values[f.values.length - 1], t),
    });
  return t("cron-desc.dow-list", {
    list: f.values.map((v) => weekdayName(v, t)).join(t("cron-desc.list-joiner")),
  });
}

/**
 * 生成自然语言描述（如「每 15 分钟，在 09:00 到 17:59 之间，星期一到星期五」）
 * 首字母大写由调用方按语言处理
 */
export function describeCron(fields: CronField[], t: CronTFn): string {
  const [minute, hour, dom, month, dow] = fields;
  const segments: string[] = [];

  // 时间部分：常见组合合并为单句，其余按「分短语 + 时短语」拼接
  if (minute.isAll && hour.isAll) segments.push(t("cron-desc.every-minute"));
  else if (isSimpleStep(minute) && hour.isAll) segments.push(t("cron-desc.every-minutes", { n: minute.step }));
  else if (minute.isAll && isSimpleStep(hour))
    segments.push(t("cron-desc.every-minute-every-hours", { n: hour.step }));
  else if (isSingle(minute) && hour.isAll)
    segments.push(t("cron-desc.minute-of-every-hour", { m: minute.values[0] }));
  else if (isSingle(minute) && isSingle(hour))
    segments.push(t("cron-desc.at-time", { time: `${pad2(hour.values[0])}:${pad2(minute.values[0])}` }));
  else {
    segments.push(minutePhrase(minute, t));
    segments.push(hourPhrase(hour, t));
  }

  for (const phrase of [domPhrase(dom, t), monthPhrase(month, t), dowPhrase(dow, t)]) {
    if (phrase) segments.push(phrase);
  }

  return segments.join(t("cron-desc.joiner"));
}

/** 字段明细的「展开」列文案 */
export function expandField(f: CronField, t: CronTFn): string {
  if (f.isAll) return t(`cron-field.all-${f.name}`);
  if (f.step !== null)
    return t("cron-field.step-values", { step: f.step, from: f.values[0], to: f.values[f.values.length - 1] });
  if (f.values.length <= 7) return f.values.join(", ");
  const head = f.values.slice(0, 6).join(", ");
  return `${head} … ${f.values[f.values.length - 1]} ${t("cron-field.values-count", { n: f.values.length })}`;
}

/**
 * 推演接下来 count 次运行时间（升序）
 * 按天外层循环 + 匹配日内的时/值组合，避免逐分钟扫描
 */
export function nextRuns(fields: CronField[], from: Date, count: number, utc: boolean): Date[] {
  const [minute, hour, dom, month, dow] = fields;
  const minuteSet = new Set(minute.values);
  const hourSet = new Set(hour.values);
  const domSet = new Set(dom.values);
  const monthSet = new Set(month.values);
  const dowSet = new Set(dow.values);

  // 起算点：当前分钟下一秒归零后的下一分钟
  const start = new Date(from.getTime());
  start.setSeconds(0, 0);
  start.setTime(start.getTime() + 60_000);

  const results: Date[] = [];
  const baseYear = utc ? start.getUTCFullYear() : start.getFullYear();
  const baseMonth = utc ? start.getUTCMonth() : start.getMonth();
  const baseDay = utc ? start.getUTCDate() : start.getDate();

  for (let dayOffset = 0; dayOffset < MAX_SCAN_DAYS && results.length < count; dayOffset++) {
    const day = utc
      ? new Date(Date.UTC(baseYear, baseMonth, baseDay + dayOffset))
      : new Date(baseYear, baseMonth, baseDay + dayOffset);
    const domValue = utc ? day.getUTCDate() : day.getDate();
    const monthValue = (utc ? day.getUTCMonth() : day.getMonth()) + 1;
    const dowValue = utc ? day.getUTCDay() : day.getDay();

    if (!monthSet.has(monthValue)) continue;
    // 日与星期同时受限 → 命中其一即可；仅一方受限 → 以该方为准
    const domHit = domSet.has(domValue);
    const dowHit = dowSet.has(dowValue);
    if (dom.restricted && dow.restricted) {
      if (!domHit && !dowHit) continue;
    } else if (dom.restricted && !domHit) continue;
    else if (dow.restricted && !dowHit) continue;

    for (const h of hour.values) {
      for (const m of minute.values) {
        if (!hourSet.has(h) || !minuteSet.has(m)) continue;
        const run = utc
          ? new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), domValue, h, m, 0))
          : new Date(day.getFullYear(), day.getMonth(), domValue, h, m, 0);
        if (run.getTime() < start.getTime()) continue;
        results.push(run);
        if (results.length >= count) return results;
      }
    }
  }
  return results;
}

/** 格式化运行时间：星期缩写 + YYYY-MM-DD HH:mm:ss */
export function formatRun(run: Date, utc: boolean, t: CronTFn): string {
  const y = utc ? run.getUTCFullYear() : run.getFullYear();
  const mo = (utc ? run.getUTCMonth() : run.getMonth()) + 1;
  const d = utc ? run.getUTCDate() : run.getDate();
  const h = utc ? run.getUTCHours() : run.getHours();
  const mi = utc ? run.getUTCMinutes() : run.getMinutes();
  const wd = t(`cron-date.weekday-short-${utc ? run.getUTCDay() : run.getDay()}`);
  return `${wd} ${y}-${pad2(mo)}-${pad2(d)} ${pad2(h)}:${pad2(mi)}:00`;
}

export type { CronFieldName, CronField, CronParseResult, CronTFn } from "@/interface";
