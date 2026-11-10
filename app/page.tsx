"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const properties = [
  {
    id: 1,
    title: "Sunny Independent Room",
    location: "Near Railway Station, Hansi",
    price: 4500,
    type: "Room",
    beds: "1 room",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85",
    tag: "Popular",
  },
  {
    id: 2,
    title: "Modern Studio Apartment",
    location: "Near GJU Road, Hansi",
    price: 7000,
    type: "Flat",
    beds: "1 BHK",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85",
    tag: "New listing",
  },
  {
    id: 3,
    title: "Comfortable Family Home",
    location: "Model Town, Hansi",
    price: 9500,
    type: "House",
    beds: "2 BHK",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=85",
    tag: "Spacious",
  },
];

export default function Home() {
  const [location, setLocation] = useState("");
  const [type, setType] = useState("All");
  const [budget, setBudget] = useState("15000");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const filtered = useMemo(() => {
    return properties.filter((property) => {
      const matchesLocation =
        property.location
          .toLowerCase()
          .includes(location.toLowerCase()) ||
        property.title.toLowerCase().includes(location.toLowerCase());

      const matchesType = type === "All" || property.type === type;
      const matchesBudget = property.price <= Number(budget);

      return matchesLocation && matchesType && matchesBudget;
    });
  }, [location, type, budget]);

  return (
    <main className="min-h-screen bg-[#F7F6F0] text-[#202D28]">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#E9EDE5]">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#D5E1D1] blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:px-10 md:py-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C8D7C8] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#173D35]">
              <span className="h-2 w-2 rounded-full bg-[#27845C]" />
              Your local rental marketplace
            </p>

            <h1 className="max-w-xl text-5xl font-semibold leading-[1.08] tracking-tight md:text-7xl">
              Your next place
              <br />
              <span className="font-serif italic text-[#547B65]">
                feels like home.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-gray-600 md:text-lg">
              Discover rooms, flats and houses for rent in your area.
              Find a place that fits your life, your family and your budget.
            </p>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-600">
              <span>✓ Simple property search</span>
              <span>✓ Local rental listings</span>
              <span>✓ Easy registration</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/properties"
                className="rounded-full bg-[#173D35] px-7 py-3.5 font-semibold text-white transition hover:bg-[#245548]"
              >
                Explore rentals →
              </Link>

              <Link
                href={user ? "/add-property" : "/auth?mode=signup"}
                className="rounded-full border border-[#173D35] px-7 py-3.5 font-semibold text-[#173D35] transition hover:bg-white"
              >
                List your property
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rotate-3 rounded-[2rem] bg-[#D5DFD0]" />

            <div className="relative overflow-hidden rounded-[2rem] bg-white p-3 shadow-xl shadow-[#173D35]/10">
              <img
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90"
                alt="Bright modern home"
                className="h-72 w-full rounded-[1.5rem] object-cover sm:h-96"
              />

              <div className="flex items-center justify-between gap-3 px-3 py-5">
                <div>
                  <p className="font-semibold">A place of your own</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Your search starts here.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#E9EDE5] px-4 py-3 text-center">
                  <p className="text-xs text-gray-500">Explore</p>
                  <p className="font-bold text-[#173D35]">Your Area</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROPERTY SEARCH */}
      <section className="relative z-10 mx-auto -mt-1 max-w-7xl px-5 md:-mt-8 md:px-10">
        <div className="rounded-3xl bg-white p-5 shadow-xl shadow-black/5 ring-1 ring-black/5 md:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Find a place to call home
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Start with your preferred locality and budget.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Location
              </span>

              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter your locality"
                className="w-full rounded-xl border border-gray-200 bg-[#F7F6F0] px-4 py-3.5 text-sm outline-none transition focus:border-[#547B65] focus:ring-2 focus:ring-[#547B65]/15"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Property type
              </span>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#F7F6F0] px-4 py-3.5 text-sm outline-none focus:border-[#547B65]"
              >
                <option>All</option>
                <option>Room</option>
                <option>Flat</option>
                <option>House</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Maximum monthly rent
              </span>

              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-[#F7F6F0] px-4 py-3.5 text-sm outline-none focus:border-[#547B65]"
              >
                <option value="5000">Up to ₹5,000</option>
                <option value="8000">Up to ₹8,000</option>
                <option value="10000">Up to ₹10,000</option>
                <option value="15000">Up to ₹15,000</option>
              </select>
            </label>

            <Link
              href="/properties"
              className="flex items-center justify-center gap-2 self-end rounded-xl bg-[#173D35] px-5 py-3.5 font-semibold text-white transition hover:bg-[#245548]"
            >
              Find rentals →
            </Link>
          </div>
        </div>
      </section>

      {/* SAMPLE PROPERTY CARDS */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#547B65]">
              Discover your next home
            </p>

            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Places worth coming home to
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Explore rental options and find a place that suits you.
            </p>
          </div>

          <Link
            href="/properties"
            className="text-sm font-semibold text-[#173D35] hover:underline"
          >
            View all rentals →
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => (
            <Link
              href="/properties"
              key={property.id}
              className="group block cursor-pointer overflow-hidden rounded-3xl border border-[#E5E8E2] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5"
            >
              <div className="relative overflow-hidden">
                <img
                  src={property.image}
                  alt={property.title}
                  className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#173D35]">
                  {property.tag}
                </span>

                <span className="absolute bottom-4 right-4 rounded-full bg-[#173D35] px-3 py-2 text-xs font-semibold text-white">
                  {property.type}
                </span>
              </div>

              <div className="p-5">
                <p className="text-2xl font-bold text-[#173D35]">
                  ₹{property.price.toLocaleString("en-IN")}
                  <span className="text-sm font-normal text-gray-500">
                    {" "}/ month
                  </span>
                </p>

                <h3 className="mt-3 text-lg font-semibold">
                  {property.title}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  📍 {property.location}
                </p>

                <div className="my-5 border-t border-gray-100" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{property.beds}</span>

                  <span className="font-semibold text-[#547B65]">
                    View rentals →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-lg font-semibold">
              No matching properties found
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Try a different location, property type or budget.
            </p>

            <button
              onClick={() => {
                setLocation("");
                setType("All");
                setBudget("15000");
              }}
              className="mt-5 rounded-full bg-[#173D35] px-5 py-3 text-sm font-semibold text-white"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#547B65]">
              Simple and convenient
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Finding a home, made simpler.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Discover",
                desc: "Search rental options by locality, property type and monthly budget.",
              },
              {
                n: "02",
                title: "Compare",
                desc: "Review photos, rent and property details before making a decision.",
              },
              {
                n: "03",
                title: "Connect",
                desc: "Find the right property and connect through the platform.",
              },
            ].map((item) => (
              <div key={item.n} className="rounded-3xl bg-[#F7F6F0] p-7">
                <p className="text-sm font-bold text-[#547B65]">
                  {item.n}
                </p>

                <h3 className="mt-4 text-xl font-semibold">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROPERTY OWNER SECTION */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-20">
        <div className="overflow-hidden rounded-[2rem] bg-[#173D35] p-8 text-white md:p-14">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D5E5C8]">
                For property owners
              </p>

              <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight md:text-5xl">
                Have a property to rent?
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-white/75 md:text-base">
                Help someone find their next home. Create your account and list
                your property on Apna Basera.
              </p>
            </div>

            <Link
              href={user ? "/add-property" : "/auth?mode=signup"}
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 font-semibold text-[#173D35] transition hover:bg-[#E9E4D8]"
            >
              {user ? "Add your property ↗" : "Get started ↗"}
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#E5E8E2] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-9 text-sm text-gray-500 sm:flex-row md:px-10">
          <div>
            <p className="text-lg font-bold text-[#173D35]">
              apna<span className="text-[#547B65]"> basera</span>
            </p>

            <p className="mt-1">
              © 2026 Apna Basera. Find your place. Feel at home.
            </p>
          </div>

          <div className="flex flex-wrap gap-5">
            <Link href="/" className="hover:text-[#173D35]">
              Home
            </Link>

            <Link href="/properties" className="hover:text-[#173D35]">
              Properties
            </Link>

            <Link href="/auth?mode=login" className="hover:text-[#173D35]">
              Login
            </Link>

            <Link href="/help" className="hover:text-[#173D35]">
              Help & Feedback
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}