"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type SupportMessage = {
  id: string;
  category: string;
  subject: string;
  message: string;
  rating: number | null;
  status: string;
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
};

const categories = [
  "Help & Support",
  "Feedback",
  "Review",
  "Report Property",
];

export default function HelpPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [category, setCategory] = useState("Help & Support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error">("success");

  useEffect(() => {
    async function loadPage() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/auth?mode=login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setNoticeType("error");
        setNotice("Could not load your messages. Please refresh the page.");
        setNoticeType("error");
      } else {
        setMessages(data || []);
      }

      setLoading(false);
    }

    loadPage();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    if (!userId || !subject.trim() || !message.trim()) {
      setNoticeType("error");
      setNotice("Please complete all required fields.");
      return;
    }

    if (subject.trim().length > 120 || message.trim().length > 3000) {
      setNoticeType("error");
      setNotice("Subject must be under 120 characters and message under 3000.");
      return;
    }

    setSending(true);

    const { data, error } = await supabase
      .from("support_messages")
      .insert({
        user_id: userId,
        category,
        subject: subject.trim(),
        message: message.trim(),
        rating: category === "Review" ? rating : null,
      })
      .select("*")
      .single();

    if (error) {
      setNoticeType("error");
      setNotice(error.message);
      setSending(false);
      return;
    }

    setMessages((previous) => [data, ...previous]);
    setSubject("");
    setMessage("");
    setRating(5);
    setNoticeType("success");
    setNotice("Your message has been sent successfully! Our team will review it.");
    setSending(false);
  }

  const statusColor = (status: string) => {
    if (status === "resolved") return "#287A49";
    if (status === "replied") return "#315F9C";
    return "#A36A22";
  };

  const statusLabel = (status: string) => {
    if (status === "resolved") return "RESOLVED";
    if (status === "replied") return "REPLIED";
    return status.toUpperCase();
  };

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingIcon}>⌛</div>
        <p>Loading your Apna Basera support centre...</p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <Link href="/dashboard" style={styles.back}>
          ← Back to Dashboard
        </Link>

        <header style={styles.header}>
          <div style={styles.eyebrow}>APNA BASERA · SUPPORT CENTRE</div>

          <h1 style={styles.heading}>
            We're here to <span style={styles.headingAccent}>help.</span>
          </h1>

          <p style={styles.subheading}>
            Have a question, suggestion, or concern? Send us a message.
            Our team will review it and reply right here.
          </p>
        </header>

        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>💬</div>
            <h3>Need help?</h3>
            <p>Ask us about using Apna Basera.</p>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>💡</div>
            <h3>Have an idea?</h3>
            <p>Share suggestions to improve the platform.</p>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>🛡️</div>
            <h3>Report an issue</h3>
            <p>Let us know about a property concern.</p>
          </div>
        </div>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.stepLabel}>GET IN TOUCH</div>
              <h2 style={styles.sectionTitle}>Send us a message</h2>
              <p style={styles.cardDescription}>
                Tell us how we can assist you.
              </p>
            </div>
            <div style={styles.cardIcon}>✉</div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>

            <label style={styles.label}>What do you need help with?</label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.input}
            >
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            {category === "Review" && (
              <div style={styles.ratingBox}>
                <label style={styles.label}>How would you rate Apna Basera?</label>

                <div style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() => setRating(number)}
                      aria-label={`Rate ${number} out of 5`}
                      style={{
                        ...styles.starButton,
                        color: number <= rating ? "#D49B36" : "#D8DED8",
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <p style={styles.ratingCaption}>{rating} out of 5 stars</p>
              </div>
            )}

            <label style={styles.label}>Subject *</label>

            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Briefly describe your issue"
              maxLength={120}
              required
              style={styles.input}
            />

            <div style={styles.fieldHint}>{subject.length}/120 characters</div>

            <label style={styles.label}>Your message *</label>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here. Please include relevant details..."
              maxLength={3000}
              rows={6}
              required
              style={styles.textarea}
            />

            <div style={styles.fieldHint}>{message.length}/3000 characters</div>

            {notice && (
              <div
                role="status"
                style={{
                  ...styles.notice,
                  background: noticeType === "success" ? "#EDF6EE" : "#FFF0EE",
                  color: noticeType === "success" ? "#287A49" : "#B33E35",
                  borderColor: noticeType === "success" ? "#D6EADB" : "#F2D7D3",
                }}
              >
                <strong>{noticeType === "success" ? "✓ " : "!"}</strong>
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              style={{
                ...styles.submit,
                opacity: sending ? 0.65 : 1,
                cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              {sending ? "Sending your message..." : "Send Message →"}
            </button>

            <p style={styles.privacyNote}>
              Your message is associated with your account and can be viewed by our admin team.
            </p>
          </form>
        </section>

        <section style={styles.history}>
          <div style={styles.historyHeader}>
            <div>
              <div style={styles.stepLabel}>YOUR ACTIVITY</div>
              <h2 style={styles.sectionTitle}>Previous messages</h2>
            </div>

            <div style={styles.countBadge}>
              {messages.length} {messages.length === 1 ? "MESSAGE" : "MESSAGES"}
            </div>
          </div>

          {messages.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>📭</div>
              <h3>No messages yet</h3>
              <p>Your support requests and replies will appear here.</p>
            </div>
          ) : (
            messages.map((item) => (
              <article key={item.id} style={styles.messageCard}>
                <div style={styles.messageTop}>
                  <span style={styles.category}>{item.category}</span>

                  <span
                    style={{
                      ...styles.status,
                      color: statusColor(item.status),
                      background: `${statusColor(item.status)}12`,
                    }}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>

                <h3 style={styles.subject}>{item.subject}</h3>

                <p style={styles.messageText}>{item.message}</p>

                {item.rating && (
                  <p style={styles.ratingHistory}>
                    Your rating: {"★".repeat(item.rating)}
                  </p>
                )}

                {item.admin_reply && (
                  <div style={styles.reply}>
                    <strong>Reply from Apna Basera Team</strong>
                    <p>{item.admin_reply}</p>

                    {item.replied_at && (
                      <small>
                        Replied: {new Date(item.replied_at).toLocaleString()}
                      </small>
                    )}
                  </div>
                )}

                <small style={styles.date}>
                  Submitted: {new Date(item.created_at).toLocaleString()}
                </small>
              </article>
            ))
          )}
        </section>

        <footer style={styles.footer}>
          <strong>Apna Basera</strong>
          <p>Making it easier to find a place to call home.</p>
        </footer>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#F7F6F0",
    padding: "35px 18px 65px",
    color: "#263A31",
  },
  loadingPage: {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#547B65",
    background: "#F7F6F0",
  },
  loadingIcon: { fontSize: 34 },
  container: { maxWidth: 850, margin: "0 auto" },
  back: {
    display: "inline-block",
    color: "#547B65",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
    marginBottom: 28,
  },
  header: { marginBottom: 28 },
  eyebrow: {
    color: "#547B65",
    fontWeight: 800,
    letterSpacing: 2,
    fontSize: 11,
  },
  heading: {
    fontSize: "clamp(30px, 5vw, 42px)",
    fontWeight: 850,
    color: "#173D35",
    margin: "12px 0",
    letterSpacing: -1.2,
  },
  headingAccent: { color: "#709477" },
  subheading: {
    color: "#718078",
    lineHeight: 1.8,
    maxWidth: 650,
    margin: 0,
    fontSize: 15,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 13,
    marginBottom: 24,
  },
  infoCard: {
    background: "#EDF1E9",
    border: "1px solid #E1E8DD",
    borderRadius: 16,
    padding: 18,
  },
  infoIcon: { fontSize: 24, marginBottom: 12 },
  card: {
    background: "#FFFFFF",
    border: "1px solid #E5E9E1",
    borderRadius: 22,
    padding: "clamp(20px, 4vw, 32px)",
    boxShadow: "0 8px 30px rgba(23,61,53,0.04)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    borderBottom: "1px solid #EEF1EC",
    paddingBottom: 22,
    marginBottom: 24,
  },
  stepLabel: {
    color: "#78917C",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: 2,
    marginBottom: 7,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#173D35",
    margin: 0,
  },
  cardDescription: { color: "#87928A", fontSize: 13, marginTop: 7 },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    background: "#EDF3EC",
    color: "#547B65",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 24,
    flexShrink: 0,
  },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  label: {
    fontSize: 13,
    fontWeight: 750,
    color: "#344A40",
    marginTop: 9,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 15px",
    border: "1px solid #DFE6DE",
    borderRadius: 11,
    fontSize: 14,
    background: "#FFFFFF",
    color: "#263A31",
    outlineColor: "#709477",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 15px",
    border: "1px solid #DFE6DE",
    borderRadius: 11,
    fontSize: 14,
    background: "#FFFFFF",
    color: "#263A31",
    resize: "vertical",
    outlineColor: "#709477",
    lineHeight: 1.6,
  },
  fieldHint: {
    color: "#A1AAA2",
    fontSize: 11,
    textAlign: "right",
  },
  ratingBox: {
    background: "#F8F8F3",
    padding: 15,
    borderRadius: 12,
    marginTop: 5,
  },
  stars: { display: "flex", gap: 7, marginTop: 5 },
  starButton: {
    background: "transparent",
    border: 0,
    fontSize: 31,
    cursor: "pointer",
    padding: 0,
  },
  ratingCaption: { fontSize: 12, color: "#87928A", margin: "4px 0 0" },
  notice: {
    padding: 14,
    border: "1px solid",
    borderRadius: 11,
    fontSize: 13,
    lineHeight: 1.6,
  },
  submit: {
    background: "#173D35",
    color: "#FFFFFF",
    padding: 16,
    border: 0,
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 14,
    marginTop: 9,
    transition: "background 0.2s",
  },
  privacyNote: {
    color: "#A0A9A1",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 1.6,
    margin: "5px 0 0",
  },
  history: { marginTop: 40 },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 19,
  },
  countBadge: {
    background: "#E8EEE6",
    color: "#547B65",
    padding: "8px 12px",
    borderRadius: 30,
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: 0.5,
  },
  empty: {
    padding: 35,
    background: "#FFFFFF",
    border: "1px solid #E5E9E1",
    borderRadius: 17,
    textAlign: "center",
    color: "#718078",
  },
  emptyIcon: { fontSize: 32, marginBottom: 10 },
  messageCard: {
    background: "#FFFFFF",
    borderRadius: 16,
    padding: 21,
    marginBottom: 14,
    border: "1px solid #E5E9E1",
  },
  messageTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  category: { fontSize: 11, color: "#78917C", fontWeight: 800 },
  status: {
    fontSize: 10,
    fontWeight: 850,
    padding: "6px 10px",
    borderRadius: 20,
  },
  subject: {
    fontSize: 17,
    fontWeight: 800,
    color: "#263A31",
    margin: "15px 0 8px",
  },
  messageText: {
    color: "#718078",
    lineHeight: 1.7,
    fontSize: 14,
    whiteSpace: "pre-wrap",
  },
  ratingHistory: { color: "#B47D29", fontWeight: 750, fontSize: 13 },
  reply: {
    background: "#F0F5EF",
    borderLeft: "3px solid #709477",
    padding: 15,
    borderRadius: 9,
    marginTop: 16,
    color: "#344A40",
    lineHeight: 1.7,
    fontSize: 13,
  },
  date: { display: "block", color: "#A0AAA1", marginTop: 15, fontSize: 11 },
  footer: {
    textAlign: "center",
    marginTop: 40,
    color: "#78917C",
    fontSize: 13,
  },
};