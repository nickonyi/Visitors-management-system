import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/types";

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profiles, loading, error, reload: load };
}

export async function updateProfile(
  id: string,
  updates: Partial<
    Pick<Profile, "full_name" | "role" | "unit" | "phone" | "active">
  >,
) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function createProfileViaSignup(params: {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  unit?: string;
  phone?: string;
}) {
  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.full_name,
        role: params.role,
        unit: params.unit ?? null,
        phone: params.phone ?? null,
      },
    },
  });
  if (error) throw error;
}
