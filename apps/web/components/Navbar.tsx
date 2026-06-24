"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Hide on auth pages
  const isAuthPage = pathname === "/login" || pathname === "/register";
  // Hide on workspace pages (e.g., /contests/123) but keep on /contests
  const isWorkspacePage = pathname.match(/^\/contests\/[^/]+$/);

  if (isAuthPage || isWorkspacePage) return null;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-50">
      <div className="bg-[#1a1122]/80 backdrop-blur-md border border-[#4d2562]/50 rounded-2xl px-6 py-3 flex items-center justify-between shadow-2xl">
        
        <Link href="/" className="flex items-center gap-2 select-none group">
          <Image
            src="/logo.svg"
            alt="DevForces Logo"
            width={24}
            height={24}
            className="rounded-full group-hover:scale-105 transition-transform"
          />
          <span className="font-sans text-sm font-semibold text-white tracking-tight">
            DevForces
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/contests" className="text-md font-medium text-zinc-300 hover:text-white transition-colors">
            Contests
          </Link>
        </div>

        <div className="flex items-center gap-5">
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="text-sm font-medium text-[#FF9FFC] hover:text-white transition">
                  Admin
                </Link>
              )}
              <span className="text-sm font-medium text-zinc-300">
                {user?.name.split(" ")[0] || user?.email.split("@")[0]}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                Log in
              </Link>
              <Link href="/register" className="bg-white text-black px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-zinc-200 transition-colors active:scale-95">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}