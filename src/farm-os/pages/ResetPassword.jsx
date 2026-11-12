import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Sprout } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ResetPassword() {
  const { loading, updatePassword } = useAuth();
  const [checking, setChecking] = useState(true);
  const [recoverySession, setRecoverySession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkRecoverySession() {
      const params = new URLSearchParams(window.location.search);
      const authError = params.get("error_description") || params.get("error");

      if (authError) {
        if (active) {
          setError(
            "This recovery link is invalid or has expired. Request a new one.",
          );
          setChecking(false);
        }
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!active) return;

      if (sessionError || !data.session) {
        setError(
          "This recovery link is invalid or has expired. Request a new one.",
        );
        setRecoverySession(false);
      } else {
        setRecoverySession(true);
      }

      setChecking(false);
    }

    checkRecoverySession();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) throw updateError;

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (updateError) {
      console.error("Password update failed:", updateError);
      setError(
        updateError?.message ||
          "We couldn't update your password. Request a new recovery link and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checking || loading) {
    return <div className="farmos-loading">Verifying recovery link…</div>;
  }

  if (success) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[var(--color-forest-dark)] px-4 py-8">
        <section className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 text-center shadow-2xl sm:p-8">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sprout className="size-5" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-foreground">
            Password updated
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your Farm OS password has been changed successfully. You can now
            continue to your account.
          </p>
          <Button asChild className="mt-6 h-11 w-full">
            <Link to="/farm-os">Continue to Farm OS</Link>
          </Button>
        </section>
      </main>
    );
  }

  if (!recoverySession) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[var(--color-forest-dark)] px-4 py-8">
        <section className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-2xl sm:p-8">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LockKeyhole className="size-5" />
          </div>
          <h1 className="mt-5 text-center text-2xl font-semibold text-foreground">
            Recovery link unavailable
          </h1>
          <p className="mt-3 text-center text-sm leading-6 text-muted-foreground">
            {error || "This recovery link is invalid or has expired."}
          </p>
          <Button asChild className="mt-6 h-11 w-full">
            <Link to="/farm-os/forgot-password">Request a new link</Link>
          </Button>
          <div className="mt-5 text-center">
            <Link
              to="/farm-os/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-forest-dark)] px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-2xl sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sprout className="size-5" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-foreground">
            Create a new password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a strong password you haven't used for this account before.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="new-password"
              className="text-sm font-medium text-foreground"
            >
              New password
            </label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirm-password"
              className="text-sm font-medium text-foreground"
            >
              Confirm new password
            </label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Enter the password again"
              className="h-11"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={submitting} className="h-11 w-full">
            <LockKeyhole className="size-4" />
            {submitting ? "Updating password…" : "Update password"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/farm-os/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ResetPassword;
