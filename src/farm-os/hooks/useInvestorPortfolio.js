import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useInvestorPortfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initializePortfolio() {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase.rpc(
        "get_current_investor_portfolio",
      );

      if (cancelled) {
        return;
      }

      if (queryError) {
        setPortfolio([]);
        setError(queryError.message || "Unable to load investor portfolio.");
        setLoading(false);
        return;
      }

      setPortfolio(data ?? []);
      setLoading(false);
    }

    initializePortfolio();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    portfolio,
    loading,
    error,
  };
}
