import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ScanLine, Keyboard, X, RefreshCw } from "lucide-react";
import { useRouter } from "@/context/RouterContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export function GuardScanScreen() {
  const { navigate } = useRouter();
  const { toast } = useToast();
  const [active, setActive] = useState(false);
  const [manualToken, setManualToken] = useState("");

  function handleResult(results: { rawValue?: string }[] | undefined) {
    const raw = results?.[0]?.rawValue;
    if (!raw) return;
    try {
      const url = new URL(raw);
      const params = new URLSearchParams(url.hash.split("?")[1] ?? "");
      const token = params.get("t");
      if (token) {
        setActive(false);
        navigate(`/guard/verify?t=${token}`);
      } else {
        toast("Invalid QR code. Not a visitor pass.", "error");
      }
    } catch {
      // raw might be a bare token
      if (raw.length > 10) {
        setActive(false);
        navigate(`/guard/verify?t=${raw}`);
      } else {
        toast("Invalid QR code. Not a visitor pass.", "error");
      }
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualToken.trim()) {
      navigate(`/guard/verify?t=${manualToken.trim()}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-emerald-400 mb-4">
          <ScanLine className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Scan Visitor QR Code
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Point the camera at the visitor's QR pass to verify and check them in.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {active ? (
            <div className="space-y-4">
              <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-slate-900 scanner-frame">
                <Scanner
                  onScan={handleResult as never}
                  onError={(err) =>
                    toast(err?.message ?? "Camera error", "error")
                  }
                  constraints={{ facingMode: "environment" }}
                  scanDelay={800}
                  styles={{
                    video: {
                      height: "100%",
                      width: "100%",
                      objectFit: "cover",
                    },
                  }}
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="h-1 w-3/5 bg-emerald-400/80 rounded-full shadow-lg" />
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setActive(false)}
              >
                <X className="h-4 w-4" /> Stop camera
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto h-40 w-40 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-6">
                <ScanLine className="h-16 w-16 text-slate-300" />
              </div>
              <Button
                size="lg"
                onClick={() => setActive(true)}
                className="w-full"
              >
                <ScanLine className="h-5 w-5" /> Start Scanning
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-50 px-4 text-xs text-slate-400 uppercase tracking-wider">
            or enter manually
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Pass code
            </label>
            <div className="flex gap-2">
              <input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Enter the QR token"
                className="flex-1 h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <Button type="submit" disabled={!manualToken.trim()}>
                <Keyboard className="h-4 w-4" /> Verify
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/guard/history")}
        >
          <RefreshCw className="h-4 w-4" /> View recent scans
        </Button>
      </div>
    </div>
  );
}
