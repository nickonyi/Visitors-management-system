import { useMemo } from "react";
import { Link } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/context/RouterContext";
import { useResidentPasses } from "@/hooks/useVisitorPasses";
import { effectiveStatus } from "@/lib/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate, formatTime } from "@/lib/utils";
import type { VisitorPass, VisitorStatus } from "@/types";

export function ResidentDashboard() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const { passes, loading } = useResidentPasses(profile?.id);

  const { upcoming, active, past } = useMemo(() => {
    const withStatus = passes.map((p) => ({ ...p, eff: effectiveStatus(p) }));
    const upcoming = withStatus.filter((p) => p.eff === "pending");
    const active = withStatus.filter((p) => p.eff === "checked_in");
    const past = withStatus.filter(
      (p) =>
        p.eff === "checked_out" || p.eff === "expired" || p.eff === "cancelled",
    );
    return { upcoming, active, past };
  }, [passes]);

  const stats = [
    {
      label: "Upcoming",
      value: upcoming.length,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Active",
      value: active.length,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Past",
      value: past.length,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {profile?.full_name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {profile?.unit ? `Unit ${profile.unit} · ` : ""}Manage your visitor
            passes below.
          </p>
        </div>
        <Button onClick={() => navigate("/resident/new")} size="md">
          <Link className="h-4 w-4" /> New Visitor Pass
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <div
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.bg} ${s.color} mb-3`}
              >
                <span className="text-lg font-bold">{s.value}</span>
              </div>
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Section
        title="Active Visitors"
        passes={active}
        loading={loading}
        onOpen={(id) => navigate(`/resident/pass/${id}`)}
      />
      <Section
        title="Upcoming Visits"
        passes={upcoming}
        loading={loading}
        onOpen={(id) => navigate(`/resident/pass/${id}`)}
      />
      <Section
        title="Recent History"
        passes={past.slice(0, 5)}
        loading={loading}
        onOpen={(id) => navigate(`/resident/pass/${id}`)}
      />
    </div>
  );
}

function Section({
  title,
  passes,
  loading,
  onOpen,
}: {
  title: string;
  passes: (VisitorPass & { eff: VisitorStatus })[];
  loading: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <span className="text-xs text-slate-400">
          {passes.length} {passes.length === 1 ? "pass" : "passes"}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : passes.length === 0 ? (
          <EmptyState
            icon={<Link className="h-6 w-6" />}
            title={`No ${title.toLowerCase()} yet`}
            description="Create a visitor pass to invite a guest."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {passes.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => onOpen(p.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {p.guest_name}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {formatDate(p.visit_date)} ·{" "}
                      {formatTime(`2000-01-01T${p.arrival_time}`)}
                      {p.number_of_guests > 1
                        ? ` · ${p.number_of_guests} guests`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge status={p.eff} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
