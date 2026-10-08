import type { QrPanelProps } from "@/interface";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import Modal from "@/components/Modal";
import { clsx } from "clsx";
import { useT } from "@/i18n";
import { useKey } from "@/hooks/useKey";

const QR_OPTIONS = {
  width: 256,
  margin: 2,
  errorCorrectionLevel: "M",
} as const;
const QR_OPTIONS_DOWNLOAD = {
  width: 512,
  margin: 2,
  errorCorrectionLevel: "M",
} as const;

const MODAL_SIZES = [512, 1024] as const;

function qrOptionsFor(size: number) {
  return {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
  } as const;
}

export default function QrPanel({ url }: QrPanelProps) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSize, setModalSize] = useState<number>(512);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!url || !canvas) {
      setError(null);
      return;
    }
    let cancelled = false;
    QRCode.toCanvas(canvas, url, QR_OPTIONS)
      .then(() => {
        if (!cancelled) setError(null);
      })
      .catch(() => {
        if (!cancelled) {
          canvas.width = canvas.width;
          setError(t("qr-panel.gen-error"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    const canvas = modalCanvasRef.current;
    if (!modalOpen || !url || !canvas) {
      setModalError(null);
      return;
    }
    let cancelled = false;
    QRCode.toCanvas(canvas, url, qrOptionsFor(modalSize))
      .then(() => {
        if (!cancelled) setModalError(null);
      })
      .catch(() => {
        if (!cancelled) setModalError(t("qr-panel.modal-gen-error"));
      });
    return () => {
      cancelled = true;
    };
  }, [modalOpen, url, modalSize]);

  useKey("Escape", () => setModalOpen(false), modalOpen);

  const handleDownload = async (size: number = QR_OPTIONS_DOWNLOAD.width) => {
    if (!url) return;

    try {
      const dataUrl = await QRCode.toDataURL(url, qrOptionsFor(size));
      let hostname = "";
      try {
        hostname = new URL(url).hostname;
      } catch {
        hostname = "";
      }
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = hostname ? `qrcode-${hostname}.png` : "qrcode.png";
      a.click();
    } catch {
      /* download failure ignored */
    }
  };

  const renderQRCode = () => {
    if (url) {
      return (
        <>
          <canvas
            ref={canvasRef}
            className="qr-canvas qr-canvas-clickable"
            title={t("qr-panel.zoom-title")}
            onClick={() => setModalOpen(true)}
          />
          {error && <div className="qr-error">{error}</div>}
        </>
      );
    }

    return <div className="qr-placeholder">{t("qr-panel.placeholder")}</div>;
  };

  return (
    <section className="card qr-card">
      <div className="card-nav">
        <h2 className="card-title">{t("qr-panel.title")}</h2>
        <button
          className="btn btn-primary"
          onClick={() => handleDownload()}
          disabled={!url || !!error}
        >
          {t("qr-panel.download-png", { size: QR_OPTIONS_DOWNLOAD.width })}
        </button>
      </div>

      {renderQRCode()}

      <Modal
        open={modalOpen && !!url}
        onClose={() => setModalOpen(false)}
        title={t("qr-panel.preview-title")}
        className="qr-modal"
        footer={
          <>
            <div className="qr-size-group">
              {MODAL_SIZES.map((s) => (
                <button
                  key={s}
                  className={clsx("qr-size-btn", modalSize === s && "active")}
                  onClick={() => setModalSize(s)}
                >
                  {s}px
                </button>
              ))}
            </div>
            <button className="btn" onClick={() => handleDownload(modalSize)}>
              {t("qr-panel.download-png", { size: modalSize })}
            </button>
          </>
        }
      >
        <div className="qr-modal-stage">
          {modalError ? (
            <div className="qr-error">{modalError}</div>
          ) : (
            <canvas
              ref={modalCanvasRef}
              className="qr-modal-canvas"
              style={{ width: `min(${modalSize}px, 80vw)`, height: "auto" }}
            />
          )}
        </div>
      </Modal>
    </section>
  );
}
