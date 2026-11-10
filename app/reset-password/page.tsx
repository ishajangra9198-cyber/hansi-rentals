
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (active) {
        setReady(Boolean(session));
        if (!session) {
          setError("This recovery link is invalid or expired. Please request a new one.");
        }
      }
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
        setError("");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Your password has been updated successfully. You can now log in.");
      setPassword("");
      setConfirmPassword("");
      await supabase.auth.signOut();
    }

    setLoading(false);
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.brand}>Apna Basera</h1>
        <h2 style={styles.heading}>Create a new password</h2>

        <p style={styles.description}>
          Choose a new password for your account.
        </p>

        {ready ? (
          <form onSubmit={updatePassword}>
            <label style={styles.label}>New password</label>
            <input
              type="password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={styles.input}
            />

            <label style={styles.label}>Confirm new password</label>
            <input
              type="password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter password again"
              style={styles.input}
            />

            <button disabled={loading} type="submit" style={styles.button}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        ) : (
          <p style={styles.error}>
            {error || "Checking your recovery link..."}
          </p>
        )}

        {error && ready && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}

        <Link href="/auth?mode=login" style={styles.link}>
          Back to Login
        </Link>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#F7F6F0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 430,
    background: "white",
    padding: 35,
    borderRadius: 18,
    boxShadow: "0 8px 35px #173D3512",
  },
  brand: { color: "#173D35", fontSize: 27, fontWeight: 800 },
  heading: { color: "#173D35", fontSize: 23 },
  description: { color: "#687386", lineHeight: 1.6, fontSize: 14 },
  label: { display: "block", fontWeight: 600, marginBottom: 8 },
  input: {
    width: "100%",
    padding: 13,
    border: "1px solid #D8DED8",
    borderRadius: 8,
    boxSizing: "border-box",
    marginBottom: 18,
  },
  button: {
    width: "100%",
    background: "#173D35",
    color: "white",
    border: 0,
    borderRadius: 8,
    padding: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  error: { color: "#B42318", fontSize: 13, lineHeight: 1.5 },
  success: {
    color: "#246B50",
    background: "#E4EFE5",
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
  },
  link: {
    display: "block",
    textAlign: "center",
    color: "#547B65",
    marginTop: 22,
    textDecoration: "none",
  },
};
