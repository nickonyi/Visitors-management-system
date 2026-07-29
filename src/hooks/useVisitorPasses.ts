import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  VisitorPass,
  VisitorPassWithResident,
  VisitorStatus,
} from "@/types";

export function useResidentPasses(residentId: string | undefined) {
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!residentId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("visitor_passes")
      .select("*")
      .eq("resident_id", residentId)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setPasses((data as VisitorPass[]) ?? []);
    setLoading(false);
  }, [residentId]);

  useEffect(() => {
    load();
  }, [load]);

  return { passes, loading, error, reload: load };
}

export function useAllPasses(filter?: {
  status?: VisitorStatus;
  search?: string;
}) {
  const [passes, setPasses] = useState<VisitorPassWithResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from("visitor_passes")
      .select("*, resident:resident_id(id, full_name, unit, phone)")
      .order("created_at", { ascending: false });
    if (filter?.status) query = query.eq("status", filter.status);
    if (filter?.search) {
      query = query.or(
        `guest_name.ilike.%${filter.search}%,unit.ilike.%${filter.search}%`,
      );
    }
    const { data, error } = await query;
    if (error) setError(error.message);
    else setPasses((data as VisitorPassWithResident[]) ?? []);
    setLoading(false);
  }, [filter?.status, filter?.search]);

  useEffect(() => {
    load();
  }, [load]);

  return { passes, loading, error, reload: load };
}

export function usePassByToken(token: string | null) {
  const [pass, setPass] = useState<VisitorPassWithResident | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("visitor_passes")
      .select("*, resident:resident_id(id, full_name, unit, phone)")
      .eq("qr_token", token)
      .maybeSingle();
    if (error) setError(error.message);
    else setPass((data as VisitorPassWithResident) ?? null);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { pass, loading, error, reload: load };
}

export async function createPass(
  input: Omit<
    VisitorPass,
    | "id"
    | "qr_token"
    | "status"
    | "created_at"
    | "checked_in_at"
    | "checked_out_at"
    | "checked_in_by"
    | "checked_out_by"
    | "cancelled_at"
    | "resident_id"
  >,
  residentId: string,
) {
  const { data, error } = await supabase
    .from("visitor_passes")
    .insert({ ...input, resident_id: residentId })
    .select()
    .single();
  if (error) throw error;
  return data as VisitorPass;
}

export async function cancelPass(passId: string) {
  const { error } = await supabase
    .from("visitor_passes")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", passId);
  if (error) throw error;
}

export async function checkInPass(passId: string, guardId: string) {
  const { data, error } = await supabase
    .from("visitor_passes")
    .update({
      status: "checked_in",
      checked_in_at: new Date().toISOString(),
      checked_in_by: guardId,
    })
    .eq("id", passId)
    .select()
    .single();
  if (error) throw error;
  return data as VisitorPass;
}

export async function checkOutPass(passId: string, guardId: string) {
  const { data, error } = await supabase
    .from("visitor_passes")
    .update({
      status: "checked_out",
      checked_out_at: new Date().toISOString(),
      checked_out_by: guardId,
    })
    .eq("id", passId)
    .select()
    .single();
  if (error) throw error;
  return data as VisitorPass;
}

export async function adminUpdatePass(
  passId: string,
  updates: Partial<VisitorPass>,
) {
  const { error } = await supabase
    .from("visitor_passes")
    .update(updates)
    .eq("id", passId);
  if (error) throw error;
}
