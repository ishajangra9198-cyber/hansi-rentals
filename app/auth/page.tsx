
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>("signup");
  const [accountType, setAccountType] = useState("tenant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMode(searchParams.get("mode") === "login" ? "login" : "signup");
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (session) {
        router.replace("/dashboard");
      } else {
        setCheckingSession(false);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/dashboard");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setMessage("");
    setSuccess(false);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setMessage("Password must be at least 6 characters long.");
        return;
      }

      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              account_type: accountType,
            },
          },
        });

        if (error) throw error;

        if (data.user && !data.session) {
          setSuccess(true);
          setMessage(
            "Account created successfully! Please check your email and click the verification link. After verification, you will be automatically signed in."
          );
          setPassword("");
          setConfirmPassword("");
        } else if (data.session) {
          router.replace("/dashboard");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        router.replace("/dashboard");
      }
    } catch (error) {
      setSuccess(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F6F0] px-5">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#DCE4DC] border-t-[#173D35]" />
          <p className="text-sm text-gray-500">Checking your account...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F6F0] px-5 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#547B65]">
            Apna Basera
          </p>

          <h1 className="mt-3 text-3xl font-bold text-[#173D35]">
            {mode === "login" ? "Welcome back" : "Find your perfect place"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            {mode === "login"
              ? "Log in to manage your properties and account."
              : "Create your account and connect with rentals in Hansi."}
          </p>
        </div>

        <div className="rounded-3xl border border-[#E3E8E2] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 grid grid-cols-2 rounded-xl bg-[#F3F5F1] p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white text-[#173D35] shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Log In
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-white text-[#173D35] shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Create Account
            </button>
          </div>

          {message && (
            <div
              className={`mb-6 rounded-xl border p-4 text-sm leading-6 ${
                success
                  ? "border-green-100 bg-green-50 text-green-800"
                  : "border-red-100 bg-red-50 text-red-700"
              }`}
            >
              {success && <p className="mb-1 font-bold">✓ Check your email</p>}
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#344A40]">
                  I want to
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType("tenant")}
                    className={`rounded-xl border p-4 text-left transition ${
                      accountType === "tenant"
                        ? "border-[#547B65] bg-green-50"
                        : "border-[#E3E8E2] bg-white hover:bg-[#F8FAF7]"
                    }`}
                  >
                    <span className="block text-xl">🔍</span>
                    <span className="mt-2 block text-sm font-bold text-[#173D35]">
                      Find a Rental
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      I&apos;m looking for a property
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType("landlord")}
                    className={`rounded-xl border p-4 text-left transition ${
                      accountType === "landlord"
                        ? "border-[#547B65] bg-green-50"
                        : "border-[#E3E8E2] bg-white hover:bg-[#F8FAF7]"
                    }`}
                  >
                    <span className="block text-xl">🏠</span>
                    <span className="mt-2 block text-sm font-bold text-[#173D35]">
                      List a Property
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      I&apos;m a landlord
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344A40]">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-[#E3E8E2] bg-white px-4 py-3 text-sm text-[#202D28] outline-none transition placeholder:text-gray-400 focus:border-[#547B65] focus:ring-2 focus:ring-[#547B65]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#344A40]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "signup"
                    ? "At least 6 characters"
                    : "Enter your password"
                }
                required
                minLength={mode === "signup" ? 6 : undefined}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                className="w-full rounded-xl border border-[#E3E8E2] bg-white px-4 py-3 text-sm text-[#202D28] outline-none transition placeholder:text-gray-400 focus:border-[#547B65] focus:ring-2 focus:ring-[#547B65]/10"
              />
            </div>

            {mode === "signup" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#344A40]">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter your password again"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-[#E3E8E2] bg-white px-4 py-3 text-sm text-[#202D28] outline-none transition placeholder:text-gray-400 focus:border-[#547B65] focus:ring-2 focus:ring-[#547B65]/10"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#173D35] px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#245548] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating your account..."
                : mode === "login"
                  ? "Log In →"
                  : "Create Account →"}
            </button>
          </form>

          <div className="mt-6 border-t border-[#EEF1EC] pt-5 text-center">
            <p className="text-xs leading-5 text-gray-400">
              {mode === "signup"
                ? "After creating your account, please verify your email before using all features."
                : "Use your registered email address to access your Apna Basera account."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mx-auto mt-6 block text-sm font-semibold text-[#547B65] transition hover:text-[#173D35]"
        >
          ← Back to Home
        </button>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F7F6F0]">
          <p className="text-sm text-gray-500">Loading account page...</p>
        </main>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
