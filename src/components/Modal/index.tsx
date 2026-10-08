import { useRef } from "react";
import { clsx } from "clsx";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useKey } from "@/hooks/useKey";
import { useT } from "@/i18n";
import "./styles.css";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** 入场动画：scale（默认，微调缩放）| zoom（从小到大弹出） */
  animation?: "scale" | "zoom";
}

/**
 * 通用弹窗组件
 * - 遮罩层点击关闭
 * - ESC 键关闭
 * - 标题栏 + 关闭按钮
 * - 可选 footer
 * - 样式见同目录 styles.css（消费方特化如 .modal.qr-modal 仍留全局）
 */
export default function Modal(props: ModalProps) {
  const { open, onClose, title, children, footer, className, animation } = props;
  const t = useT();
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, onClose, open);
  useKey("Escape", onClose, open);

  if (!open) return null;

  const modalCls = clsx("modal", className, animation === "zoom" && "modal-animate-zoom");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div ref={modalRef} className={modalCls} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn-icon modal-close" onClick={onClose} title={t("common.close")}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
