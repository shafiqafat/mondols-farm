import { useCallback, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useInvestorProjectDetail() {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProject = useCallback(async (projectId) => {
    if (!projectId) {
      setProject(null);
      setError("");
      return null;
    }

    setLoading(true);
    setError("");

    const [
      detailResult,
      operationalResult,
      speciesBreakdownResult,
      productionResult,
      activityResult,
      allocationPercentageResult,
    ] = await Promise.all([
      supabase.rpc("get_investor_project_detail", {
        p_project_id: projectId,
      }),
      supabase.rpc("get_investor_project_operational_summary", {
        p_project_id: projectId,
      }),
      supabase.rpc("get_investor_project_species_breakdown", {
        p_project_id: projectId,
      }),
      supabase.rpc("get_investor_project_production_summary", {
        p_project_id: projectId,
      }),
      supabase.rpc("get_investor_project_recent_activity", {
        p_project_id: projectId,
        p_limit: 10,
      }),
      supabase.rpc("get_investor_project_allocation_percentage", {
        p_project_id: projectId,
      }),
    ]);

    if (detailResult.error) {
      setProject(null);
      setError(detailResult.error.message || "Unable to load project details.");
      setLoading(false);
      return null;
    }
    if (speciesBreakdownResult.error) {
      setProject(null);
      setError(
        speciesBreakdownResult.error.message ||
          "Unable to load project species breakdown.",
      );
      setLoading(false);
      return null;
    }

    if (productionResult.error) {
      setProject(null);
      setError(
        productionResult.error.message ||
          "Unable to load project production data.",
      );
      setLoading(false);
      return null;
    }
    if (activityResult.error) {
      setProject(null);
      setError(
        activityResult.error.message ||
          "Unable to load project recent activity.",
      );
      setLoading(false);
      return null;
    }

    if (operationalResult.error) {
      setProject(null);
      setError(
        operationalResult.error.message ||
          "Unable to load project operational data.",
      );
      setLoading(false);
      return null;
    }

    const project = detailResult.data?.[0] ?? null;
    const operationalSummary = operationalResult.data?.[0] ?? null;
    const speciesBreakdown = speciesBreakdownResult.data ?? [];
    const productionSummary = productionResult.data ?? [];
    const recentActivity = activityResult.data ?? [];
    const allocationPercentage = allocationPercentageResult.data?.[0] ?? null;
    const result = project
      ? {
          ...project,
          operational_summary: operationalSummary,
          species_breakdown: speciesBreakdown,
          production_summary: productionSummary,
          recent_activity: recentActivity,
          allocation_percentage: allocationPercentage,
        }
      : null;

    setProject(result);
    setLoading(false);

    return result;
  }, []);

  const clearProject = useCallback(() => {
    setProject(null);
    setError("");
  }, []);

  return {
    project,
    loading,
    error,
    loadProject,
    clearProject,
  };
}
