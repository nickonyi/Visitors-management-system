import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 220 }: QRCodeProps) {
  const ref = useRef<HTMLDivElement>(null);

  function download() {
    const canvas = ref.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `visitor-pass-${value.slice(0, 8)}.png`;
    a.click();
  }

  return (
    <div ref={ref} className="inline-block">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <QRCodeCanvas
          value={value}
          size={size}
          level="M"
          includeMargin={false}
          fgColor="#0f172a"
        />
      </div>
      <button
        onClick={download}
        className="sr-only"
        aria-label="Download QR code"
        id="qr-download-btn"
      />
    </div>
  );
}

export function downloadQR(value: string) {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `visitor-pass-${value.slice(0, 8)}.png`;
  a.click();
}
