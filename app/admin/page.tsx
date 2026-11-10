"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Property = {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  monthly_rent: number;
  security_deposit: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  address: string;
  locality: string | null;
  city: string;
  contact_phone: string | null;
  status: "pending" | "active" | "rejected" | "inactive";
  image_urls: string[] | null;
  created_at: string;
};

type Filter = "pending" | "active" | "rejected" | "inactive" | "all";

export default function AdminPage() {
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    setLoading(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace("/auth");
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !admin) {
      router.replace("/dashboard");
      return;
    }

    await loadProperties();
  }

  async function loadProperties() {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Could not load properties: " + error.message);
    } else {
      setProperties((data || []) as Property[]);
    }

    setLoading(false);
  }

  // Admin approval is required, but payment is NOT required.
  async function updateStatus(
    propertyId: string,
    newStatus: "active" | "rejected" | "inactive"
  ) {
    const labels = {
      active: "approve and publish",
      rejected: "reject",
      inactive: "unpublish",
    };

    if (
      !window.confirm(
        `Are you sure you want to ${labels[newStatus]} this property?`
      )
    ) {
      return;
    }

    setUpdatingId(propertyId);
    setMessage("");

    // Directly update the property status.
    // No payment verification is required.
    const { error } = await supabase
      .from("properties")
      .update({ status: newStatus })
      .eq("id", propertyId);

    if (error) {
      setMessage("Status update failed: " + error.message);
    } else {
      setMessage(
        `Property successfully ${
          newStatus === "active"
            ? "approved and published"
            : newStatus === "inactive"
            ? "unpublished"
            : "rejected"
        }.`
      );

      await loadProperties();
    }

    setUpdatingId(null);
  }

  function getStoragePath(publicUrl: string) {
    const marker = "/storage/v1/object/public/property-mages/";
    const position = publicUrl.indexOf(marker);

    if (position === -1) return null;

    const encodedPath = publicUrl
      .slice(position + marker.length)
      .split("?")[0];

    try {
      return decodeURIComponent(encodedPath);
    } catch {
      return encodedPath;
    }
  }

  async function deleteProperty(property: Property) {
    const confirmed = window.confirm(
      `Permanently delete "${property.title}" and its uploaded photos? This cannot be undone.`
    );

    if (!confirmed) return;

    setUpdatingId(property.id);
    setMessage("");

    const paths = (property.image_urls || [])
      .map(getStoragePath)
      .filter((path): path is string => Boolean(path));

    // Delete the property record.
    const { error: deleteError } = await supabase
      .from("properties")
      .delete()
      .eq("id", property.id);

    if (deleteError) {
      setMessage("Could not delete property: " + deleteError.message);
      setUpdatingId(null);
      return;
    }

    // Delete uploaded photos.
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("property-mages")
        .remove(paths);

      if (storageError) {
        setMessage(
          "Property deleted, but some photos could not be removed: " +
            storageError.message
        );
        await loadProperties();
        setUpdatingId(null);
        return;
      }
    }

    setMessage("Property and its uploaded photos deleted successfully.");
    await loadProperties();
    setUpdatingId(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  const counts = {
    all: properties.length,
    pending: properties.filter((p) => p.status === "pending").length,
    active: properties.filter((p) => p.status === "active").length,
    rejected: properties.filter((p) => p.status === "rejected").length,
    inactive: properties.filter((p) => p.status === "inactive").length,
  };

  const filteredProperties =
    filter === "all"
      ? properties
      : properties.filter((p) => p.status === filter);

  if (loading) {
    return <main style={styles.center}>Loading admin dashboard...</main>;
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>Apna Basera Admin</h1>
          <p style={styles.subtitle}>Property management dashboard</p>
        </div>

        <button onClick={logout} style={styles.logout}>
          Logout
        </button>
      </header>

      <section style={styles.stats}>
        <Stat label="Total Properties" value={counts.all} />
        <Stat label="Pending Approval" value={counts.pending} />
        <Stat label="Published" value={counts.active} />
        <Stat label="Rejected" value={counts.rejected} />
        <Stat label="Unpublished" value={counts.inactive} />
      </section>

      <section>
        <h2 style={styles.sectionHeading}>Manage Properties</h2>

        <div style={styles.filters}>
          {(
            [
              "pending",
              "active",
              "rejected",
              "inactive",
              "all",
            ] as Filter[]
          ).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              style={{
                ...styles.filterButton,
                ...(filter === item ? styles.selectedFilter : {}),
              }}
            >
              {item === "all"
                ? "All Properties"
                : item.charAt(0).toUpperCase() + item.slice(1)}
              {" "}({counts[item]})
            </button>
          ))}
        </div>

        {message && <p style={styles.message}>{message}</p>}

        {filteredProperties.length === 0 ? (
          <div style={styles.empty}>
            <h3>No properties found</h3>
            <p>There are no listings in this category yet.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredProperties.map((property) => (
              <article key={property.id} style={styles.card}>
                {property.image_urls?.length ? (
                  <div style={styles.gallery}>
                    {property.image_urls.map((url, index) => (
                      <a
                        key={`${property.id}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={url}
                          alt={`${property.title} photo ${index + 1}`}
                          style={styles.image}
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div style={styles.noImage}>
                    No photos uploaded
                  </div>
                )}

                <div style={styles.cardContent}>
                  <div style={styles.cardTop}>
                    <h3 style={styles.cardTitle}>
                      {property.title}
                    </h3>

                    <span
                      style={{
                        ...styles.status,
                        ...(property.status === "active"
                          ? styles.activeStatus
                          : property.status === "rejected"
                          ? styles.rejectedStatus
                          : property.status === "inactive"
                          ? styles.inactiveStatus
                          : styles.pendingStatus),
                      }}
                    >
                      {property.status}
                    </span>
                  </div>

                  <p style={styles.rent}>
                    ₹{property.monthly_rent.toLocaleString("en-IN")}
                    <span style={styles.perMonth}> / month</span>
                  </p>

                  <p style={styles.detail}>
                    <strong>Type:</strong> {property.property_type}
                  </p>

                  <p style={styles.detail}>
                    <strong>Location:</strong>{" "}
                    {property.locality || "Not specified"},{" "}
                    {property.city}
                  </p>

                  <p style={styles.detail}>
                    <strong>Address:</strong> {property.address}
                  </p>

                  <p style={styles.detail}>
                    <strong>Deposit:</strong> ₹
                    {(property.security_deposit || 0).toLocaleString(
                      "en-IN"
                    )}
                  </p>

                  <p style={styles.detail}>
                    <strong>Bedrooms:</strong>{" "}
                    {property.bedrooms ?? 0}
                    {" | "}
                    <strong>Bathrooms:</strong>{" "}
                    {property.bathrooms ?? 0}
                  </p>

                  {property.contact_phone && (
                    <p style={styles.detail}>
                      <strong>Contact:</strong>{" "}
                      {property.contact_phone}
                    </p>
                  )}

                  <p style={styles.description}>
                    {property.description ||
                      "No description provided."}
                  </p>

                  <p style={styles.date}>
                    Submitted:{" "}
                    {new Date(
                      property.created_at
                    ).toLocaleDateString("en-IN")}
                  </p>

                  <div style={styles.actions}>
                    {property.status === "pending" && (
                      <>
                        <button
                          disabled={updatingId === property.id}
                          onClick={() =>
                            updateStatus(property.id, "active")
                          }
                          style={styles.approve}
                        >
                          {updatingId === property.id
                            ? "Please wait..."
                            : "Approve & Publish"}
                        </button>

                        <button
                          disabled={updatingId === property.id}
                          onClick={() =>
                            updateStatus(property.id, "rejected")
                          }
                          style={styles.reject}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {property.status === "active" && (
                      <button
                        disabled={updatingId === property.id}
                        onClick={() =>
                          updateStatus(property.id, "inactive")
                        }
                        style={styles.unpublish}
                      >
                        Unpublish
                      </button>
                    )}

                    {(property.status === "rejected" ||
                      property.status === "inactive") && (
                      <button
                        disabled={updatingId === property.id}
                        onClick={() =>
                          updateStatus(property.id, "active")
                        }
                        style={styles.approve}
                      >
                        Approve & Publish
                      </button>
                    )}

                    <button
                      disabled={updatingId === property.id}
                      onClick={() => deleteProperty(property)}
                      style={styles.delete}
                    >
                      {updatingId === property.id
                        ? "Please wait..."
                        : "Delete Permanently"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={styles.statCard}>
      <span>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
    </div>
  );
}

const styles: { [key: string]: CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#f5f6fa",
    padding: "30px 5%",
    color: "#172033",
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

  heading: {
    fontSize: 30,
    fontWeight: 800,
    margin: 0,
  },

  subtitle: {
    color: "#687386",
    marginTop: 6,
  },

  logout: {
    background: "#172033",
    color: "white",
    border: 0,
    padding: "11px 22px",
    borderRadius: 8,
    cursor: "pointer",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(145px, 1fr))",
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

  statValue: {
    fontSize: 26,
  },

  sectionHeading: {
    fontSize: 22,
    marginBottom: 18,
  },

  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },

  filterButton: {
    padding: "10px 18px",
    border: "1px solid #d8deea",
    background: "white",
    borderRadius: 8,
    cursor: "pointer",
  },

  selectedFilter: {
    background: "#172033",
    color: "white",
    borderColor: "#172033",
  },

  message: {
    background: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 18,
  },

  empty: {
    background: "white",
    padding: 40,
    borderRadius: 12,
    textAlign: "center",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(290px, 1fr))",
    gap: 22,
  },

  card: {
    background: "white",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 3px 15px #0000000a",
  },

  gallery: {
    display: "flex",
    overflowX: "auto",
    gap: 5,
    background: "#edf0f5",
  },

  image: {
    width: 230,
    height: 190,
    objectFit: "cover",
    display: "block",
  },

  noImage: {
    height: 150,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#edf0f5",
    color: "#687386",
  },

  cardContent: {
    padding: 20,
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  cardTitle: {
    fontSize: 19,
    margin: 0,
  },

  status: {
    padding: "5px 9px",
    borderRadius: 20,
    fontSize: 12,
    textTransform: "capitalize",
  },

  pendingStatus: {
    background: "#fff2d5",
    color: "#946000",
  },

  activeStatus: {
    background: "#dff5e5",
    color: "#16733b",
  },

  rejectedStatus: {
    background: "#ffe3e3",
    color: "#a32626",
  },

  inactiveStatus: {
    background: "#e5e7eb",
    color: "#374151",
  },

  rent: {
    fontSize: 22,
    fontWeight: 800,
    margin: "15px 0",
  },

  perMonth: {
    fontSize: 14,
    fontWeight: 400,
  },

  detail: {
    fontSize: 14,
    lineHeight: 1.5,
    margin: "7px 0",
  },

  description: {
    color: "#687386",
    fontSize: 14,
    lineHeight: 1.6,
    marginTop: 14,
  },

  date: {
    color: "#8992a2",
    fontSize: 12,
    marginTop: 15,
  },

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
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
    background: "#c93636",
    color: "white",
    border: 0,
    padding: "12px 18px",
    borderRadius: 8,
    cursor: "pointer",
  },

  unpublish: {
    flex: 1,
    background: "#536174",
    color: "white",
    border: 0,
    padding: 12,
    borderRadius: 8,
    cursor: "pointer",
  },

  delete: {
    background: "#991b1b",
    color: "white",
    border: 0,
    padding: "12px 14px",
    borderRadius: 8,
    cursor: "pointer",
  },
};