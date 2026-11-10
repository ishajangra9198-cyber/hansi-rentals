
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PropertyForm = {
  title: string;
  description: string;
  property_type: string;
  monthly_rent: string;
  security_deposit: string;
  bedrooms: string;
  bathrooms: string;
  address: string;
  locality: string;
  contact_phone: string;
};

const initialForm: PropertyForm = {
  title: "",
  description: "",
  property_type: "House",
  monthly_rent: "",
  security_deposit: "0",
  bedrooms: "0",
  bathrooms: "0",
  address: "",
  locality: "",
  contact_phone: "",
};

export default function AddPropertyPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [draftPropertyId, setDraftPropertyId] = useState("");
  const [payerName, setPayerName] = useState("");
  const [utr, setUtr] = useState("");

  const [form, setForm] = useState<PropertyForm>(initialForm);

  useEffect(() => {
    const urls = photos.map((photo) => URL.createObjectURL(photo));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  function updateField(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (photos.length + selected.length > 5) {
      setMessage("You can upload a maximum of 5 photos.");
      e.target.value = "";
      return;
    }

    const invalidFile = selected.find(
      (file) =>
        !allowedTypes.includes(file.type) ||
        file.size > 3 * 1024 * 1024
    );

    if (invalidFile) {
      setMessage("Only JPG, PNG or WebP photos up to 3 MB each are allowed.");
      e.target.value = "";
      return;
    }

    setMessage("");
    setPhotos((previous) => [...previous, ...selected]);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((previous) => previous.filter((_, i) => i !== index));
  }

  // STEP 1: Upload photos and save the property as a draft.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (Number(form.monthly_rent) <= 0) {
      setMessage("Please enter a valid monthly rent.");
      return;
    }

    setLoading(true);

    const uploadedPaths: string[] = [];

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/auth?mode=login");
        return;
      }

      if (user.user_metadata?.account_type !== "landlord") {
        setMessage("Only landlord accounts can submit properties.");
        return;
      }

      const imageUrls: string[] = [];

      for (const photo of photos) {
        const extension =
          photo.name.split(".").pop()?.toLowerCase() || "jpg";

        const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("property-mages")
          .upload(filePath, photo, {
            cacheControl: "3600",
            upsert: false,
            contentType: photo.type,
          });

        if (uploadError) throw uploadError;

        uploadedPaths.push(filePath);

        const { data: publicUrlData } = supabase.storage
          .from("property-mages")
          .getPublicUrl(filePath);

        imageUrls.push(publicUrlData.publicUrl);
      }

      const { data: property, error: insertError } = await supabase
        .from("properties")
        .insert({
          owner_id: user.id,
          title: form.title.trim(),
          description: form.description.trim(),
          property_type: form.property_type,
          monthly_rent: Number(form.monthly_rent),
          security_deposit: Number(form.security_deposit || 0),
          bedrooms: Number(form.bedrooms || 0),
          bathrooms: Number(form.bathrooms || 0),
          address: form.address.trim(),
          locality: form.locality.trim(),
          city: "Hansi",
          state: "Haryana",
          contact_phone: form.contact_phone.trim(),
          image_urls: imageUrls,
          status: "draft",
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      setDraftPropertyId(property.id);
      setShowPayment(true);
      setMessage("");

    } catch (error) {
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from("property-mages")
          .remove(uploadedPaths);

        if (cleanupError) {
          console.error("Photo cleanup failed:", cleanupError);
        }
      }

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // STEP 2: Save the landlord's payment details.
  async function handlePaymentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const cleanUtr = utr.trim();

    if (cleanUtr.length < 6 || cleanUtr.length > 30) {
      setMessage("Please enter a valid UPI transaction reference number.");
      return;
    }

    if (!payerName.trim()) {
      setMessage("Please enter the name used for your UPI payment.");
      return;
    }

    setPaymentLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/auth?mode=login");
        return;
      }

      const { error: paymentError } = await supabase
        .from("listing_payments")
        .insert({
          property_id: draftPropertyId,
          owner_id: user.id,
          amount: 10,
          currency: "INR",
          upi_id: "7206816625@okbizaxis",
          payer_name: payerName.trim(),
          utr: cleanUtr,
          status: "pending",
        });

      if (paymentError) throw paymentError;

      setSuccess(true);
      setShowPayment(false);
      setMessage(
        "Your payment details have been submitted. Our team will verify your payment and review your property."
      );

      setForm(initialForm);
      setPhotos([]);
      setPayerName("");
      setUtr("");

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Payment details could not be submitted. Please try again."
      );
    } finally {
      setPaymentLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#E3E8E2] bg-white px-4 py-3 text-sm text-[#202D28] outline-none transition placeholder:text-gray-400 focus:border-[#547B65] focus:ring-2 focus:ring-[#547B65]/10";

  const labelClass =
    "mb-2 block text-sm font-semibold text-[#344A40]";

  // SUCCESS SCREEN
  if (success) {
    return (
      <main className="min-h-screen bg-[#F7F6F0] px-5 py-12">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#E3E8E2] bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-700">
            ✓
          </div>

          <h1 className="mt-6 text-2xl font-bold text-[#173D35]">
            Payment submitted!
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            {message}
          </p>

          <div className="mt-6 rounded-2xl bg-[#F7F6F0] p-5 text-left">
            <p className="font-semibold text-[#173D35]">
              What happens next?
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Your property is now pending. Our admin team will verify your
              ₹10 payment and review your listing before it becomes visible
              to tenants.
            </p>
          </div>

          <button
            onClick={() => router.push("/my-properties")}
            className="mt-8 w-full rounded-xl bg-[#173D35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245548]"
          >
            View My Properties
          </button>
        </div>
      </main>
    );
  }

  // PAYMENT SCREEN
  if (showPayment) {
    return (
      <main className="min-h-screen bg-[#F7F6F0] px-5 py-10">
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            onClick={() => {
              setShowPayment(false);
              setMessage("");
            }}
            className="mb-5 text-sm font-semibold text-[#547B65] hover:text-[#173D35]"
          >
            ← Back to property details
          </button>

          <div className="rounded-3xl border border-[#E3E8E2] bg-white p-6 shadow-sm sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#547B65]">
              Apna Basera · Secure your listing
            </p>

            <h1 className="mt-3 text-3xl font-bold text-[#173D35]">
              Complete your payment
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Pay the one-time property listing registration fee to submit
              your property for admin review.
            </p>

            <div className="mt-7 rounded-2xl bg-[#F7F6F0] p-5 text-center">
              <p className="text-sm font-medium text-[#547B65]">
                Listing registration fee
              </p>
              <p className="mt-1 text-4xl font-bold text-[#173D35]">
                ₹10
              </p>
              <p className="mt-2 text-xs text-gray-500">
                One-time fee per property listing
              </p>
            </div>

            <div className="mt-7 flex flex-col items-center rounded-2xl border border-[#E3E8E2] p-5">
              <h2 className="font-bold text-[#173D35]">
                Scan this QR to pay
              </h2>

              <img
                src="/apna-basera-upi-qr.jpg"
                alt="Apna Basera UPI payment QR code for ₹10"
                className="mt-4 h-64 w-64 rounded-xl object-contain"
              />

              <p className="mt-3 text-sm font-semibold text-[#173D35]">
                UPI ID: 7206816625@okbizaxis
              </p>

              <p className="mt-2 text-center text-xs leading-5 text-gray-500">
                Enter ₹10 if it is not already filled in your UPI app.
                Please check the recipient details before paying.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-900">
                Important payment instructions
              </p>
              <ol className="mt-2 list-inside list-decimal space-y-2 text-sm leading-5 text-amber-900">
                <li>Pay exactly ₹10 using your UPI app.</li>
                <li>
                  Add your Apna Basera username or registered email in the
                  payment note, if your UPI app allows it.
                </li>
                <li>Keep your UPI transaction reference number (UTR).</li>
                <li>Enter the same payer name used for the payment below.</li>
              </ol>
            </div>

            {message && (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                {message}
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="mt-7 space-y-5">
              <div>
                <label className={labelClass}>
                  UPI payer name *
                </label>
                <input
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  required
                  maxLength={100}
                  placeholder="Name shown in your UPI app"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  UPI transaction reference number (UTR) *
                </label>
                <input
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  required
                  minLength={6}
                  maxLength={30}
                  placeholder="Enter your UPI transaction reference"
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-gray-400">
                  Find this in your UPI app's payment history or transaction
                  details.
                </p>
              </div>

              <button
                type="submit"
                disabled={paymentLoading}
                className="w-full rounded-xl bg-[#173D35] px-6 py-4 font-bold text-white transition hover:bg-[#245548] disabled:opacity-60"
              >
                {paymentLoading
                  ? "Submitting payment details..."
                  : "I Have Paid — Submit for Verification"}
              </button>

              <p className="text-center text-xs leading-5 text-gray-400">
                Your property will remain pending until the Apna Basera
                admin verifies the payment and approves the listing.
              </p>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // PROPERTY FORM
  return (
    <main className="min-h-screen bg-[#F7F6F0]">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#547B65] transition hover:text-[#173D35]"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6 rounded-3xl border border-[#E3E8E2] bg-white p-6 shadow-sm sm:p-9">
          <div className="border-b border-[#EEF1EC] pb-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#547B65]">
              Apna Basera · Landlord
            </p>

            <h1 className="mt-3 text-3xl font-bold text-[#173D35] sm:text-4xl">
              List Your Property
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
              Share your property details with people looking for a rental
              home or space in Hansi.
            </p>
          </div>

          {message && (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <section>
              <h2 className="mb-5 text-lg font-bold text-[#173D35]">
                01. Basic Information
              </h2>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Property title *</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    required
                    maxLength={100}
                    placeholder="e.g. Spacious 2 BHK House"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    rows={4}
                    maxLength={2000}
                    placeholder="Describe the property, facilities, nearby places and other useful details..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Property type *</label>
                  <select
                    name="property_type"
                    value={form.property_type}
                    onChange={updateField}
                    className={inputClass}
                  >
                    {[
                      "House",
                      "Room",
                      "Flat",
                      "Apartment",
                      "Shop",
                      "Office",
                      "PG",
                      "Plot",
                    ].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="border-t border-[#EEF1EC] pt-7">
              <h2 className="mb-5 text-lg font-bold text-[#173D35]">
                02. Rent & Property Details
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Monthly rent (₹) *</label>
                  <input
                    name="monthly_rent"
                    type="number"
                    min="1"
                    required
                    value={form.monthly_rent}
                    onChange={updateField}
                    placeholder="e.g. 8000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Security deposit (₹)</label>
                  <input
                    name="security_deposit"
                    type="number"
                    min="0"
                    value={form.security_deposit}
                    onChange={updateField}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Bedrooms</label>
                  <input
                    name="bedrooms"
                    type="number"
                    min="0"
                    value={form.bedrooms}
                    onChange={updateField}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Bathrooms</label>
                  <input
                    name="bathrooms"
                    type="number"
                    min="0"
                    value={form.bathrooms}
                    onChange={updateField}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="border-t border-[#EEF1EC] pt-7">
              <h2 className="mb-5 text-lg font-bold text-[#173D35]">
                03. Location & Contact
              </h2>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Full address *</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={updateField}
                    required
                    placeholder="House number, street, landmark..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Locality / Area</label>
                  <input
                    name="locality"
                    value={form.locality}
                    onChange={updateField}
                    placeholder="e.g. Model Town"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Contact phone *</label>
                  <input
                    name="contact_phone"
                    type="tel"
                    value={form.contact_phone}
                    onChange={updateField}
                    required
                    maxLength={15}
                    placeholder="Your contact number"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="border-t border-[#EEF1EC] pt-7">
              <h2 className="mb-2 text-lg font-bold text-[#173D35]">
                04. Property Photos
              </h2>

              <p className="mb-5 text-sm text-gray-500">
                Good-quality photos help tenants understand your property.
              </p>

              <input
                id="property-photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />

              <label
                htmlFor="property-photos"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#B9CCBD] bg-[#F8FAF7] p-8 text-center transition hover:bg-[#EFF4EE]"
              >
                <span className="mb-3 text-4xl">📸</span>
                <span className="font-bold text-[#173D35]">
                  Add Property Photos
                </span>
                <span className="mt-2 text-sm text-gray-500">
                  Select one or multiple photos
                </span>
                <span className="mt-2 text-xs text-gray-400">
                  JPG, PNG or WebP · Maximum 5 photos · 3 MB each
                </span>
              </label>

              {photos.length > 0 && (
                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#173D35]">
                      Selected photos ({photos.length}/5)
                    </p>

                    {photos.length < 5 && (
                      <label
                        htmlFor="property-photos"
                        className="cursor-pointer text-sm font-semibold text-[#547B65]"
                      >
                        + Add More
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {photos.map((photo, index) => (
                      <div
                        key={`${photo.name}-${index}`}
                        className="relative overflow-hidden rounded-xl border border-[#E3E8E2]"
                      >
                        <img
                          src={previews[index]}
                          alt={`Property photo ${index + 1}`}
                          className="h-36 w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-lg text-white shadow"
                          aria-label={`Remove photo ${index + 1}`}
                        >
                          ×
                        </button>

                        <p className="truncate p-2 text-xs text-gray-500">
                          {photo.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <div className="border-t border-[#EEF1EC] pt-7">
              <div className="mb-4 rounded-xl bg-[#F7F6F0] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#344A40]">
                    One-time listing fee
                  </span>
                  <span className="text-xl font-bold text-[#173D35]">
                    ₹10
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Payment will be requested after you submit your property details.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#173D35] px-6 py-4 font-bold text-white shadow-sm transition hover:bg-[#245548] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Uploading photos and saving..."
                  : "Continue to ₹10 Payment →"}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-gray-400">
                Your property will be sent for admin review after you submit
                your payment details.
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
