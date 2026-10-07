import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useInvestorProjectAllocations() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase.rpc(
      "get_investor_project_allocations",
    );

    if (queryError) {
      setProjects([]);
      setError(
        queryError.message || "Unable to load investor project allocations.",
      );
      setLoading(false);
      return [];
    }

    const rows = data ?? [];

    setProjects(rows);
    setLoading(false);

    return rows;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initializeProjects() {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase.rpc(
        "get_investor_project_allocations",
      );

      if (cancelled) return;

      if (queryError) {
        setProjects([]);
        setError(
          queryError.message || "Unable to load investor project allocations.",
        );
        setLoading(false);
        return;
      }

      setProjects(data ?? []);
      setLoading(false);
    }

    initializeProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    projects,
    loading,
    error,
    reload: loadProjects,
  };
}
