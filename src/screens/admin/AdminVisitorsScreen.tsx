import { useMemo, useState } from "react";
import { Search, QrCode, Ban } from "lucide-react";
import { useAllPasses } from "@/hooks/useVisitorPasses";
import { adminUpdatePass } from "@/hooks/useVisitorPasses";
import { effectiveStatus } from "@/lib/status";
import { useToast } from "@/components/ui/Toast";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import type { VisitorPassWithResident, VisitorStatus } from "@/types";

const filters: { value: "all" | VisitorStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "checked_in", label: "Checked In" },
  { value: "checked_out", label: "Checked Out" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

export function AdminVisitorsScreen() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | VisitorStatus>("all");
  const { passes, loading, reload } = useAllPasses({
    status: filter === "all" ? undefined : filter,
    search,
  });
  const [revokeTarget, setRevokeTarget] =
    useState<VisitorPassWithResident | null>(null);
  const [revoking, setRevoking] = useState(false);

  const filtered = useMemo(
    () => passes.map((p) => ({ ...p, eff: effectiveStatus(p) })),
    [passes],
  );

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await adminUpdatePass(revokeTarget.id, {
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      });
      toast("Visitor pass revoked.", "success");
      setRevokeTarget(null);
      reload();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to revoke pass.",
        "error",
      );
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          All Visitor Records
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Search, filter, and manage every visitor pass in the system.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by guest name or unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<QrCode className="h-6 w-6" />}
              title="No visitor records found"
              description="Try adjusting your search or filters."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3">Guest</th>
                      <th className="px-5 py-3">Unit</th>
                      <th className="px-5 py-3">Resident</th>
                      <th className="px-5 py-3">Visit Date</th>
                      <th className="px-5 py-3">Check-in</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {p.guest_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {p.number_of_guests}{" "}
                            {p.number_of_guests === 1 ? "guest" : "guests"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {p.unit}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {p.resident?.full_name ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(p.visit_date)}
                          <br />
                          <span className="text-xs text-slate-400">
                            {formatTime(`2000-01-01T${p.arrival_time}`)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {p.checked_in_at
                            ? formatDateTime(p.checked_in_at)
                            : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={p.eff} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          {(p.eff === "pending" || p.eff === "checked_in") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRevokeTarget(p)}
                            >
                              <Ban className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="lg:hidden divide-y divide-slate-100">
                {filtered.map((p) => (
                  <li key={p.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {p.guest_name}
                        </p>
                        <p className="text-sm text-slate-500">
                          Unit {p.unit} · {p.resident?.full_name ?? "—"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(p.visit_date)} ·{" "}
                          {formatTime(`2000-01-01T${p.arrival_time}`)}
                        </p>
                      </div>
                      <StatusBadge status={p.eff} />
                    </div>
                    {(p.eff === "pending" || p.eff === "checked_in") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => setRevokeTarget(p)}
                      >
                        <Ban className="h-4 w-4 text-red-500" /> Revoke Pass
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revoke this visitor pass?"
        description={`${revokeTarget?.guest_name}'s pass for Unit ${revokeTarget?.unit} will be cancelled immediately and cannot be used at the gate.`}
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setRevokeTarget(null)}>
            Dismiss
          </Button>
          <Button variant="danger" loading={revoking} onClick={handleRevoke}>
            <Ban className="h-4 w-4" /> Revoke Pass
          </Button>
        </div>
      </Modal>
    </div>
  );
}
