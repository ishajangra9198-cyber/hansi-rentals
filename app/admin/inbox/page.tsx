
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SupportMessage = {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  message: string;
  rating: number | null;
  status: string;
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
};

export default function AdminInboxPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<SupportMessage | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadMessages() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth");
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !admin) {
      setNotice("Access denied. Admin account required.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setNotice("Could not load messages: " + error.message);
    } else {
      setMessages(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function saveReply() {
    if (!selected) return;

    if (!reply.trim()) {
      setNotice("Please write a reply first.");
      return;
    }

    setSaving(true);
    setNotice("");

    const { data, error } = await supabase
      .from("support_messages")
      .update({
        admin_reply: reply.trim(),
        status: "replied",
        replied_at: new Date().toISOString(),
      })
      .eq("id", selected.id)
      .select("*")
      .single();

    if (error) {
      setNotice("Reply failed: " + error.message);
    } else {
      setMessages((previous) =>
        previous.map((item) => item.id === data.id ? data : item)
      );
      setSelected(data);
      setReply(data.admin_reply || "");
      setNotice("Reply sent successfully!");
    }

    setSaving(false);
  }

  async function changeStatus(status: string) {
    if (!selected) return;

    setSaving(true);
    setNotice("");

    const { data, error } = await supabase
      .from("support_messages")
      .update({ status })
      .eq("id", selected.id)
      .select("*")
      .single();

    if (error) {
      setNotice("Could not update status: " + error.message);
    } else {
      setMessages((previous) =>
        previous.map((item) => item.id === data.id ? data : item)
      );
      setSelected(data);
      setNotice("Message status updated.");
    }

    setSaving(false);
  }

  const filteredMessages = messages.filter((item) => {
    return filter === "All" || item.category === filter || item.status === filter.toLowerCase();
  });

  const openCount = messages.filter((m) => m.status === "open").length;
  const repliedCount = messages.filter((m) => m.status === "replied").length;
  const resolvedCount = messages.filter((m) => m.status === "resolved").length;

  if (loading) {
    return <main style={styles.center}>Loading admin inbox...</main>;
  }

  if (notice.startsWith("Access denied")) {
    return (
      <main style={styles.center}>
        <h2>Access denied</h2>
        <p>{notice}</p>
        <button onClick={() => router.push("/admin")} style={styles.button}>
          Back to Admin
        </button>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <button onClick={() => router.push("/admin")} style={styles.back}>
          ← Back to Admin Dashboard
        </button>

        <h1 style={styles.heading}>Support Inbox</h1>
        <p style={styles.subtitle}>
          Manage user questions, feedback, reviews and property reports.
        </p>

        <div style={styles.stats}>
          <div style={styles.stat}>
            <strong>{messages.length}</strong>
            <span>Total</span>
          </div>
          <div style={styles.stat}>
            <strong>{openCount}</strong>
            <span>Open</span>
          </div>
          <div style={styles.stat}>
            <strong>{repliedCount}</strong>
            <span>Replied</span>
          </div>
          <div style={styles.stat}>
            <strong>{resolvedCount}</strong>
            <span>Resolved</span>
          </div>
        </div>

        <div style={styles.filters}>
          {["All", "Help & Support", "Feedback", "Review", "Report Property",
            "open", "replied", "resolved"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              style={{
                ...styles.filter,
                ...(filter === item ? styles.activeFilter : {}),
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {notice && <p role="status" style={styles.notice}>{notice}</p>}

        <div style={styles.layout}>
          <section style={styles.list}>
            <h2 style={styles.sectionTitle}>Incoming messages</h2>

            {filteredMessages.length === 0 ? (
              <p style={styles.muted}>No messages found.</p>
            ) : (
              filteredMessages.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelected(item);
                    setReply(item.admin_reply || "");
                    setNotice("");
                  }}
                  style={{
                    ...styles.messageItem,
                    ...(selected?.id === item.id ? styles.selectedItem : {}),
                  }}
                >
                  <div style={styles.itemTop}>
                    <strong>{item.category}</strong>
                    <span style={styles.status}>{item.status}</span>
                  </div>
                  <strong style={styles.itemSubject}>{item.subject}</strong>
                  <span style={styles.preview}>
                    {item.message.slice(0, 95)}
                    {item.message.length > 95 ? "..." : ""}
                  </span>
                  <small style={styles.date}>
                    {new Date(item.created_at).toLocaleString()}
                  </small>
                </button>
              ))
            )}
          </section>

          <section style={styles.detail}>
            {!selected ? (
              <div style={styles.empty}>
                <h2>Select a message</h2>
                <p>Choose a message from the inbox to read and reply.</p>
              </div>
            ) : (
              <>
                <span style={styles.category}>{selected.category}</span>
                <h2 style={styles.detailTitle}>{selected.subject}</h2>

                <p style={styles.userId}>
                  User ID: {selected.user_id}
                </p>

                {selected.rating && (
                  <p style={styles.rating}>
                    Rating: {"★".repeat(selected.rating)}
                  </p>
                )}

                <div style={styles.userMessage}>
                  <strong>User's message</strong>
                  <p>{selected.message}</p>
                </div>

                <label style={styles.label}>Admin reply</label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={6}
                  maxLength={3000}
                  placeholder="Write your response to the user..."
                  style={styles.textarea}
                />

                <button
                  onClick={saveReply}
                  disabled={saving || !reply.trim()}
                  style={styles.button}
                >
                  {saving ? "Saving..." : "Send Reply"}
                </button>

                <div style={styles.statusActions}>
                  <label style={styles.label}>Message status</label>
                  <select
                    value={selected.status}
                    disabled={saving}
                    onChange={(e) => changeStatus(e.target.value)}
                    style={styles.select}
                  >
                    <option value="open">Open</option>
                    <option value="replied">Replied</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <small style={styles.date}>
                  Received: {new Date(selected.created_at).toLocaleString()}
                </small>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f4f6fb",
    padding: "30px 18px",
    color: "#172033",
  },
  container: { maxWidth: 1200, margin: "0 auto" },
  center: { padding: 50, textAlign: "center" },
  back: {
    border: 0, background: "transparent", cursor: "pointer",
    marginBottom: 20, fontSize: 14,
  },
  heading: { fontSize: 32, fontWeight: 800, margin: 0 },
  subtitle: { color: "#64748b", marginBottom: 25 },
  stats: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
    gap: 12, marginBottom: 22,
  },
  stat: {
    background: "#fff", borderRadius: 12, padding: 17,
    display: "flex", flexDirection: "column", gap: 5,
  },
  filters: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 },
  filter: {
    border: "1px solid #dbe2ea", borderRadius: 20, padding: "8px 13px",
    background: "#fff", cursor: "pointer", fontSize: 12,
  },
  activeFilter: { background: "#1d4ed8", color: "#fff", borderColor: "#1d4ed8" },
  layout: {
    display: "grid", gridTemplateColumns: "minmax(260px,0.9fr) minmax(300px,1.4fr)",
    gap: 18, alignItems: "start",
  },
  list: { background: "#fff", borderRadius: 14, padding: 17 },
  detail: { background: "#fff", borderRadius: 14, padding: 22, minHeight: 350 },
  sectionTitle: { fontSize: 18, marginTop: 0 },
  messageItem: {
    display: "flex", flexDirection: "column", textAlign: "left",
    width: "100%", padding: 14, marginBottom: 9, borderRadius: 9,
    border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer",
    gap: 8, color: "#172033",
  },
  selectedItem: { border: "2px solid #2563eb", background: "#eff6ff" },
  itemTop: {
    display: "flex", justifyContent: "space-between", gap: 8,
    fontSize: 12, color: "#475569",
  },
  status: { color: "#2563eb", fontWeight: 700 },
  itemSubject: { fontSize: 15 },
  preview: { fontSize: 13, color: "#64748b", lineHeight: 1.5 },
  date: { color: "#94a3b8", display: "block", marginTop: 8 },
  category: { color: "#2563eb", fontSize: 13, fontWeight: 800 },
  detailTitle: { fontSize: 23, marginBottom: 5 },
  userId: { fontSize: 11, color: "#94a3b8", overflowWrap: "anywhere" },
  rating: { color: "#b45309", fontWeight: 700 },
  userMessage: {
    background: "#f8fafc", borderRadius: 9, padding: 16,
    margin: "20px 0",
  },
  label: { display: "block", fontWeight: 700, fontSize: 13, margin: "15px 0 8px" },
  textarea: {
    width: "100%", padding: 13, borderRadius: 9,
    border: "1px solid #cbd5e1", fontSize: 14, resize: "vertical",
  },
  button: {
    background: "#2563eb", color: "#fff", border: 0,
    padding: "12px 20px", borderRadius: 8, marginTop: 12,
    cursor: "pointer", fontWeight: 700,
  },
  statusActions: { marginTop: 15 },
  select: {
    width: "100%", padding: 11, border: "1px solid #cbd5e1",
    borderRadius: 8, background: "#fff",
  },
  notice: { color: "#2563eb", marginBottom: 15 },
  muted: { color: "#64748b" },
  empty: { textAlign: "center", padding: 50, color: "#64748b" },
};

