import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useInvestorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase.rpc(
      "get_current_investor_profile",
    );

    if (queryError) {
      setProfile(null);
      setError(queryError.message || "Unable to load investor profile.");
      setLoading(false);
      return null;
    }

    const row = data?.[0] ?? null;

    setProfile(row);
    setLoading(false);

    return row;
  }, []);

  const updateProfile = useCallback(async ({ phone, address }) => {
    setSaving(true);
    setError("");

    const { data, error: queryError } = await supabase.rpc(
      "update_current_investor_profile",
      {
        p_phone: phone,
        p_address: address,
      },
    );

    if (queryError) {
      setError(queryError.message || "Unable to update investor profile.");
      setSaving(false);
      return null;
    }

    const row = data?.[0] ?? null;

    setProfile(row);
    setSaving(false);

    return row;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initializeProfile() {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase.rpc(
        "get_current_investor_profile",
      );

      if (cancelled) return;

      if (queryError) {
        setProfile(null);
        setError(queryError.message || "Unable to load investor profile.");
        setLoading(false);
        return;
      }

      setProfile(data?.[0] ?? null);
      setLoading(false);
    }

    initializeProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    profile,
    loading,
    saving,
    error,
    reload: loadProfile,
    updateProfile,
  };
}
