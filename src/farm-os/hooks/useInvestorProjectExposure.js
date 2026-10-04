import { useCallback, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useInvestorProjectExposure() {
  const [exposure, setExposure] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadExposure = useCallback(async (investmentId) => {
    if (!investmentId) {
      setExposure([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase.rpc(
      "get_investor_investment_exposure",
      {
        p_investment_id: investmentId,
      },
    );

    if (queryError) {
      setExposure([]);
      setError(queryError.message || "Unable to load investment exposure.");
      setLoading(false);
      return;
    }

    setExposure(data ?? []);
    setLoading(false);
  }, []);

  const clearExposure = useCallback(() => {
    setExposure([]);
    setError("");
  }, []);

  return {
    exposure,
    loading,
    error,
    loadExposure,
    clearExposure,
  };
}
