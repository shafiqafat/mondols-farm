import { useCallback, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useInvestorOperationalSummary() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOperationalSummary = useCallback(async (investmentId) => {
    if (!investmentId) {
      setSummary([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase.rpc(
      "get_investor_investment_operational_summary",
      {
        p_investment_id: investmentId,
      },
    );

    if (queryError) {
      setSummary([]);
      setError(queryError.message || "Unable to load operational summary.");
      setLoading(false);
      return;
    }

    setSummary(data ?? []);
    setLoading(false);
  }, []);

  const clearOperationalSummary = useCallback(() => {
    setSummary([]);
    setError("");
  }, []);

  return {
    summary,
    loading,
    error,
    loadOperationalSummary,
    clearOperationalSummary,
  };
}
