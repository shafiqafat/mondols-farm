import { useCallback, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useInvestorInvestmentTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTransactions = useCallback(async (investmentId) => {
    if (!investmentId) {
      setTransactions([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase.rpc(
      "get_investor_investment_transactions",
      {
        p_investment_id: investmentId,
      },
    );

    if (queryError) {
      setTransactions([]);
      setError(queryError.message || "Unable to load investment transactions.");
      setLoading(false);
      return;
    }

    setTransactions(data ?? []);
    setLoading(false);
  }, []);

  const clearTransactions = useCallback(() => {
    setTransactions([]);
    setError("");
  }, []);

  return {
    transactions,
    loading,
    error,
    loadTransactions,
    clearTransactions,
  };
}
