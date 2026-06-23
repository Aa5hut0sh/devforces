"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Grab the "from" parameter, default to home "/"
  const redirectUrl = searchParams.get("from") || "/";

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09050d] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#4d2562] border-t-[#FF9FFC] animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="relative min-h-screen bg-[#09050d] flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Decorative ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#4d2562]/20 blur-[120px] rounded-full pointer-events-none z-0" />

      <Link href="/" className="relative z-10 flex items-center gap-2 select-none mb-8 group">
        <Image
          src="/logo.svg"
          alt="DevForces Logo"
          width={28}
          height={28}
          className="rounded-full group-hover:scale-105 transition-transform"
        />
        <span className="font-sans text-xl font-bold text-white tracking-tight">
          DevForces
        </span>
      </Link>

      <main className="relative z-10 w-full max-w-sm">{children}</main>

      <p className="relative z-10 mt-8 text-[10px] text-zinc-600 font-mono tracking-widest uppercase">
        built for developers who ship
      </p>
    </div>
  );
}

// Suspense boundary is required by Next.js when using useSearchParams
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09050d] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#4d2562] border-t-[#FF9FFC] animate-spin" />
      </div>
    }>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </Suspense>
  );
}