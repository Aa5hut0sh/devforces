"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { contestService } from "@/services/contest.service";
import type { Contest } from "@/lib/types";

const STATUS_STYLES = {
  LIVE: "bg-[#FF9FFC]/10 text-[#FF9FFC] border-[#FF9FFC]/30 shadow-[0_0_10px_rgba(255,159,252,0.2)] animate-pulse",
  UPCOMING: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  ENDED: "bg-zinc-800/40 text-zinc-500 border-zinc-700/50",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ContestCard({ contest }: { contest: Contest }) {
  const status = contest.status ?? "UPCOMING";
  const isEnded = status === "ENDED";

  return (
    <Link
      href={isEnded ? "#" : `/contests/${contest.id}`}
      onClick={(e) => isEnded && e.preventDefault()}
      className={`group block backdrop-blur-md border rounded-2xl p-6 transition-all duration-300 ${
        isEnded
          ? "bg-[#110a17]/40 border-zinc-800/40 opacity-60 cursor-not-allowed"
          : "bg-[#1a1122]/60 border-[#4d2562]/40 hover:border-[#FF9FFC]/50 hover:bg-[#251830]/80 hover:shadow-[0_0_25px_rgba(255,159,252,0.1)] hover:-translate-y-1"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="font-semibold text-zinc-100 group-hover:text-white transition text-lg tracking-tight leading-snug">
          {contest.title}
        </h2>
        <span className={`shrink-0 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border tracking-wider ${STATUS_STYLES[status]}`}>
          {status === "LIVE" ? "LIVE" : status}
        </span>
      </div>

      {contest.description && (
        <p className="text-sm text-zinc-400 mb-6 line-clamp-2 leading-relaxed">
          {contest.description}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 bg-black/20 w-fit px-3 py-1.5 rounded-lg border border-white/5">
        <span>Starts {formatDate(contest.startTime)}</span>
        <span className="text-zinc-700">|</span>
        <span>Ends {formatDate(contest.endTime)}</span>
      </div>
    </Link>
  );
}

function ContestSkeleton() {
  return (
    <div className="bg-[#1a1122]/40 border border-[#4d2562]/20 rounded-2xl p-6 animate-pulse backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="h-6 bg-white/5 rounded-md w-48" />
        <div className="h-5 bg-white/5 rounded-full w-16" />
      </div>
      <div className="h-4 bg-white/5 rounded-md w-full mb-2" />
      <div className="h-4 bg-white/5 rounded-md w-2/3 mb-6" />
      <div className="h-6 bg-white/5 rounded-lg w-64" />
    </div>
  );
}

export default function ContestsPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [contests, setContests] = useState<Contest[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      // Redirect to login with the current path saved
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }
    
    contestService
      .list()
      .then(setContests)
      .catch(() => setError("Failed to load contests."))
      .finally(() => setFetching(false));
  }, [isLoading, isAuthenticated, router, pathname]);

  // Updated Loading Spinner
  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="min-h-screen bg-[#09050d] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#4d2562] border-t-[#FF9FFC] animate-spin" />
      </div>
    );
  }

  const live = contests.filter((c) => c.status === "LIVE");
  const upcoming = contests.filter((c) => c.status === "UPCOMING");
  const ended = contests.filter((c) => c.status === "ENDED");

  return (
    <div className="min-h-screen bg-[#09050d] relative overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#4d2562]/10 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Main Content (added pt-28 to clear the global navbar) */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 pt-28 pb-16">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
            Active Contests
          </h1>
          <p className="text-base text-zinc-400">
            Select a competition, read the constraints, and start coding.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-8">
            {error}
          </p>
        )}

        {fetching ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => <ContestSkeleton key={i} />)}
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-32 text-zinc-500 bg-[#1a1122]/30 border border-[#4d2562]/20 rounded-3xl backdrop-blur-sm">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
               <span className="text-xl">🏆</span>
            </div>
            <p className="font-semibold text-white mb-1">No contests available</p>
            <p className="text-sm">Check back later for new coding challenges.</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {live.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">Live Now</h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {live.map((c) => <ContestCard key={c.id} contest={c} />)}
                </div>
              </section>
            )}
            
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-5 ml-1">Upcoming</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {upcoming.map((c) => <ContestCard key={c.id} contest={c} />)}
                </div>
              </section>
            )}
            
            {ended.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-5 ml-1">Past Contests</h2>
                <div className="grid gap-6 sm:grid-cols-2 opacity-80">
                  {ended.map((c) => <ContestCard key={c.id} contest={c} />)}
                </div>
              </section>
            )}

          </div>
        )}
      </main>
    </div>
  );
}