
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  state: string;
  contact_phone: string | null;
  image_urls: string[] | null;
  status: string;
  created_at: string;
};

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    async function loadProperty() {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", id)
          .eq("status", "active")
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setError("This property is unavailable or has not been approved yet.");
          return;
        }

        setProperty(data as Property);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load property details."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) loadProperty();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f7f4]">
        <p className="text-gray-500">Loading property details...</p>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f7f4] p-5">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-sm">
          <div className="text-5xl mb-4">🏡</div>
          <h1 className="text-2xl font-bold text-gray-900">
            Property unavailable
          </h1>
          <p className="text-gray-500 mt-3">
            {error || "This property could not be found."}
          </p>
          <button
            onClick={() => router.push("/properties")}
            className="mt-6 bg-green-900 text-white px-6 py-3 rounded-xl"
          >
            Browse properties
          </button>
        </div>
      </main>
    );
  }

  const photos = property.image_urls || [];

  return (
    <main className="min-h-screen bg-[#f5f7f4]">

      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-5 py-5 flex justify-between items-center">
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-extrabold text-green-950"
          >
            Hansi<span className="text-green-600"> Rentals</span>
          </button>

          <button
            onClick={() => router.push("/properties")}
            className="text-green-900 font-semibold"
          >
            ← All Properties
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 py-8">

        {/* Breadcrumb */}
        <button
          onClick={() => router.push("/properties")}
          className="text-green-800 font-semibold text-sm mb-6"
        >
          ← Back to listings
        </button>

        {/* Gallery */}
        <section className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm mb-8">
          {photos.length > 0 ? (
            <>
              <div className="rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={photos[selectedPhoto]}
                  alt={property.title}
                  className="w-full h-[280px] sm:h-[500px] object-contain"
                />
              </div>

              {photos.length > 1 && (
                <div className="flex gap-3 overflow-x-auto mt-4 pb-2">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhoto(index)}
                      className={`shrink-0 rounded-xl overflow-hidden border-2 ${
                        selectedPhoto === index
                          ? "border-green-800"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`${property.title} photo ${index + 1}`}
                        className="w-24 h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-100 rounded-xl text-5xl">
              🏡
            </div>
          )}
        </section>

        {/* Main details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">

            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold mb-4">
                {property.property_type}
              </span>

              <h1 className="text-3xl sm:text-4xl font-bold text-gray-950">
                {property.title}
              </h1>

              <p className="text-gray-500 mt-3">
                📍 {property.address}, {property.city}, {property.state}
              </p>

              <div className="border-t mt-6 pt-6 grid grid-cols-2 sm:grid-cols-3 gap-5">
                <div>
                  <p className="text-gray-400 text-sm">Bedrooms</p>
                  <p className="font-bold text-xl">
                    {property.bedrooms ?? 0}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Bathrooms</p>
                  <p className="font-bold text-xl">
                    {property.bathrooms ?? 0}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Property type</p>
                  <p className="font-bold text-lg">
                    {property.property_type}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-950">
                About this property
              </h2>

              <p className="text-gray-600 mt-4 whitespace-pre-wrap leading-7">
                {property.description || "No additional description provided."}
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-950">
                Location
              </h2>

              <p className="text-gray-600 mt-3">
                {property.locality ? `${property.locality}, ` : ""}
                {property.city}, {property.state}
              </p>

              <p className="text-gray-500 text-sm mt-2">
                {property.address}
              </p>
            </section>

          </div>

          {/* Rent and contact */}
          <aside className="space-y-5">

            <section className="bg-white rounded-2xl p-6 shadow-sm lg:sticky lg:top-6">
              <p className="text-gray-500 text-sm">Monthly rent</p>

              <p className="text-3xl font-extrabold text-green-900 mt-2">
                ₹{property.monthly_rent.toLocaleString("en-IN")}
                <span className="text-sm text-gray-500 font-normal">
                  {" "}/ month
                </span>
              </p>

              <div className="border-t mt-5 pt-5">
                <p className="text-gray-400 text-sm">
                  Security deposit
                </p>

                <p className="text-xl font-bold text-gray-900 mt-1">
                  ₹{(property.security_deposit || 0).toLocaleString("en-IN")}
                </p>
              </div>

              {property.contact_phone ? (
                <a
                  href={`tel:${property.contact_phone}`}
                  className="block text-center bg-green-900 hover:bg-green-800 text-white rounded-xl px-5 py-4 font-semibold mt-7"
                >
                  Contact Landlord
                </a>
              ) : (
                <p className="text-sm text-gray-500 mt-6">
                  Landlord contact information is not available.
                </p>
              )}

              <p className="text-gray-400 text-xs text-center mt-4">
                Hansi Rentals · Active listing
              </p>
            </section>

          </aside>
        </div>
      </div>
    </main>
  );
}
