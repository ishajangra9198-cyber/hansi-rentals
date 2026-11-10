
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Payment = {
  id: string;
  property_id: string;
  owner_id: string;
  amount: number;
  payer_name: string | null;
  utr_number: string | null;
  screenshot_url: string | null;
  status: "submitted" | "verified" | "rejected";
  admin_note: string | null;
  created_at: string;
  verified_at: string | null;
};

export default function AdminPaymentsPage() {
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth?mode=login");
      return;
    }

    const { data: admin } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!admin) {
      router.replace("/dashboard");
      return;
    }

    await loadPayments();
  }

  async function loadPayments() {
    setLoading(true);

    const { data, error } = await supabase
      .from("listing_payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Could not load payments: " + error.message);
    } else {
      setPayments((data || []) as Payment[]);
    }

    setLoading(false);
  }

  async function updatePayment(
    payment: Payment,
    status: "verified" | "rejected"
  ) {
    const action = status === "verified" ? "verify" : "reject";

    if (!window.confirm(`Are you sure you want to ${action} this payment?`)) {
      return;
    }

    setUpdatingId(payment.id);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Your session has expired. Please log in again.");
      setUpdatingId(null);
      return;
    }

    const updateData = {
      status,
      admin_note: notes[payment.id]?.trim() || null,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("listing_payments")
      .update(updateData)
      .eq("id", payment.id)
      .eq("status", "submitted");

    if (error) {
      setMessage("Payment update failed: " + error.message);
    } else {
      setMessage(
        status === "verified"
          ? "Payment verified successfully. You can now review the property."
          : "Payment rejected."
      );
      await loadPayments();
    }

    setUpdatingId(null);
  }

  const submitted = payments.filter((p) => p.status === "submitted");
  const verified = payments.filter((p) => p.status === "verified");
  const rejected = payments.filter((p) => p.status === "rejected");

  if (loading) {
    return <main style={styles.center}>Loading payment records...</main>;
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>Apna Basera</h1>
          <p style={styles.subtitle}>Listing payment verification</p>
        </div>

        <button
          style={styles.back}
          onClick={() => router.push("/admin")}
        >
          Back to Admin Dashboard
        </button>
      </header>

      <section style={styles.stats}>
        <Stat label="Awaiting Verification" value={submitted.length} />
        <Stat label="Verified Payments" value={verified.length} />
        <Stat label="Rejected Payments" value={rejected.length} />
      </section>

      {message && <p style={styles.message}>{message}</p>}

      <h2 style={styles.sectionHeading}>Payment Submissions</h2>

      {payments.length === 0 ? (
        <div style={styles.empty}>
          <h3>No payment submissions yet</h3>
          <p>New landlord payment details will appear here.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {payments.map((payment) => (
            <article key={payment.id} style={styles.card}>
              <div style={styles.cardTop}>
                <h3 style={styles.cardTitle}>Listing Payment</h3>
                <span
                  style={{
                    ...styles.status,
                    ...(payment.status === "verified"
                      ? styles.verified
                      : payment.status === "rejected"
                      ? styles.rejected
                      : styles.pending),
                  }}
                >
                  {payment.status}
                </span>
              </div>

              <p style={styles.amount}>₹{payment.amount}</p>

              <p style={styles.detail}>
                <strong>Property ID:</strong> {payment.property_id}
              </p>
              <p style={styles.detail}>
                <strong>Landlord ID:</strong> {payment.owner_id}
              </p>
              <p style={styles.detail}>
                <strong>Payer name:</strong> {payment.payer_name || "Not provided"}
              </p>
              <p style={styles.detail}>
                <strong>UTR number:</strong> {payment.utr_number || "Not provided"}
              </p>
              <p style={styles.detail}>
                <strong>Submitted:</strong>{" "}
                {new Date(payment.created_at).toLocaleString("en-IN")}
              </p>

              {payment.screenshot_url && (
                <a
                  href={payment.screenshot_url}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.screenshotLink}
                >
                  View payment screenshot
                </a>
              )}

              {payment.admin_note && (
                <p style={styles.detail}>
                  <strong>Previous admin note:</strong> {payment.admin_note}
                </p>
              )}

              {payment.status === "submitted" && (
                <>
                  <textarea
                    placeholder="Optional admin note..."
                    value={notes[payment.id] || ""}
                    onChange={(event) =>
                      setNotes((previous) => ({
                        ...previous,
                        [payment.id]: event.target.value,
                      }))
                    }
                    style={styles.textarea}
                  />

                  <div style={styles.actions}>
                    <button
                      disabled={updatingId === payment.id}
                      onClick={() => updatePayment(payment, "verified")}
                      style={styles.approve}
                    >
                      {updatingId === payment.id
                        ? "Please wait..."
                        : "Verify Payment"}
                    </button>

                    <button
                      disabled={updatingId === payment.id}
                      onClick={() => updatePayment(payment, "rejected")}
                      style={styles.reject}
                    >
                      Reject Payment
                    </button>
                  </div>
                </>
              )}

              {payment.status === "verified" && (
                <p style={styles.successText}>
                  Payment verified. Review the property separately in the
                  property management dashboard.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#F7F6F0",
    padding: "30px 5%",
    color: "#173D35",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 30,
  },
  heading: { fontSize: 30, fontWeight: 800, margin: 0 },
  subtitle: { color: "#547B65", marginTop: 6 },
  back: {
    background: "#173D35",
    color: "white",
    border: 0,
    padding: "12px 18px",
    borderRadius: 8,
    cursor: "pointer",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 15,
    marginBottom: 35,
  },
  statCard: {
    background: "white",
    padding: 22,
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "0 2px 12px #00000008",
  },
  sectionHeading: { fontSize: 23, marginBottom: 20 },
  message: {
    background: "#E4EFE5",
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  empty: {
    background: "white",
    padding: 40,
    borderRadius: 12,
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: 20,
  },
  card: {
    background: "white",
    borderRadius: 14,
    padding: 22,
    boxShadow: "0 3px 15px #0000000a",
    overflowWrap: "anywhere",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: { fontSize: 19, margin: 0 },
  status: {
    padding: "5px 10px",
    borderRadius: 20,
    fontSize: 12,
    textTransform: "capitalize",
  },
  pending: { background: "#FFF2D5", color: "#946000" },
  verified: { background: "#DFF5E5", color: "#16733B" },
  rejected: { background: "#FFE3E3", color: "#A32626" },
  amount: { fontSize: 25, fontWeight: 800, margin: "15px 0" },
  detail: { fontSize: 14, lineHeight: 1.6, margin: "8px 0" },
  screenshotLink: {
    display: "inline-block",
    margin: "12px 0",
    color: "#246B50",
    fontWeight: 700,
  },
  textarea: {
    width: "100%",
    minHeight: 75,
    padding: 12,
    border: "1px solid #D8DED8",
    borderRadius: 8,
    marginTop: 15,
    resize: "vertical",
    boxSizing: "border-box",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 15,
  },
  approve: {
    flex: 1,
    background: "#168344",
    color: "white",
    border: 0,
    padding: 12,
    borderRadius: 8,
    cursor: "pointer",
  },
  reject: {
    background: "#C93636",
    color: "white",
    border: 0,
    padding: "12px 18px",
    borderRadius: 8,
    cursor: "pointer",
  },
  successText: {
    background: "#E4EFE5",
    padding: 12,
    borderRadius: 8,
    color: "#246B50",
    fontSize: 13,
  },
};
