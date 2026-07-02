"use client";

import { useState } from "react";
import type {
  TestResult,
} from "@/lib/types";

import {
  VscChevronDown,
  VscChevronRight,
} from "react-icons/vsc";





const STATUS_STYLE: Record<string, string> = {
  PASSED: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20",
  FAILED: "text-red-400 bg-red-400/10 border-red-500/20",
  PENDING: "text-zinc-400 bg-zinc-400/10 border-zinc-500/20",
  RUNNING: "text-violet-400 bg-violet-400/10 border-violet-500/20",
  ERROR: "text-orange-400 bg-orange-400/10 border-orange-500/20",
};

function SubmissionHistoryCard({ s, index, total }: { s: any; index: number; total: number }) {
  const [expanded, setExpanded] = useState(false);
  const testResults = (s.testResults as TestResult[]) || [];

  return (
    <div className="bg-[#0a0a0c] border border-zinc-800/60 rounded-xl flex flex-col transition-all overflow-hidden">
      {/* ── Header (Clickable to Expand) ── */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="p-4 flex flex-col gap-3 hover:bg-white/[0.02] text-left transition-colors w-full focus:outline-none"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-500">#{total - index}</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${STATUS_STYLE[s.status] || STATUS_STYLE.ERROR}`}>
              {s.status}
            </span>
            <span className="text-xs font-mono text-zinc-300 font-bold">{s.points} pts</span>
          </div>
          
          <div className="flex items-center gap-3 text-zinc-500">
            <span className="text-[10px] font-mono">{new Date(s.createdAt).toLocaleTimeString()}</span>
            <div className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center transition-colors">
              {expanded ? <VscChevronDown size={14} /> : <VscChevronRight size={14} />}
            </div>
          </div>
        </div>

        {/* High-level Pill Summary (Always visible) */}
        {testResults.length > 0 && (
          <div className="flex flex-wrap gap-1.5 w-full">
            {testResults.map((t, j) => (
              <span
                key={j}
                title={t.name}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                  t.passed
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {t.passed ? "✓" : "✗"} {t.name.length > 20 ? t.name.slice(0, 20) + "…" : t.name}
              </span>
            ))}
          </div>
        )}
      </button>

      {/* ── Expanded Detailed View ── */}
      {expanded && testResults.length > 0 && (
        <div className="p-4 border-t border-zinc-800/60 bg-[#050508] flex flex-col gap-3">
          {testResults.map((t, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border flex flex-col font-mono text-xs ${
                t.passed
                  ? "bg-emerald-500/5 border-emerald-500/10"
                  : "bg-[#1a0f14] border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={t.passed ? "text-emerald-400" : "text-red-500"}>
                    {t.passed ? "✓" : "✗"}
                  </span>
                  <span className={t.passed ? "text-zinc-300" : "text-red-200 font-medium"}>
                    {t.name}
                  </span>
                </div>
                <span className={t.passed ? "text-emerald-500/70" : "text-red-500/70"}>
                  {t.earnedWeight}/{t.weight} pts
                </span>
              </div>

              {/* Detailed Breakdown for FAILED tests */}
              {!t.passed ? (
                <div className="mt-3 flex flex-col gap-2 border-t border-red-900/30 pt-3">
                  {t.failReason ? (
                    <p className="text-red-400 font-semibold text-[11px]">
                      Reason: <span className="text-zinc-300 font-normal">{t.failReason}</span>
                    </p>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-[#0a0a0c] p-2 rounded border border-zinc-800/80">
                      <span className="text-[9px] text-zinc-500 mb-0.5 block uppercase tracking-wider">Expected Status</span>
                      <span className="text-zinc-300">{t.expectedStatus}</span>
                    </div>
                    <div className="bg-[#0a0a0c] p-2 rounded border border-zinc-800/80">
                      <span className="text-[9px] text-zinc-500 mb-0.5 block uppercase tracking-wider">Actual Status</span>
                      <span className="text-red-400">{t.actualStatus ?? "N/A"}</span>
                    </div>
                  </div>

                  {t.actualBody !== undefined ? (
                    <div className="bg-[#0a0a0c] p-2 rounded border border-zinc-800/80 overflow-x-auto no-scrollbar">
                      <span className="text-[9px] text-zinc-500 mb-1 block uppercase tracking-wider">Actual Output Body</span>
                      <pre className="text-zinc-400 text-[10px] leading-relaxed">
                        {JSON.stringify(t.actualBody, null, 2)}
                      </pre>
                    </div>
                  ) : null}

                  {t.error ? (
                    <div className="bg-red-950/30 p-2.5 rounded border border-red-900/50 mt-1">
                      <span className="text-[9px] text-red-500 mb-0.5 block uppercase tracking-wider">System Error</span>
                      <span className="text-red-300 text-[10px] break-words">{t.error}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubmissionHistory({ history, loading }: { history: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono py-8 justify-center">
        <div className="w-4 h-4 rounded-full border-2 border-[#4d2562] border-t-[#FF9FFC] animate-spin" /> 
        Syncing archives...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="text-3xl mb-3 opacity-50">📂</span>
        <p className="text-sm text-zinc-400 font-medium">No submissions found</p>
        <p className="text-xs text-zinc-600 mt-1">Your arena attempts will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {history.map((s, i) => (
        <SubmissionHistoryCard 
          key={s.id} 
          s={s} 
          index={i} 
          total={history.length} 
        />
      ))}
    </div>
  );
}