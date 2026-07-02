"use client";

import type {
  SubmissionStatusResponse,
} from "@/lib/types";





export default function TestResults({ result }: { result: SubmissionStatusResponse }) {
  const results = Array.isArray(result.testResults) ? result.testResults : [];
  const isPassed = result.status === "PASSED";
  const isFailed = result.status === "FAILED";
  const isError = result.status === "ERROR";

  const earnedPoints = result.points;
  const hasPartial = !isPassed && !isError && earnedPoints > 0;

  return (
    <div
      className={`rounded-xl border p-4 ${
        isPassed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : hasPartial
            ? "border-yellow-500/30 bg-yellow-500/5"
            : isError
              ? "border-zinc-700 bg-zinc-900"
              : "border-red-500/30 bg-red-500/5"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-sm font-semibold ${
            isPassed
              ? "text-emerald-400"
              : hasPartial
                ? "text-yellow-400"
                : isError
                  ? "text-zinc-400"
                  : "text-red-400"
          }`}
        >
          {isPassed
            ? "✓ All tests passed"
            : hasPartial
              ? `◑ Partial — ${earnedPoints} pts earned`
              : isError
                ? "Error during grading"
                : "✗ No tests passed"}
        </span>

        <span className="text-xs font-mono font-bold text-zinc-300 bg-black/30 px-2 py-1 rounded border border-white/5">
          {result.points} pts
        </span>
      </div>

      {isError ? (
        <p className="text-xs text-zinc-500 font-mono mb-4">
          {(result.testResults as any)?.error ?? "Unknown grading error"}
        </p>
      ) : null}

      {results.length > 0 ? (
        <div className="flex flex-col gap-3">
          {results.map((t, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border flex flex-col font-mono text-xs transition-colors ${
                t.passed
                  ? "bg-emerald-500/5 border-emerald-500/10"
                  : "bg-[#1a0f14] border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]"
              }`}
            >
              {/* Test Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={t.passed ? "text-emerald-400" : "text-red-500"}
                  >
                    {t.passed ? "✓" : "✗"}
                  </span>
                  <span
                    className={
                      t.passed ? "text-zinc-300" : "text-red-200 font-medium"
                    }
                  >
                    {t.name}
                  </span>
                </div>
                <span
                  className={
                    t.passed ? "text-emerald-500/70" : "text-red-500/70"
                  }
                >
                  {t.earnedWeight}/{t.weight} pts
                </span>
              </div>

              {/* Detailed Feedback for Failed Tests */}
              {!t.passed ? (
                <div className="mt-3 flex flex-col gap-2 border-t border-red-900/30 pt-3">
                  {t.failReason ? (
                    <p className="text-red-400 font-semibold text-[11px]">
                      Reason:{" "}
                      <span className="text-zinc-300 font-normal">
                        {t.failReason}
                      </span>
                    </p>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-[#0a0a0c] p-2 rounded border border-zinc-800/80">
                      <span className="text-[9px] text-zinc-500 mb-0.5 block uppercase tracking-wider">
                        Expected Status
                      </span>
                      <span className="text-zinc-300">{t.expectedStatus}</span>
                    </div>
                    <div className="bg-[#0a0a0c] p-2 rounded border border-zinc-800/80">
                      <span className="text-[9px] text-zinc-500 mb-0.5 block uppercase tracking-wider">
                        Actual Status
                      </span>
                      <span className="text-red-400">
                        {t.actualStatus ?? "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Using strict !== undefined to allow falsy API responses like '0' or 'false' to render */}
                  {t.actualBody !== undefined ? (
                    <div className="bg-[#0a0a0c] p-2 rounded border border-zinc-800/80 overflow-x-auto no-scrollbar">
                      <span className="text-[9px] text-zinc-500 mb-1 block uppercase tracking-wider">
                        Actual Output Body
                      </span>
                      <pre className="text-zinc-400 text-[10px] leading-relaxed">
                        {JSON.stringify(t.actualBody, null, 2)}
                      </pre>
                    </div>
                  ) : null}

                  {t.error ? (
                    <div className="bg-red-950/30 p-2.5 rounded border border-red-900/50 mt-1">
                      <span className="text-[9px] text-red-500 mb-0.5 block uppercase tracking-wider">
                        System Error
                      </span>
                      <span className="text-red-300 text-[10px] break-words">
                        {t.error}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          {hasPartial && (
                    <p className="text-[11px] text-yellow-600 font-mono mt-3 border-t border-yellow-500/20 pt-2">
                      Fix failing tests to unlock the next challenge.
                    </p>
                  )}
        </div>
      ) : null}
    </div>
  );
}