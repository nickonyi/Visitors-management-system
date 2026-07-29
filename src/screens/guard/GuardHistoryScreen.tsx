import { useMemo, useState } from "react";
import { History, Search } from "lucide-react";
import { useRouter } from "@/context/RouterContext";
import { useAllPasses } from "@/hooks/useVisitorPasses";
import { effectiveStatus } from "@/lib/status";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";

export function GuardHistoryScreen() {
  const { navigate } = useRouter();
  const { passes, loading } = useAllPasses();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return passes
      .map((p) => ({ ...p, eff: effectiveStatus(p) }))
      .filter(
        (p) =>
          !search ||
          p.guest_name.toLowerCase().includes(search.toLowerCase()) ||
          p.unit.toLowerCase().includes(search.toLowerCase()),
      );
  }, [passes, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scan History</h1>
        <p className="mt-1 text-sm text-slate-500">
          All visitor passes across the complex.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by guest name or unit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<History className="h-6 w-6" />}
              title="No visitor passes found"
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <li key={p.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {p.guest_name}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        Unit {p.unit} · {formatDate(p.visit_date)} ·{" "}
                        {formatTime(`2000-01-01T${p.arrival_time}`)}
                      </p>
                      {p.checked_in_at && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          In: {formatDateTime(p.checked_in_at)}
                          {p.checked_out_at
                            ? ` · Out: ${formatDateTime(p.checked_out_at)}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={p.eff} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
