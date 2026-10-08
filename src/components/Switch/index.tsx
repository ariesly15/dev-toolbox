import { clsx } from "clsx";
import "./styles.css";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * 开关（受控）
 * - 渲染为 label，点击即切换
 * - 样式见同目录 styles.css（.toggle-switch / .toggle-track）
 */
export default function ToggleSwitch(props: ToggleSwitchProps) {
  const { checked, onChange, title, className, disabled } = props;
  return (
    <label className={clsx("toggle-switch", className)} title={title}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  );
}
