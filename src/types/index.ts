export type UserRole = "resident" | "guard" | "admin";

export type VisitorStatus =
  | "pending"
  | "checked_in"
  | "checked_out"
  | "expired"
  | "cancelled";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  unit: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
}

export interface VisitorPass {
  id: string;
  resident_id: string;
  guest_name: string;
  guest_phone: string | null;
  number_of_guests: number;
  unit: string;
  visit_date: string;
  arrival_time: string;
  expiry_time: string;
  vehicle_reg: string | null;
  purpose: string | null;
  qr_token: string;
  status: VisitorStatus;
  checked_in_at: string | null;
  checked_out_at: string | null;
  checked_in_by: string | null;
  checked_out_by: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface VisitorPassWithResident extends VisitorPass {
  resident?: Pick<Profile, "id" | "full_name" | "unit" | "phone"> | null;
}
