import { useMemo } from "react";
import { BarChart3, TrendingUp, Clock, Users } from "lucide-react";
import { useAllPasses } from "@/hooks/useVisitorPasses";
import { useProfiles } from "@/hooks/useProfiles";
import { effectiveStatus } from "@/lib/status";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate, formatTime } from "@/lib/utils";
import type { VisitorStatus } from "@/types";

export function AdminAnalyticsScreen() {
  const { passes, loading } = useAllPasses();
  const { profiles } = useProfiles();

  const data = useMemo(() => {
    const withStatus = passes.map((p) => ({ ...p, eff: effectiveStatus(p) }));
    const today = new Date().toISOString().split("T")[0];

    const statusBreakdown: Record<VisitorStatus, number> = {
      pending: 0,
      checked_in: 0,
      checked_out: 0,
      expired: 0,
      cancelled: 0,
    };
    withStatus.forEach((p) => {
      statusBreakdown[p.eff]++;
    });

    // Hourly distribution across all check-ins
    const hourly = new Array(24).fill(0);
    withStatus.forEach((p) => {
      if (p.checked_in_at) {
        hourly[new Date(p.checked_in_at).getHours()]++;
      }
    });
    const peakHour = hourly.indexOf(Math.max(...hourly));

    // Last 7 days
    const daily: { date: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      daily.push({
        date: key,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        count: withStatus.filter((p) => p.visit_date === key).length,
      });
    }
    const maxDaily = Math.max(...daily.map((d) => d.count), 1);

    // Top units by visits
    const unitCounts = new Map<string, number>();
    withStatus.forEach((p) =>
      unitCounts.set(p.unit, (unitCounts.get(p.unit) ?? 0) + 1),
    );
    const topUnits = [...unitCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total: withStatus.length,
      today: withStatus.filter((p) => p.visit_date === today).length,
      statusBreakdown,
      hourly,
      peakHour,
      daily,
      maxDaily,
      topUnits,
    };
  }, [passes]);

  const statusColors: Record<VisitorStatus, string> = {
    pending: "bg-amber-500",
    checked_in: "bg-emerald-500",
    checked_out: "bg-slate-400",
    expired: "bg-red-500",
    cancelled: "bg-zinc-500",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Visitor trends and insights across the community.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Visitors"
          value={data.total}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Visitors Today"
          value={data.today}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Peak Hour"
          value={
            data.peakHour >= 0 && data.hourly[data.peakHour] > 0
              ? formatTime(
                  `2000-01-01T${String(data.peakHour).padStart(2, "0")}:00`,
                )
              : "—"
          }
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Active Now"
          value={data.statusBreakdown.checked_in}
          color="bg-indigo-50 text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visitors — Last 7 Days</CardTitle>
            <CardDescription>Daily visitor pass count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {data.daily.map((d) => (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-medium text-slate-600">
                    {d.count}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-slate-900 transition-all"
                    style={{
                      height: `${(d.count / data.maxDaily) * 100}%`,
                      minHeight: d.count > 0 ? "6px" : "2px",
                    }}
                  />
                  <span className="text-xs text-slate-400">{d.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visitor Status Breakdown</CardTitle>
            <CardDescription>Distribution of all passes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(data.statusBreakdown) as VisitorStatus[]).map((s) => {
              const pct =
                data.total > 0
                  ? (data.statusBreakdown[s] / data.total) * 100
                  : 0;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="capitalize text-slate-600">
                      {s.replace("_", " ")}
                    </span>
                    <span className="font-medium text-slate-900">
                      {data.statusBreakdown[s]}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${statusColors[s]} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check-ins by Hour</CardTitle>
            <CardDescription>
              When visitors arrive throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {data.hourly.map((c, i) => {
                const max = Math.max(...data.hourly, 1);
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end gap-1"
                  >
                    <div
                      className="w-full rounded-t bg-emerald-500 transition-all"
                      style={{
                        height: `${(c / max) * 100}%`,
                        minHeight: c > 0 ? "4px" : "0",
                      }}
                      title={`${formatTime(`2000-01-01T${String(i).padStart(2, "0")}:00`)}: ${c}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Units by Visits</CardTitle>
            <CardDescription>Most active apartments</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topUnits.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                No visitor data yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.topUnits.map(([unit, count], idx) => (
                  <li key={unit} className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-900">
                      Unit {unit}
                    </span>
                    <span className="text-sm text-slate-500">
                      {count} {count === 1 ? "visit" : "visits"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${color} mb-3`}
        >
          {icon}
        </div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
