import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "./authContextDef";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [accountType, setAccountType] = useState(null);
  const [investorId, setInvestorId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function applySession(nextSession) {
      setLoading(true);
      setSession(nextSession);

      if (!nextSession?.user) {
        setRole(null);
        setAccountType(null);
        setInvestorId(null);
        setLoading(false);
        return;
      }

      setRole(null);
      setAccountType(null);
      setInvestorId(null);

      const { data: roleData } = await supabase
        .from("farm_user_roles")
        .select("role")
        .eq("user_id", nextSession.user.id)
        .maybeSingle();

      const { data: investorData } = await supabase.rpc("current_investor_id");

      setRole(roleData?.role ?? null);

      if (investorData) {
        setAccountType("investor");
        setInvestorId(investorData);
      } else {
        setAccountType("farm");
        setInvestorId(null);
      }

      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => applySession(newSession)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        error,
        accountType: null,
      };
    }

    const { data: investorData, error: investorError } = await supabase.rpc(
      "current_investor_id",
    );

    if (!investorError && investorData) {
      return {
        error: null,
        accountType: "investor",
      };
    }

    return {
      error: null,
      accountType: "farm",
    };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const value = {
    session,
    user: session?.user ?? null,
    role,
    accountType,
    investorId,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
