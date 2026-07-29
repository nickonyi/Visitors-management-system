import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Car,
  Users,
  Phone,
  FileText,
  Home,
  Share2,
  Download,
  MessageCircle,
  X,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/context/RouterContext";
import { useToast } from "@/components/ui/Toast";
import { cancelPass } from "@/hooks/useVisitorPasses";
import { supabase } from "@/lib/supabase";
import { QRCode, downloadQR } from "@/components/QRCode";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import { effectiveStatus } from "@/lib/status";
import type { VisitorPass } from "@/types";

export function VisitorDetailsScreen({ passId }: { passId: string }) {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const { toast } = useToast();
  const [pass, setPass] = useState<VisitorPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("visitor_passes")
        .select("*")
        .eq("id", passId)
        .maybeSingle();
      if (active) {
        if (error) toast(error.message, "error");
        setPass((data as VisitorPass) ?? null);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [passId, toast]);

  async function handleCancel() {
    if (!pass) return;
    setCancelling(true);
    try {
      await cancelPass(pass.id);
      toast("Visitor pass cancelled.", "success");
      setConfirmCancel(false);
      navigate("/resident");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to cancel pass.",
        "error",
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!pass) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Visitor pass not found.</p>
        <Button onClick={() => navigate("/resident")} className="mt-4">
          Back to dashboard
        </Button>
      </div>
    );
  }

  const status = effectiveStatus(pass);
  const qrValue = `${window.location.origin}/#/guard/verify?t=${pass.qr_token}`;
  const shareText = `Hello ${pass.guest_name}, here is your visitor pass for ${pass.unit}. Show this QR code at the gate. Visit date: ${formatDate(pass.visit_date)}, arrival: ${formatTime(`2000-01-01T${pass.arrival_time}`)}.`;

  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + " " + qrValue)}`;
    window.open(url, "_blank");
  }
  function shareSMS() {
    window.location.href = `sms:?body=${encodeURIComponent(shareText + " " + qrValue)}`;
  }
  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Visitor Pass",
          text: shareText,
          url: qrValue,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(qrValue);
      toast("Pass link copied to clipboard.", "success");
    }
  }

  const canCancel = status === "pending";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/resident")}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {pass.guest_name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Unit {pass.unit} · Created {formatDate(pass.created_at)}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR card */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <QRCode value={qrValue} size={220} />
            <p className="mt-4 text-sm text-slate-500 text-center max-w-xs">
              Share this QR code with your guest. The guard will scan it at the
              gate.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={shareWhatsApp}
                className="flex-col h-auto py-2.5"
              >
                <MessageCircle className="h-4 w-4" />{" "}
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareSMS}
                className="flex-col h-auto py-2.5"
              >
                <MessageCircle className="h-4 w-4" />{" "}
                <span className="text-xs">SMS</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadQR(qrValue);
                  toast("QR code downloaded.", "success");
                }}
                className="flex-col h-auto py-2.5"
              >
                <Download className="h-4 w-4" />{" "}
                <span className="text-xs">Download</span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={shareNative}
              className="mt-2 w-full"
            >
              <Share2 className="h-4 w-4" /> Share link
            </Button>
          </CardContent>
        </Card>

        {/* Details card */}
        <Card>
          <CardHeader>
            <CardTitle>Visit details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow
              icon={<Users className="h-4 w-4" />}
              label="Number of guests"
              value={`${pass.number_of_guests}`}
            />
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label="Visit date"
              value={formatDate(pass.visit_date)}
            />
            <DetailRow
              icon={<Clock className="h-4 w-4" />}
              label="Expected arrival"
              value={formatTime(`2000-01-01T${pass.arrival_time}`)}
            />
            <DetailRow
              icon={<Clock className="h-4 w-4" />}
              label="Expiry time"
              value={formatTime(`2000-01-01T${pass.expiry_time}`)}
            />
            {pass.guest_phone && (
              <DetailRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={pass.guest_phone}
              />
            )}
            {pass.vehicle_reg && (
              <DetailRow
                icon={<Car className="h-4 w-4" />}
                label="Vehicle"
                value={pass.vehicle_reg}
              />
            )}
            {pass.purpose && (
              <DetailRow
                icon={<FileText className="h-4 w-4" />}
                label="Purpose"
                value={pass.purpose}
              />
            )}
            <DetailRow
              icon={<Home className="h-4 w-4" />}
              label="Unit"
              value={pass.unit}
            />

            {pass.checked_in_at && (
              <div className="pt-3 mt-3 border-t border-slate-100">
                <DetailRow
                  icon={<Clock className="h-4 w-4 text-emerald-600" />}
                  label="Checked in"
                  value={formatDateTime(pass.checked_in_at)}
                />
                {pass.checked_out_at && (
                  <DetailRow
                    icon={<Clock className="h-4 w-4 text-slate-500" />}
                    label="Checked out"
                    value={formatDateTime(pass.checked_out_at)}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {canCancel && (
        <div className="flex justify-end">
          <Button variant="danger" onClick={() => setConfirmCancel(true)}>
            <XCircle className="h-4 w-4" /> Cancel Visitor Pass
          </Button>
        </div>
      )}

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel this visitor pass?"
        description="The guest will no longer be able to use this QR code at the gate. This cannot be undone."
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmCancel(false)}>
            Keep pass
          </Button>
          <Button variant="danger" loading={cancelling} onClick={handleCancel}>
            <X className="h-4 w-4" /> Yes, cancel pass
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 text-sm text-slate-500">
        {icon}
        {label}
      </div>
      <span className="text-sm font-medium text-slate-900 text-right">
        {value}
      </span>
    </div>
  );
}
