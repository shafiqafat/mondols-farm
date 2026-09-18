import { useState } from "react";
import { Navigate } from "react-router-dom";
import { LockKeyhole, Sprout } from "lucide-react";
import farmLoginImage from "../../assets/image/loader.png";

import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
function Login() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/farm-os" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError("Couldn't sign in. Check your email and password.");
    }
  }

  return (
    <div className="min-h-svh bg-[var(--color-forest-dark)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="grid w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl md:grid-cols-2"
        >
          {/* Login panel */}
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 text-center">
                <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sprout className="size-5" />
                </div>

                <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
                  Welcome back
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Login to your Mondol's Farm OS
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email
                  </label>

                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="you@example.com"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </label>

                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-11"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-11 w-full"
                >
                  <LockKeyhole className="size-4" />
                  {submitting ? "Signing in…" : "Sign in"}
                </Button>
              </div>
            </div>
          </div>

          {/* Farm image panel */}
          <div className="relative hidden min-h-[560px] overflow-hidden md:block">
            <img
              src={farmLoginImage}
              alt="Mondol's Farm"
              className="absolute inset-0 size-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
