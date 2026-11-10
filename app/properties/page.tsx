
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Property = {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  monthly_rent: number;
  address: string;
  locality: string | null;
  city: string;
  image_urls: string[] | null;
  status: string;
  created_at: string;
};

const propertyTypes = [
  "All Types",
  "House",
  "Room",
  "Flat",
  "Apartment",
  "Shop",
  "Office",
  "PG",
  "Plot",
];

export default function PropertiesPage() {
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("All Types");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");

  useEffect(() => {
    async function loadProperties() {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setProperties((data || []) as Property[]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load properties. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const searchText = search.trim().toLowerCase();

      const searchableText = [
        property.locality || "",
        property.address || "",
        property.city || "",
        property.title || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchText || searchableText.includes(searchText);

      const matchesType =
        propertyType === "All Types" ||
        property.property_type === propertyType;

      const matchesMin =
        minRent === "" ||
        property.monthly_rent >= Number(minRent);

      const matchesMax =
        maxRent === "" ||
        property.monthly_rent <= Number(maxRent);

      return (
        matchesSearch &&
        matchesType &&
        matchesMin &&
        matchesMax
      );
    });
  }, [properties, search, propertyType, minRent, maxRent]);

  function clearFilters() {
    setSearch("");
    setPropertyType("All Types");
    setMinRent("");
    setMaxRent("");
  }

  function openProperty(id: string) {
    router.push(`/properties/${id}`);
  }

  return (
    <main className="min-h-screen bg-[#f5f7f4]">

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-5 py-5 flex justify-between items-center">

          <Link
            href="/"
            className="text-2xl font-extrabold text-green-950"
          >
            Hansi<span className="text-green-600"> Rentals</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="text-sm font-semibold text-green-900 hover:text-green-600"
            >
              Login / Register
            </Link>
          </div>

        </div>
      </header>

      {/* Hero */}
      <section className="bg-green-950 text-white px-5 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto">

          <p className="text-green-300 text-sm font-semibold uppercase tracking-widest mb-3">
            Find your next place
          </p>

          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Find a place
            <br />
            you can call home.
          </h1>

          <p className="text-green-100 mt-4 max-w-xl">
            Explore rental houses, rooms, flats, shops and more around Hansi.
          </p>

        </div>
      </section>

      {/* Main content */}
      <section className="max-w-7xl mx-auto px-5 py-10">

        <div className="mb-7">
          <h2 className="text-2xl font-bold text-gray-900">
            Available Properties
          </h2>

          <p className="text-gray-500 mt-1">
            Discover approved active listings on Hansi Rentals.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Locality search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search locality
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Enter locality or address"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>

            {/* Property type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Property type
              </label>

              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-green-700"
              >
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum rent */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Minimum rent (₹)
              </label>

              <input
                type="number"
                min="0"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
                placeholder="Minimum"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>

            {/* Maximum rent */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Maximum rent (₹)
              </label>

              <input
                type="number"
                min="0"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                placeholder="Maximum"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>

          </div>

          <div className="flex flex-wrap justify-between items-center gap-3 mt-5">

            <p className="text-sm text-gray-500">
              Showing {filteredProperties.length} of {properties.length} properties
            </p>

            <button
              onClick={clearFilters}
              className="text-green-800 font-semibold text-sm hover:underline"
            >
              Clear all filters
            </button>

          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-gray-500">
              Finding available properties...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 text-red-700 rounded-xl p-5">
            {error}
          </div>
        )}

        {/* No active properties */}
        {!loading && !error && properties.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center">

            <div className="text-5xl mb-4">🏡</div>

            <h3 className="text-xl font-bold text-gray-900">
              No properties available yet
            </h3>

            <p className="text-gray-500 mt-2">
              New rental properties will appear here once approved.
            </p>

          </div>
        )}

        {/* No filter matches */}
        {!loading &&
          !error &&
          properties.length > 0 &&
          filteredProperties.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center">

              <h3 className="text-xl font-bold text-gray-900">
                No matching properties found
              </h3>

              <p className="text-gray-500 mt-2">
                Try changing your search or rent filters.
              </p>

              <button
                onClick={clearFilters}
                className="mt-5 bg-green-900 text-white px-5 py-3 rounded-xl"
              >
                Reset filters
              </button>

            </div>
          )}

        {/* Property cards */}
        {!loading && !error && filteredProperties.length > 0 && (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {filteredProperties.map((property) => {
              const photos = property.image_urls || [];

              return (
                <article
                  key={property.id}
                  onClick={() => openProperty(property.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openProperty(property.id);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={`View details for ${property.title}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-700"
                >

                  {/* Property image */}
                  <div className="relative h-60 bg-gray-100">

                    {photos.length > 0 ? (
                      <img
                        src={photos[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-5xl">🏡</span>
                      </div>
                    )}

                    <span className="absolute top-4 left-4 bg-white text-green-900 px-3 py-1 rounded-full text-xs font-bold shadow">
                      {property.property_type}
                    </span>

                    {photos.length > 1 && (
                      <span className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
                        {photos.length} photos
                      </span>
                    )}

                  </div>

                  {/* Property information */}
                  <div className="p-5">

                    <h3 className="text-xl font-bold text-gray-900 truncate">
                      {property.title}
                    </h3>

                    <p className="text-gray-500 text-sm mt-2">
                      📍 {property.locality || property.city}, {property.city}
                    </p>

                    <p className="text-green-900 text-2xl font-extrabold mt-4">
                      ₹{property.monthly_rent.toLocaleString("en-IN")}

                      <span className="text-sm text-gray-500 font-normal">
                        {" "}/ month
                      </span>
                    </p>

                    <p className="text-gray-400 text-sm mt-3 line-clamp-2">
                      {property.address}
                    </p>

                    <div className="border-t mt-5 pt-4 flex justify-between items-center text-sm">

                      <span className="text-green-700 font-semibold">
                        Active listing
                      </span>

                      <span className="text-green-900 font-semibold">
                        View details →
                      </span>

                    </div>

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </section>

      {/* Footer */}
      <footer className="bg-green-950 text-green-100 px-5 py-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-3 text-sm">

          <p>© {new Date().getFullYear()} Hansi Rentals</p>

          <p>Find your next home in Hansi.</p>

        </div>
      </footer>

    </main>
  );
}
