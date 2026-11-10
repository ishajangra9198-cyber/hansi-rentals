"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"signup" | "login">(
    searchParams.get("mode") === "login" ? "login" : "signup"
  );

  const [role, setRole] = useState<"landlord" | "tenant">("tenant");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Keep the form in sync with Login / Sign up buttons in the header
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    setMode(urlMode === "login" ? "login" : "signup");
    setMessage("");
  }, [searchParams]);

  function changeMode(newMode: "signup" | "login") {
    setMode(newMode);
    setMessage("");
    router.replace(`/auth?mode=${newMode}`);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name.trim(),
              account_type: role,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage("Account created successfully! You are now signed in.");
        } else {
          setMessage(
            "Account created! Please check your email to verify your account."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F6F0] flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-3xl border border-[#E5E8E2] bg-white p-7 shadow-xl shadow-[#173D35]/5 sm:p-9">
        
        {/* Brand */}
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#173D35] text-xl font-bold text-white">
            A
          </div>

          <div>
            <p className="text-xl font-extrabold tracking-tight text-[#173D35]">
              apna<span className="text-[#547B65]"> basera</span>
            </p>

            <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-gray-500">
              Find your place. Feel at home.
            </p>
          </div>
        </Link>

        <p className="mt-6 text-sm text-gray-500">
          Your local rental marketplace for finding a place or listing your
          property.
        </p>

        {/* Login / Signup selector */}
        <div className="mt-8 flex rounded-2xl bg-[#F7F6F0] p-1.5">
          <button
            type="button"
            onClick={() => changeMode("signup")}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-white text-[#173D35] shadow-sm"
                : "text-gray-500 hover:text-[#173D35]"
            }`}
          >
            Create account
          </button>

          <button
            type="button"
            onClick={() => changeMode("login")}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-[#173D35] text-white shadow-sm"
                : "text-gray-500 hover:text-[#173D35]"
            }`}
          >
            Login
          </button>
        </div>

        <h1 className="mt-7 text-2xl font-bold text-[#173D35]">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {mode === "signup"
            ? "Join Apna Basera to find or list a rental property."
            : "Sign in to access your account and manage your properties."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Full name
                </label>

                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none transition focus:border-[#547B65] focus:ring-2 focus:ring-[#547B65]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  I want to
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("tenant")}
                    className={`rounded-xl border p-3 text-sm font-medium transition ${
                      role === "tenant"
                        ? "border-[#547B65] bg-[#E9EDE5] text-[#173D35]"
                        : "border-gray-200 text-gray-600 hover:bg-[#F7F6F0]"
                    }`}
                  >
                    Find a home
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("landlord")}
                    className={`rounded-xl border p-3 text-sm font-medium transition ${
                      role === "landlord"
                        ? "border-[#547B65] bg-[#E9EDE5] text-[#173D35]"
                        : "border-gray-200 text-gray-600 hover:bg-[#F7F6F0]"
                    }`}
                  >
                    List property
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email address
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-200 p-3 outline-none transition focus:border-[#547B65] focus:ring-2 focus:ring-[#547B65]/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-gray-200 p-3 outline-none transition focus:border-[#547B65] focus:ring-2 focus:ring-[#547B65]/10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#173D35] py-3.5 font-semibold text-white transition hover:bg-[#245548] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
                ? "Create my account"
                : "Login to my account"}
          </button>
        </form>

        {message && (
          <div className="mt-5 rounded-xl bg-[#E9EDE5] p-3 text-sm text-[#173D35] break-words">
            {message}
          </div>
        )}

        <p className="mt-7 text-center text-xs leading-5 text-gray-400">
          By continuing, you agree to use Apna Basera responsibly.
        </p>
      </div>
    </main>
  );
}