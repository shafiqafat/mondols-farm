import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

function InvestorProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [checkingInvestor, setCheckingInvestor] = useState(true);
  const [isInvestor, setIsInvestor] = useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let cancelled = false;

    async function checkInvestorAccess() {
      const { data, error } = await supabase.rpc("current_investor_id");

      if (cancelled) {
        return;
      }

      setIsInvestor(!error && Boolean(data));
      setCheckingInvestor(false);
    }

    checkInvestorAccess();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (authLoading) {
    return <div className="farmos-loading">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/farm-os/login" replace />;
  }

  if (checkingInvestor) {
    return <div className="farmos-loading">Checking investor access…</div>;
  }

  if (!isInvestor) {
    return <Navigate to="/farm-os" replace />;
  }

  return children;
}

export default InvestorProtectedRoute;
