import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Sprout, UserPlus, CheckCircle2 } from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function InvestorRegister() {
  const { user, accountType, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
//   const [registrationMessage, setRegistrationMessage] = useState("");

  const completingRegistration = useRef(false);

  const confirmationReturn =
    new URLSearchParams(window.location.search).get("complete") === "1";

  useEffect(() => {
    if (authLoading || !user || !confirmationReturn) return;
    if (completingRegistration.current) return;

    completingRegistration.current = true;

    async function completeRegistration() {
      setSubmitting(true);
      setError("");

      try {
        if (!user.email_confirmed_at) {
          throw new Error(
            "Please confirm your email before completing registration.",
          );
        }

        const metadata = user.user_metadata ?? {};

        if (metadata.investor_registration !== true) {
          throw new Error(
            "This account does not have a pending investor registration.",
          );
        }

        const { data: registrationData, error: registrationError } =
          await supabase.rpc("register_investor", {
            p_name: metadata.full_name,
            p_phone: metadata.phone || null,
            p_address: metadata.address || null,
          });

        if (registrationError) throw registrationError;

        if (!registrationData?.investor_id) {
          throw new Error(
            "Registration could not be confirmed. Please try again.",
          );
        }

        setNeedsEmailConfirmation(false);
        setSubmitted(true);

        window.history.replaceState({}, "", window.location.pathname);
      } catch (err) {
        console.error("Completing investor registration failed:", err);
        setError(
          err?.message ||
            "Could not complete registration. Please contact support.",
        );
        completingRegistration.current = false;
      } finally {
        setSubmitting(false);
      }
    }

    completeRegistration();
  }, [authLoading, user, confirmationReturn]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const address = form.address.trim();

    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: name,
            phone: phone,
            address: address,
            investor_registration: true,
          },
          emailRedirectTo: `${window.location.origin}/investor/register?complete=1`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // A session is needed to call the authenticated registration RPC.
      if (!data.session || !data.user) {
        setNeedsEmailConfirmation(true);
        return;
      }

      const { error: registrationError } = await supabase.rpc(
        "register_investor",
        {
          p_name: name,
          p_phone: phone || null,
          p_address: address || null,
        },
      );

      if (registrationError) {
        // Do not leave the user signed in if profile creation failed.
        await supabase.auth.signOut();
        throw registrationError;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Investor registration failed:", err);
      setError(
        err?.message ||
          "Registration failed. Please try again or contact support.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return <div className="farmos-loading">Loading…</div>;
  }

  if (user && !confirmationReturn) {
    if (accountType === "investor") {
      return <Navigate to="/investor" replace />;
    }

    return <Navigate to="/farm-os" replace />;
  }

  return (
    <div className="min-h-svh bg-[var(--color-forest-dark)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl md:grid-cols-2">
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-7 text-center">
                <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {submitted ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <Sprout className="size-5" />
                  )}
                </div>

                <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {submitted
                    ? "Application submitted"
                    : needsEmailConfirmation
                      ? "Check your email"
                      : "Investor registration"}
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  {submitted
                    ? "Your investor profile is awaiting approval."
                    : needsEmailConfirmation
                      ? "Confirm your email to continue."
                      : "Create an account to apply for investor access."}
                </p>
              </div>

              {submitted ? (
                <div className="space-y-5 text-center">
                  <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-foreground">
                    Your application has been submitted successfully. The farm
                    administrator must approve it before you can access the
                    investor portal.
                  </div>

                  <Button asChild className="h-11 w-full">
                    <Link to="/farm-os/login">Go to sign in</Link>
                  </Button>
                </div>
              ) : needsEmailConfirmation ? (
                <div className="space-y-5">
                  <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-foreground">
                    Supabase requires email confirmation before an authenticated
                    session is created. Your investor profile has not yet been
                    confirmed as registered. After confirming your email, sign
                    in and complete the profile registration flow.
                  </div>
                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5"
                    >
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <Button asChild className="h-11 w-full">
                    <Link to="/farm-os/login">Go to sign in</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Full name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      autoComplete="name"
                      required
                      maxLength={150}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email address *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone number
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Your phone number"
                      autoComplete="tel"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password *
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium"
                    >
                      Confirm password *
                    </label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Enter your password again"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5"
                    >
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-11 w-full"
                  >
                    <UserPlus className="size-4" />
                    {submitting ? "Submitting…" : "Create investor account"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already registered?{" "}
                    <Link
                      to="/farm-os/login"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>

                  <p className="text-center text-xs leading-5 text-muted-foreground">
                    Investor access is subject to administrator approval.
                  </p>
                </form>
              )}
            </div>
          </div>

          <div className="hidden flex-col justify-center bg-muted/40 p-10 md:flex">
            <Sprout className="mb-5 size-10 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">
              Invest in Mondol&apos;s Farm
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Register to apply for investor access, review available
              opportunities, and monitor your investments after approval.
            </p>
            <div className="mt-8 rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-medium text-foreground">
                How it works
              </p>
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-6 text-muted-foreground">
                <li>Create your account and profile.</li>
                <li>Wait for administrator approval.</li>
                <li>Sign in to access the investor portal.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvestorRegister;
