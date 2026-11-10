
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Property = {
  id: string;
  title: string;
  property_type: string;
  monthly_rent: number;
  locality: string | null;
  address: string;
  status: "pending" | "active" | "rejected" | "inactive";
  created_at: string;
  image_urls: string[] | null;
};

type Payment = {
  id: string;
  property_id: string;
  payer_name: string | null;
  utr_number: string | null;
  status: "submitted" | "verified" | "rejected";
  admin_note: string | null;
  created_at: string;
};

export default function MyPropertiesPage() {
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [payerNames, setPayerNames] = useState<Record<string, string>>({});
  const [utrNumbers, setUtrNumbers] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/auth?mode=login");
        return;
      }

      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (propertyError) throw propertyError;

      const ownedProperties = (propertyData || []) as Property[];
      setProperties(ownedProperties);

      if (ownedProperties.length > 0) {
        const { data: paymentData, error: paymentError } = await supabase
          .from("listing_payments")
          .select(
            "id, property_id, payer_name, utr_number, status, admin_note, created_at"
          )
          .eq("owner_id", user.id);

        if (paymentError) throw paymentError;

        setPayments((paymentData || []) as Payment[]);
      } else {
        setPayments([]);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your properties."
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitPayment(propertyId: string) {
    const payerName = payerNames[propertyId]?.trim();
    const utrNumber = utrNumbers[propertyId]?.trim();

    if (!payerName || !utrNumber) {
      setMessage("Please enter the payer name and UTR number.");
      return;
    }

    if (utrNumber.length < 6) {
      setMessage("Please enter a valid UTR or transaction reference.");
      return;
    }

    const existingPayment = payments.find(
      (payment) => payment.property_id === propertyId
    );

    if (existingPayment?.status === "verified") {
      setMessage("Payment for this property has already been verified.");
      return;
    }

    if (existingPayment?.status === "submitted") {
      setMessage("Your payment is already awaiting admin verification.");
      return;
    }

    setSubmittingId(propertyId);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/auth?mode=login");
        return;
      }

      const { error } = await supabase
        .from("listing_payments")
        .insert({
          property_id: propertyId,
          owner_id: user.id,
          amount: 10,
          currency: "INR",
          payer_name: payerName,
          utr_number: utrNumber,
          status: "submitted",
        });

      if (error) throw error;

      setMessage("Payment details submitted. Await admin verification.");

      setPayerNames((previous) => ({
        ...previous,
        [propertyId]: "",
      }));

      setUtrNumbers((previous) => ({
        ...previous,
        [propertyId]: "",
      }));

      await loadProperties();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? "Payment submission failed: " + error.message
          : "Unable to submit payment details."
      );
    } finally {
      setSubmittingId(null);
    }
  }

  function getPayment(propertyId: string) {
    return payments.find((payment) => payment.property_id === propertyId);
  }

  const paymentStatusStyle = {
    submitted: "bg-amber-50 text-amber-700 border border-amber-100",
    verified: "bg-green-50 text-green-700 border border-green-100",
    rejected: "bg-red-50 text-red-700 border border-red-100",
  };

  const propertyStatusStyle = {
    pending: "bg-amber-50 text-amber-700 border border-amber-100",
    active: "bg-green-50 text-[#356B52] border border-green-100",
    rejected: "bg-red-50 text-red-700 border border-red-100",
    inactive: "bg-gray-100 text-gray-600 border border-gray-200",
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F7F6F0]">
        <p className="text-gray-500">Loading your properties...</p>
      </main>
    );
  }

  const pendingCount = properties.filter(
    (property) => property.status === "pending"
  ).length;

  const activeCount = properties.filter(
    (property) => property.status === "active"
  ).length;

  return (
    <main className="min-h-screen bg-[#F7F6F0]">
      <div className="max-w-6xl mx-auto px-5 py-8 sm:px-8 sm:py-10">

        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#547B65] hover:text-[#173D35]"
        >
          ← Back to Dashboard
        </button>

        <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#547B65]">
              Your listings
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[#173D35] sm:text-4xl">
              My Properties
            </h1>
            <p className="mt-3 text-gray-500">
              Track your rental listings, payments and approval status.
            </p>
          </div>

          <button
            onClick={() => router.push("/add-property")}
            className="rounded-xl bg-[#173D35] px-5 py-3 font-semibold text-white hover:bg-[#245246]"
          >
            + Add Property
          </button>
        </div>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#E3E8E2] bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Properties</p>
            <p className="mt-2 text-3xl font-bold text-[#173D35]">
              {properties.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E3E8E2] bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pending Review</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E3E8E2] bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active Listings</p>
            <p className="mt-2 text-3xl font-bold text-[#356B52]">
              {activeCount}
            </p>
          </div>
        </section>

        {message && (
          <div className="mt-6 rounded-xl border border-[#DCE7DB] bg-white p-4 text-sm text-[#356B52]">
            {message}
          </div>
        )}

        {properties.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-[#E3E8E2] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E9EDE5] text-3xl">
              🏡
            </div>
            <h2 className="mt-5 text-xl font-bold text-[#173D35]">
              No properties listed yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Add your first rental property and submit it for review.
            </p>
            <button
              onClick={() => router.push("/add-property")}
              className="mt-6 rounded-xl bg-[#173D35] px-5 py-3 font-semibold text-white"
            >
              Add your first property
            </button>
          </section>
        ) : (
          <section className="mt-8 space-y-5">
            {properties.map((property) => {
              const photos = property.image_urls || [];
              const payment = getPayment(property.id);

              return (
                <article
                  key={property.id}
                  className="overflow-hidden rounded-2xl border border-[#E3E8E2] bg-white shadow-sm"
                >
                  <div className="p-5 sm:p-6">

                    {photos.length > 0 ? (
                      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
                        {photos.map((url, index) => (
                          <a
                            key={`${property.id}-${index}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <img
                              src={url}
                              alt={`${property.title} photo ${index + 1}`}
                              className="h-32 w-44 rounded-xl object-cover sm:h-40 sm:w-60"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-6 flex h-32 items-center justify-center rounded-xl bg-[#F1F3EF] text-sm text-gray-400">
                        No photos uploaded
                      </div>
                    )}

                    <div className="flex flex-col justify-between gap-5 sm:flex-row">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#547B65]">
                          {property.property_type}
                        </p>

                        <h2 className="mt-2 text-xl font-bold text-[#173D35]">
                          {property.title}
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                          {property.locality
                            ? `${property.locality} · `
                            : ""}
                          {property.address}
                        </p>

                        <p className="mt-4 text-lg font-bold text-[#173D35]">
                          ₹{property.monthly_rent.toLocaleString("en-IN")}
                          <span className="text-sm font-normal text-gray-500">
                            {" "} / month
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:items-end">
                        <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase ${propertyStatusStyle[property.status]}`}>
                          Listing: {property.status}
                        </span>

                        <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase ${
                          payment
                            ? paymentStatusStyle[payment.status]
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}>
                          Payment: {payment?.status || "Not submitted"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-[#EEF1EC] pt-5">
                      <h3 className="font-bold text-[#173D35]">
                        Listing Payment
                      </h3>

                      <p className="mt-2 text-sm text-gray-500">
                        Listing fee: <strong className="text-[#173D35]">₹10</strong>
                      </p>

                      {payment?.status === "verified" && (
                        <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800">
                          Your ₹10 payment has been verified.
                        </div>
                      )}

                      {payment?.status === "submitted" && (
                        <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                          Your payment details have been submitted. Please wait
                          for the Apna Basera admin to verify them.
                          {payment.utr_number && (
                            <p className="mt-2">
                              Reference: {payment.utr_number}
                            </p>
                          )}
                        </div>
                      )}

                      {payment?.status === "rejected" && (
                        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
                          Your previous payment submission was rejected.
                          {payment.admin_note && (
                            <p className="mt-2">
                              Admin note: {payment.admin_note}
                            </p>
                          )}
                          <p className="mt-2">
                            Please contact support if you need help before
                            submitting another payment.
                          </p>
                        </div>
                      )}

                      {!payment && property.status !== "active" && (
                        <div className="mt-4 rounded-xl border border-[#E3E8E2] bg-[#F7F6F0] p-4">
                          <p className="text-sm leading-6 text-gray-600">
                            Payment instructions will appear here once the
                            official Apna Basera UPI QR is configured.
                            Please do not transfer money using an old QR.
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            You can prepare your payment details after the
                            official payment instructions are available.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 border-t border-[#EEF1EC] pt-4 text-xs text-gray-400">
                      Submitted on{" "}
                      {new Date(property.created_at).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
