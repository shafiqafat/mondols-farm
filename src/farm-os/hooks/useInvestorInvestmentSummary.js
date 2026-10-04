import { useCallback, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useInvestorInvestmentSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async (investmentId) => {
    if (!investmentId) {
      setSummary(null);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase.rpc(
      "get_investor_investment_summary",
      {
        p_investment_id: investmentId,
      },
    );

    if (queryError) {
      setSummary(null);
      setError(queryError.message || "Unable to load investment details.");
      setLoading(false);
      return;
    }

    const result = data?.[0] ?? null;

    setSummary(result);
    setLoading(false);

    return result;
  }, []);

  const clearSummary = useCallback(() => {
    setSummary(null);
    setError("");
  }, []);

  return {
    summary,
    loading,
    error,
    loadSummary,
    clearSummary,
  };
}
