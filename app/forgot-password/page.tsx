
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendRecoveryEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (error) {
      setError(error.message);
    } else {
      setMessage(
        "If an account exists for this email, a password recovery link will be sent. Please check your inbox and spam folder."
      );
    }

    setLoading(false);
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.brand}>Apna Basera</h1>
        <h2 style={styles.heading}>Forgot your password?</h2>

        <p style={styles.description}>
          Enter your registered email address. We'll send you a secure
          password reset link.
        </p>

        <form onSubmit={sendRecoveryEmail}>
          <label style={styles.label}>Email address</label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}
          {message && <p style={styles.success}>{message}</p>}

          <button disabled={loading} type="submit" style={styles.button}>
            {loading ? "Sending..." : "Send Recovery Link"}
          </button>
        </form>

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
  brand: {
    color: "#173D35",
    fontSize: 27,
    fontWeight: 800,
    marginTop: 0,
  },
  heading: {
    color: "#173D35",
    fontSize: 23,
  },
  description: {
    color: "#687386",
    lineHeight: 1.6,
    fontSize: 14,
    marginBottom: 25,
  },
  label: {
    display: "block",
    fontWeight: 600,
    marginBottom: 8,
  },
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
  error: { color: "#B42318", fontSize: 13 },
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
