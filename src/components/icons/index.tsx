import type { IconProps, PinIconProps } from "@/interface";

/* ---- Arrow (chevron right) ---- */
export function ArrowIcon(props: IconProps) {
  const { className, size = 12, color = "currentColor" } = props;
  return (
    <svg className={className} width={size * 0.67} height={size} viewBox="0 0 8 12" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.46494 6L1.83387 8.63107C1.75868 8.70627 1.70073 8.79298 1.66004 8.89123C1.61935 8.98947 1.599 9.09176 1.599 9.1981C1.599 9.30444 1.61935 9.40673 1.66004 9.50497C1.70073 9.60322 1.75868 9.68994 1.83387 9.76513C1.8711 9.80236 1.91161 9.8356 1.95539 9.86486C1.99917 9.89411 2.04538 9.91881 2.09402 9.93896C2.14267 9.95911 2.19281 9.97432 2.24446 9.98459C2.2961 9.99486 2.34824 10 2.4009 10C2.45355 10 2.5057 9.99486 2.55734 9.98459C2.60898 9.97432 2.65913 9.95911 2.70777 9.93896C2.75642 9.91881 2.80263 9.89411 2.84641 9.86486C2.89019 9.8356 2.93069 9.80236 2.96793 9.76513L6.16603 6.56703C6.24122 6.49184 6.29916 6.40512 6.33986 6.30687C6.38055 6.20863 6.4009 6.10634 6.4009 6C6.4009 5.89366 6.38055 5.79137 6.33986 5.69313C6.29916 5.59488 6.24122 5.50817 6.16603 5.43297L2.96793 2.23487C2.93069 2.19764 2.89019 2.1644 2.84641 2.13514C2.80263 2.10589 2.75642 2.08119 2.70777 2.06104C2.65913 2.04089 2.60898 2.02568 2.55734 2.01541C2.5057 2.00514 2.45355 2 2.4009 2C2.34824 2 2.2961 2.00514 2.24446 2.01541C2.19281 2.02568 2.14267 2.04089 2.09402 2.06104C2.04538 2.08119 1.99917 2.10589 1.95539 2.13514C1.91161 2.1644 1.8711 2.19764 1.83387 2.23487C1.79664 2.2721 1.7634 2.31261 1.73414 2.35639C1.70489 2.40017 1.68019 2.44638 1.66004 2.49503C1.63989 2.54367 1.62468 2.59381 1.61441 2.64546C1.60414 2.6971 1.599 2.74925 1.599 2.8019C1.599 2.85455 1.60414 2.9067 1.61441 2.95834C1.62468 3.00998 1.63989 3.06013 1.66004 3.10877C1.68019 3.15742 1.70489 3.20363 1.73414 3.24741C1.7634 3.29119 1.79664 3.3317 1.83387 3.36893L4.46494 6Z"
        fill={color}
      />
    </svg>
  );
}

/* ---- ChevronDown (下拉 caret，用于 Dropdown 触发器) ---- */
export function ChevronDownIcon(props: IconProps) {
  const { className, size = 12, color = "currentColor" } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ---- Gear (settings cog) ---- */
export function GearIcon(props: IconProps) {
  const { className, size = 16 } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* ---- Pin (thumbtack) ---- */

export function PinIcon(props: PinIconProps) {
  const { className, size = 15, filled = false } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z" />
    </svg>
  );
}

/* ---- Tag (custom param badge) ---- */
export function TagIcon(props: IconProps) {
  const { className, size = 12 } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 8.5V13a1 1 0 0 0 1 1h4.5L14 7.5 9.5 3 2 8.5Z" />
      <circle cx="6" cy="10" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ---- Fuzzy (wildcard asterisk，模糊匹配) ---- */
export function FuzzyIcon(props: IconProps) {
  const { className, size = 14 } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M18 8.5L6 15.5" />
      <path d="M6 8.5L18 15.5" />
    </svg>
  );
}

/* ---- Close (清空/关闭 ✕) ---- */
export function CloseIcon(props: IconProps) {
  const { className, size = 14 } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

/* ---- Globe (语言 · Lucide languages) ---- */
export function GlobeIcon(props: IconProps) {
  const { className, size = 14 } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 8l6 6" />
      <path d="m4 14l6-6l2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22l-5-10l-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

/* ---- Funnel (漏斗/过滤 · Lucide funnel) ---- */
export function FunnelIcon(props: IconProps) {
  const { className, size = 14 } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z" />
    </svg>
  );
}

/* ---- Image (图片预览) ---- */
export function ImageIcon(props: IconProps) {
  const { className, size = 14 } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

/* ---- Link (URL 解析) ---- */
export function LinkIcon(props: IconProps) {
  const { className, size = 14 } = props;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 1024 1024">
      <path
        fill="currentColor"
        d="M578.133 675.627c-3.306-3.307-8.746-3.307-12.053 0L442.133 799.573c-57.386 57.387-154.24 63.467-217.6 0-63.466-63.466-57.386-160.213 0-217.6L348.48 458.027c3.307-3.307 3.307-8.747 0-12.054l-42.453-42.453c-3.307-3.307-8.747-3.307-12.054 0L170.027 527.467c-90.24 90.24-90.24 236.266 0 326.4s236.266 90.24 326.4 0L620.373 729.92c3.307-3.307 3.307-8.747 0-12.053l-42.24-42.24z m275.84-505.6c-90.24-90.24-236.266-90.24-326.4 0L403.52 293.973c-3.307 3.307-3.307 8.747 0 12.054l42.347 42.346c3.306 3.307 8.746 3.307 12.053 0l123.947-123.946c57.386-57.387 154.24-63.467 217.6 0 63.466 63.466 57.386 160.213 0 217.6L675.52 565.973c-3.307 3.307-3.307 8.747 0 12.054l42.453 42.453c3.307 3.307 8.747 3.307 12.054 0l123.946-123.947c90.134-90.24 90.134-236.266 0-326.506z"
      />
      <path
        fill="currentColor"
        d="M616.64 362.987c-3.307-3.307-8.747-3.307-12.053 0l-241.6 241.493c-3.307 3.307-3.307 8.747 0 12.053l42.24 42.24c3.306 3.307 8.746 3.307 12.053 0L658.773 417.28c3.307-3.307 3.307-8.747 0-12.053l-42.133-42.24z"
      />
    </svg>
  );
}

/* ---- Shield (本地处理) ---- */
export function ShieldIcon(props: IconProps) {
  const { className, size = 14 } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

/* ---- Export (upload: arrow up + tray) ---- */
export function ExportIcon(props: IconProps) {
  const { className, size = 14, color = "currentColor" } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 17V3" />
      <path d="M5 10l7-7 7 7" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

/* ---- Import (download: arrow down + tray) ---- */
export function ImportIcon(props: IconProps) {
  const { className, size = 14, color = "currentColor" } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v14" />
      <path d="M5 10l7 7 7-7" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

/* ---- Encode ---- */
export function EncodeIcon(props: IconProps) {
  const { className, size = 14, color = "currentColor" } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="12" width="14" height="9" rx="2" strokeWidth="2.5" />
      <path d="M8 12V7a4 4 0 0 1 8 0v5" strokeWidth="2.5" />
    </svg>
  );
}

/* ---- Decode ---- */
export function DecodeIcon(props: IconProps) {
  const { className, size = 14, color = "currentColor" } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="12" width="14" height="9" rx="2" strokeWidth="2.5" />
      <path d="M8 12V7a4 4 0 0 1 7.8-1" strokeWidth="2.5" />
    </svg>
  );
}

/* ---- Sort (A→Z + down arrow) ---- */
export function SortIcon(props: IconProps) {
  const { className, size = 14, color = "currentColor" } = props;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* A */}
      <path d="M2 10L5 3L8 10" />
      <path d="M3.5 7H6.5" />
      {/* Z */}
      <path d="M2 15H8L2 21H8" />
      {/* down arrow */}
      <path d="M17 5V19" />
      <path d="M13 15L17 19L21 15" />
    </svg>
  );
}
