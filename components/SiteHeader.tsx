
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SiteHeader() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkUser = async (currentUser: any) => {
      if (!mounted) return;

      setUser(currentUser);
      setIsAdmin(false);

      if (currentUser) {
        const { data } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (mounted) setIsAdmin(!!data);
      }

      if (mounted) setLoading(false);
    };

    supabase.auth.getUser().then(({ data }) => {
      checkUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (!error) {
      setUser(null);
      setIsAdmin(false);
      router.push("/");
      router.refresh();
    }
  };

  const linkClass = (path: string) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      pathname === path
        ? "bg-[#173D35] text-white shadow-sm"
        : "bg-[#F7F6F0] text-[#35483F] hover:bg-[#E9EDE5]"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E8E2] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-10">

        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#173D35] text-2xl font-bold text-white">
            A
          </div>

          <div>
            <p className="text-xl font-extrabold tracking-tight text-[#173D35]">
              apna<span className="text-[#547B65]"> basera</span>
            </p>
            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-gray-500">
              Find your place. Feel at home.
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-2">
          <Link href="/" className={linkClass("/")}>Home</Link>
          <Link href="/properties" className={linkClass("/properties")}>Properties</Link>

          {user && (
            <>
              <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
              <Link href="/my-properties" className={linkClass("/my-properties")}>My Properties</Link>
              <Link href="/add-property" className={linkClass("/add-property")}>Add Property</Link>
            </>
          )}

          {isAdmin && (
            <Link href="/admin" className={linkClass("/admin")}>Admin</Link>
          )}

          <Link href="/help" className={linkClass("/help")}>Help</Link>
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-xs text-gray-400">Loading...</span>
          ) : user ? (
            <>
              <span className="hidden max-w-[130px] truncate text-xs text-gray-500 sm:block">
                {user.email}
              </span>

              <button
                onClick={handleLogout}
                className="rounded-full border border-[#173D35] px-4 py-2 text-sm font-semibold text-[#173D35] transition hover:bg-[#E9EDE5]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth?mode=login"
                className="rounded-full border border-[#173D35] px-4 py-2 text-sm font-semibold text-[#173D35] transition hover:bg-[#E9EDE5]"
              >
                Login
              </Link>

              <Link
                href="/auth?mode=signup"
                className="rounded-full bg-[#173D35] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#245548]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
