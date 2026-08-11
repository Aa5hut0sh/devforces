"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { contestService } from "@/services/contest.service";
import type { Contest } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function PracticeCard({ contest }: { contest: Contest }) {
  return (
    <Link
      href={`/contests/${contest.id}`}
      className="group flex flex-col h-full backdrop-blur-md border rounded-2xl p-6 transition-all duration-300 bg-[#1a1122]/60 border-[#4d2562]/40 hover:border-[#FF9FFC]/40 hover:bg-[#251830]/80"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="font-semibold text-zinc-100 group-hover:text-white transition text-lg tracking-tight leading-snug">
          {contest.title}
        </h2>
        <span className="shrink-0 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border tracking-wider bg-blue-500/10 text-blue-400 border-blue-500/30">
          PRACTICE
        </span>
      </div>

      <p className="text-sm text-zinc-500 mb-6 line-clamp-2 leading-relaxed flex-1">
        {contest.description || "\u00A0"}
      </p>

      <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 mt-auto">
        No time limit · Open ended
      </div>
    </Link>
  );
}

function PracticeSkeleton() {
  return (
    <div className="bg-[#1a1122]/40 border border-[#4d2562]/20 rounded-2xl p-6 animate-pulse backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="h-6 bg-white/5 rounded-md w-48" />
        <div className="h-5 bg-white/5 rounded-full w-20" />
      </div>
      <div className="h-4 bg-white/5 rounded-md w-full mb-2" />
      <div className="h-4 bg-white/5 rounded-md w-2/3 mb-6" />
      <div className="h-4 bg-white/5 rounded-md w-32" />
    </div>
  );
}

export default function PracticePage() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [contests, setContests] = useState<Contest[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }
    contestService
      .listPractice()
      .then(setContests)
      .catch(() => setError("Failed to load practice contests."))
      .finally(() => setFetching(false));
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="min-h-screen bg-[#09050d] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#4d2562] border-t-[#FF9FFC] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09050d] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#1a3562]/10 blur-[150px] rounded-full pointer-events-none z-0" />

      <main className="relative z-10 max-w-5xl mx-auto px-4 pt-28 pb-16">
        <div className="mb-12 text-center md:text-left">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Practice Contests
            </h1>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
              Always open
            </span>
          </div>
          <p className="text-base text-zinc-400">
            No time pressure. Build at your own pace and sharpen your skills.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-8">
            {error}
          </p>
        )}

        {fetching ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[...Array(2)].map((_, i) => <PracticeSkeleton key={i} />)}
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-32 text-zinc-500 bg-[#1a1122]/30 border border-[#4d2562]/20 rounded-3xl backdrop-blur-sm">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl">🎯</span>
            </div>
            <p className="font-semibold text-white mb-1">No practice sets yet</p>
            <p className="text-sm">Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {contests.map((c) => <PracticeCard key={c.id} contest={c} />)}
          </div>
        )}
      </main>
    </div>
  );
}