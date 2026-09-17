import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "./authContextDef";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function applySession(nextSession) {
      setSession(nextSession);
      if (!nextSession?.user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("farm_user_roles")
        .select("role")
        .eq("user_id", nextSession.user.id)
        .maybeSingle();
      setRole(data?.role ?? null);
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
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const value = {
    session,
    user: session?.user ?? null,
    role,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
