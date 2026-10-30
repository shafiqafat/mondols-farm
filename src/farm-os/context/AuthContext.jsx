import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "./authContextDef";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [accountType, setAccountType] = useState(null);
  const [investorId, setInvestorId] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUserIdRef = useRef(null);
  const requestIdRef = useRef(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function applySession(nextSession) {
      if (!mounted) return;

      const nextUser = nextSession?.user ?? null;
      const nextUserId = nextUser?.id ?? null;
      const currentUserId = currentUserIdRef.current;

      // Same user: token refresh only.
      // Keep the existing account state and loading status.
      if (nextUserId && nextUserId === currentUserId) {
        setSession(nextSession);
        return;
      }

      // Ignore duplicate signed-out events after initialization.
      if (!nextUserId && !currentUserId && initializedRef.current) {
        setSession(nextSession);
        return;
      }

      const requestId = ++requestIdRef.current;
      currentUserIdRef.current = nextUserId;
      setSession(nextSession);

      if (!nextUser) {
        setRole(null);
        setAccountType(null);
        setInvestorId(null);
        initializedRef.current = true;
        setLoading(false);
        return;
      }

      setLoading(true);
      setRole(null);
      setAccountType(null);
      setInvestorId(null);

      try {
        const { data: roleData, error: roleError } = await supabase
          .from("farm_user_roles")
          .select("role")
          .eq("user_id", nextUserId)
          .maybeSingle();

        if (roleError) throw roleError;

        const { data: investorData, error: investorError } = await supabase.rpc(
          "current_investor_id",
        );

        if (investorError) throw investorError;

        // Ignore outdated requests if the user changed during loading.
        if (!mounted || requestId !== requestIdRef.current) {
          return;
        }

        setRole(roleData?.role ?? null);

        if (investorData) {
          setAccountType("investor");
          setInvestorId(investorData);
        } else {
          setAccountType("farm");
          setInvestorId(null);
        }
      } catch (error) {
        if (!mounted || requestId !== requestIdRef.current) {
          return;
        }

        console.error("Failed to load user account:", error);
      } finally {
        if (mounted && requestId === requestIdRef.current) {
          initializedRef.current = true;
          setLoading(false);
        }
      }
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Failed to restore session:", error);
        if (mounted) setLoading(false);
        return;
      }

      applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Supabase can emit token-refresh events when a tab becomes active.
      applySession(nextSession);
    });

    return () => {
      mounted = false;
      requestIdRef.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error, accountType: null };
    }

    const { data: investorData, error: investorError } = await supabase.rpc(
      "current_investor_id",
    );

    if (!investorError && investorData) {
      return { error: null, accountType: "investor" };
    }

    return { error: null, accountType: "farm" };
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
