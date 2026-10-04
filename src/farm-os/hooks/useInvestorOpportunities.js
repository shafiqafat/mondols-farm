import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useInvestorOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOpportunities = useCallback(async () => {
    const { data, error: queryError } = await supabase.rpc(
      "get_investor_opportunities",
    );

    if (queryError) {
      setOpportunities([]);
      setError(
        queryError.message || "Unable to load investment opportunities.",
      );
      setLoading(false);
      return;
    }

    setOpportunities(data ?? []);
    setError("");
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchOpportunities = async () => {
      const { data, error: queryError } = await supabase.rpc(
        "get_investor_opportunities",
      );

      if (cancelled) {
        return;
      }

      if (queryError) {
        setOpportunities([]);
        setError(
          queryError.message || "Unable to load investment opportunities.",
        );
        setLoading(false);
        return;
      }

      setOpportunities(data ?? []);
      setError("");
      setLoading(false);
    };

    fetchOpportunities();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    opportunities,
    loading,
    error,
    reload: loadOpportunities,
  };
}
