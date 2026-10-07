import { useCallback, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useInvestorInvestmentPerformance() {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPerformance = useCallback(async (investmentId) => {
    if (!investmentId) {
      setPerformance(null);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: queryError } = await supabase.rpc(
      "get_investor_investment_performance",
      {
        p_investment_id: investmentId,
      },
    );

    if (queryError) {
      setPerformance(null);
      setError(queryError.message || "Unable to load investment performance.");
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setPerformance(null);
      setError(
        `Performance RPC returned no rows. Logged-in user: ${
          user?.id ?? "not authenticated"
        }`,
      );
      setLoading(false);
      return;
    }

    setPerformance(data?.[0] ?? null);
    setLoading(false);
  }, []);

  const clearPerformance = useCallback(() => {
    setPerformance(null);
    setError("");
  }, []);

  return {
    performance,
    loading,
    error,
    loadPerformance,
    clearPerformance,
  };
}
