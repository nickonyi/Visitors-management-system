import { useEffect, useMemo, useState } from "react";
import {
  Users,
  QrCode,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { useAllPasses } from "@/hooks/useVisitorPasses";
import { useProfiles } from "@/hooks/useProfiles";
import { effectiveStatus } from "@/lib/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import { useRouter } from "@/context/RouterContext";

export function AdminDashboard() {
  const { navigate } = useRouter();
  const { passes, loading } = useAllPasses();
  const { profiles } = useProfiles();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const today = now.toISOString().split("T")[0];
    const withStatus = passes.map((p) => ({ ...p, eff: effectiveStatus(p) }));
    return {
      visitorsToday: withStatus.filter((p) => p.visit_date === today).length,
      active: withStatus.filter((p) => p.eff === "checked_in").length,
      checkedOut: withStatus.filter((p) => p.eff === "checked_out").length,
      pending: withStatus.filter((p) => p.eff === "pending").length,
      totalResidents: profiles.filter((p) => p.role === "resident").length,
      totalGuards: profiles.filter((p) => p.role === "guard").length,
    };
  }, [passes, profiles, now]);

  const recent = useMemo(
    () => passes.slice(0, 6).map((p) => ({ ...p, eff: effectiveStatus(p) })),
    [passes],
  );

  const cards = [
    {
      label: "Visitors Today",
      value: stats.visitorsToday,
      icon: <QrCode className="h-5 w-5" />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Active Now",
      value: stats.active,
      icon: <LogIn className="h-5 w-5" />,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Checked Out",
      value: stats.checkedOut,
      icon: <LogOut className="h-5 w-5" />,
      color: "bg-slate-100 text-slate-600",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: <Clock className="h-5 w-5" />,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Residents",
      value: stats.totalResidents,
      icon: <Users className="h-5 w-5" />,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Guards",
      value: stats.totalGuards,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "bg-teal-50 text-teal-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of visitor activity and community users.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4 sm:p-5">
              <div
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${c.color} mb-3`}
              >
                {c.icon}
              </div>
              <p className="text-2xl font-bold text-slate-900">{c.value}</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {c.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Visitor Activity</CardTitle>
            <button
              onClick={() => navigate("/admin/visitors")}
              className="text-sm text-slate-500 hover:text-slate-900 font-medium"
            >
              View all
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : recent.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-12">
                No visitor activity yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((p) => (
                  <li key={p.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {p.guest_name}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        Unit {p.unit} · {p.resident?.full_name ?? "Unknown"} ·{" "}
                        {formatDate(p.visit_date)}{" "}
                        {formatTime(`2000-01-01T${p.arrival_time}`)}
                      </p>
                    </div>
                    <StatusBadge status={p.eff} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Today's Peak Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PeakHours passes={passes} now={now} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PeakHours({
  passes,
  now,
}: {
  passes: ReturnType<typeof useAllPasses>["passes"];
  now: Date;
}) {
  const today = now.toISOString().split("T")[0];
  const hourCounts = new Array(24).fill(0);
  passes.forEach((p) => {
    if (p.visit_date === today && p.checked_in_at) {
      const h = new Date(p.checked_in_at).getHours();
      hourCounts[h]++;
    }
  });
  const max = Math.max(...hourCounts, 1);
  const peakHour = hourCounts.indexOf(max);

  if (max === 0) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center">
        No check-ins recorded today yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Peak visiting hour:{" "}
        <span className="font-semibold text-slate-900">
          {formatTime(`2000-01-01T${String(peakHour).padStart(2, "0")}:00`)}
        </span>
      </p>
      <div className="flex items-end gap-1 h-32">
        {hourCounts.map((c, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end gap-1"
          >
            <div
              className="w-full rounded-t bg-slate-900 transition-all"
              style={{
                height: `${(c / max) * 100}%`,
                minHeight: c > 0 ? "4px" : "0",
              }}
              title={`${formatTime(`2000-01-01T${String(i).padStart(2, "0")}:00`)}: ${c}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>11 PM</span>
      </div>
    </div>
  );
}
