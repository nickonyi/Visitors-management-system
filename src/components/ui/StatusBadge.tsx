import { cn } from "@/lib/utils";
import type { VisitorStatus } from "@/types";

interface BadgeProps {
  status: VisitorStatus;
  className?: string;
}

const styles: Record<VisitorStatus, string> = {
  pending: "bg-amber-100 text-amber-800 ring-amber-600/20",
  checked_in: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  checked_out: "bg-slate-100 text-slate-700 ring-slate-500/20",
  expired: "bg-red-100 text-red-800 ring-red-600/20",
  cancelled: "bg-zinc-200 text-zinc-700 ring-zinc-500/20",
};

const labels: Record<VisitorStatus, string> = {
  pending: "Pending",
  checked_in: "Checked In",
  checked_out: "Checked Out",
  expired: "Expired",
  cancelled: "Cancelled",
};

export function StatusBadge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset capitalize",
        styles[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {labels[status]}
    </span>
  );
}
