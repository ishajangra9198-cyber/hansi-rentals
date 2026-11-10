
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Role = "admin" | "landlord" | "tenant";

type Property = {
  id: string;
  title: string;
  property_type: string;
  monthly_rent: number;
  locality: string | null;
  city: string;
  status: string;
  image_urls: string[] | null;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace("/auth");
      return;
    }

    setEmail(user.email || "");
    setFullName(
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User"
    );

    // IMPORTANT: Check admin membership BEFORE account metadata.
    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError) {
      setError("Could not verify your account role: " + adminError.message);
      setLoading(false);
      return;
    }

    if (admin) {
      setRole("admin");
      await loadAdminProperties();
      return;
    }

    // Only non-admin users reach this section.
    const accountType = user.user_metadata?.account_type;

    if (accountType === "landlord") {
      setRole("landlord");
    } else {
      setRole("tenant");
    }

    setLoading(false);
  }

  async function loadAdminProperties() {
    const { data, error: propertiesError } = await supabase
      .from("properties")
      .select(
        "id, title, property_type, monthly_rent, locality, city, status, image_urls, created_at"
      )
      .order("created_at", { ascending: false });

    if (propertiesError) {
      setError("Could not load uploaded properties: " + propertiesError.message);
    } else {
      setProperties((data || []) as Property[]);
    }

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (loading) {
    return (
      <main style={styles.center}>
        <p>Loading your dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.center}>
        <div style={styles.errorBox}>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button style={styles.button} onClick={logout}>
            Logout
          </button>
        </div>
      </main>
    );
  }

  // ADMIN DASHBOARD: No tenant or landlord options.
  if (role === "admin") {
    return (
      <main style={styles.page}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.heading}>Apna Basera Admin</h1>
            <p style={styles.subtitle}>Property management</p>
          </div>

          <button onClick={logout} style={styles.logout}>
            Logout
          </button>
        </header>

        <section style={styles.welcome}>
          <p style={styles.eyebrow}>ADMINISTRATOR</p>
          <h2>Welcome, {fullName}</h2>
          <p>{email}</p>
          <p style={styles.adminDescription}>
            View and manage properties submitted to Apna Basera.
          </p>

          <button
            style={styles.primaryButton}
            onClick={() => router.push("/admin")}
          >
            Manage Properties
          </button>
        </section>

        <section style={styles.stats}>
          <div style={styles.statCard}>
            <span>Total Uploaded</span>
            <strong>{properties.length}</strong>
          </div>
          <div style={styles.statCard}>
            <span>Pending</span>
            <strong>
              {properties.filter((p) => p.status === "pending").length}
            </strong>
          </div>
          <div style={styles.statCard}>
            <span>Published</span>
            <strong>
              {properties.filter((p) => p.status === "active").length}
            </strong>
          </div>
        </section>

        <section>
          <h2 style={styles.sectionHeading}>Uploaded Properties</h2>

          {properties.length === 0 ? (
            <div style={styles.empty}>
              No properties have been uploaded yet.
            </div>
          ) : (
            <div style={styles.grid}>
              {properties.map((property) => (
                <article key={property.id} style={styles.card}>
                  {property.image_urls?.[0] ? (
                    <img
                      src={property.image_urls[0]}
                      alt={property.title}
                      style={styles.image}
                    />
                  ) : (
                    <div style={styles.noImage}>No property photo</div>
                  )}

                  <div style={styles.cardContent}>
                    <div style={styles.cardTop}>
                      <h3 style={styles.cardTitle}>{property.title}</h3>
                      <span style={styles.status}>
                        {property.status}
                      </span>
                    </div>

                    <p style={styles.rent}>
                      ₹{property.monthly_rent.toLocaleString("en-IN")}
                      <span style={styles.perMonth}> / month</span>
                    </p>

                    <p style={styles.detail}>
                      {property.property_type}
                    </p>

                    <p style={styles.detail}>
                      {property.locality ? `${property.locality}, ` : ""}
                      {property.city}
                    </p>

                    <p style={styles.date}>
                      Uploaded:{" "}
                      {new Date(property.created_at).toLocaleDateString("en-IN")}
                    </p>

                    <button
                      style={styles.secondaryButton}
                      onClick={() => router.push("/admin")}
                    >
                      View in Property Management
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  // LANDLORD DASHBOARD
  if (role === "landlord") {
    return (
      <main style={styles.page}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.heading}>Apna Basera</h1>
            <p style={styles.subtitle}>Landlord Dashboard</p>
          </div>
          <button onClick={logout} style={styles.logout}>Logout</button>
        </header>

        <section style={styles.welcome}>
          <h2>Welcome, {fullName}!</h2>
          <p>{email}</p>
          <p>You are signed in as a Landlord.</p>
        </section>

        <section style={styles.actionGrid}>
          <button style={styles.actionButton} onClick={() => router.push("/add-property")}>
            Add a Property
          </button>
          <button style={styles.actionButton} onClick={() => router.push("/my-properties")}>
            My Properties
          </button>
          <button style={styles.actionButton} onClick={() => router.push("/properties")}>
            Browse Properties
          </button>
          <button style={styles.actionButton} onClick={() => router.push("/help")}>
            Help & Support
          </button>
        </section>
      </main>
    );
  }

  // TENANT DASHBOARD
  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>Apna Basera</h1>
          <p style={styles.subtitle}>Tenant Dashboard</p>
        </div>
        <button onClick={logout} style={styles.logout}>Logout</button>
      </header>

      <section style={styles.welcome}>
        <h2>Welcome, {fullName}!</h2>
        <p>{email}</p>
        <p>You are signed in as a Tenant.</p>
      </section>

      <section style={styles.actionGrid}>
        <button style={styles.actionButton} onClick={() => router.push("/properties")}>
          Browse Properties
        </button>
        <button style={styles.actionButton} onClick={() => router.push("/help")}>
          Help & Support
        </button>
      </section>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#F7F6F0",
    color: "#173D35",
    padding: "30px 5%",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorBox: {
    maxWidth: 500,
    padding: 25,
    background: "white",
    borderRadius: 14,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    flexWrap: "wrap",
    marginBottom: 30,
  },
  heading: { fontSize: 30, fontWeight: 800, margin: 0 },
  subtitle: { color: "#547B65", marginTop: 6 },
  logout: {
    background: "#173D35",
    color: "white",
    border: 0,
    padding: "11px 22px",
    borderRadius: 8,
    cursor: "pointer",
  },
  welcome: {
    background: "white",
    padding: 25,
    borderRadius: 15,
    marginBottom: 25,
    boxShadow: "0 3px 15px #173D3510",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 2,
    color: "#709477",
  },
  adminDescription: { color: "#547B65", marginTop: 12 },
  primaryButton: {
    background: "#173D35",
    color: "white",
    border: 0,
    padding: "12px 20px",
    borderRadius: 8,
    cursor: "pointer",
    marginTop: 12,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 15,
    marginBottom: 35,
  },
  statCard: {
    background: "white",
    padding: 22,
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sectionHeading: { fontSize: 23, marginBottom: 18 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
  },
  card: {
    background: "white",
    borderRadius: 13,
    overflow: "hidden",
    boxShadow: "0 3px 15px #173D3510",
  },
  image: { width: "100%", height: 190, objectFit: "cover" },
  noImage: {
    height: 150,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#E8EDE7",
    color: "#547B65",
  },
  cardContent: { padding: 18 },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: { fontSize: 18, margin: 0 },
  status: {
    fontSize: 12,
    background: "#E8EDE7",
    color: "#173D35",
    padding: "5px 9px",
    borderRadius: 20,
    textTransform: "capitalize",
  },
  rent: { fontSize: 21, fontWeight: 800, margin: "14px 0" },
  perMonth: { fontSize: 13, fontWeight: 400 },
  detail: { color: "#547B65", fontSize: 14 },
  date: { color: "#89958C", fontSize: 12 },
  secondaryButton: {
    width: "100%",
    background: "#547B65",
    color: "white",
    border: 0,
    padding: 11,
    borderRadius: 8,
    cursor: "pointer",
    marginTop: 10,
  },
  empty: {
    background: "white",
    padding: 30,
    borderRadius: 12,
    textAlign: "center",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 15,
  },
  actionButton: {
    background: "white",
    color: "#173D35",
    border: "1px solid #D7E1D8",
    padding: 22,
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
  },
  button: {
    background: "#173D35",
    color: "white",
    border: 0,
    padding: 12,
    borderRadius: 8,
    cursor: "pointer",
  },
};
