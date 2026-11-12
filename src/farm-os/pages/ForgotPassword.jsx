import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Sprout } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { error: requestError } = await requestPasswordReset(email.trim());

      if (requestError) {
        throw requestError;
      }

      // Keep the response generic to avoid revealing whether an account exists.
      setSent(true);
    } catch (requestError) {
      console.error("Password recovery request failed:", requestError);
      setError(
        "We couldn't send the recovery email right now. Please try again later.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-forest-dark)] px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-2xl sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sprout className="size-5" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Reset your password
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter the email address associated with your Farm OS account. We'll
            send you a secure password-reset link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <Mail className="size-4 text-primary" />
                Check your email
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                If an account is registered with that address, a password-reset
                link will arrive shortly. Check your spam folder too.
              </p>
            </div>
            <Button asChild className="h-11 w-full">
              <Link to="/farm-os/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="recovery-email"
                className="text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <Input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="h-11"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={submitting} className="h-11 w-full">
              <Mail className="size-4" />
              {submitting ? "Sending link…" : "Send recovery link"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/farm-os/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ForgotPassword;
