import type { VisitorPass, VisitorStatus } from "@/types";

/**
 * Compute the effective status of a pass, accounting for time-based expiry.
 * A pass that is still 'pending' past its expiry window is treated as 'expired'.
 */
export function effectiveStatus(pass: VisitorPass): VisitorStatus {
  if (pass.status === "pending") {
    const now = new Date();
    const visitDate = pass.visit_date; // yyyy-mm-dd
    const expiry = new Date(`${visitDate}T${pass.expiry_time}`);
    if (now > expiry) return "expired";
  }
  return pass.status;
}

export function isActionable(pass: VisitorPass): boolean {
  const s = effectiveStatus(pass);
  return s === "pending" || s === "checked_in";
}
