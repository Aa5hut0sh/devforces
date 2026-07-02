"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { submissionService } from "@/services/submission.service";
import { leaderboardService } from "@/services/leaderboard.service";
import { useSocket } from "@/hooks/useSocket";
import type {
  Progress,
  LeaderboardEntry,
  SubmissionStatusResponse,
  ContestDetail,
} from "@/lib/types";
import api from "@/lib/api";
import toast from "react-hot-toast";
// UI Components
import Dock from "@/components/Dock";
import {
  VscCode,
  VscBook,
  VscListSelection,
  VscFile,
  VscChevronDown,
  VscHistory,
  VscCheck,      
  VscCloudUpload,
} from "react-icons/vsc";
import NotionDoc from "@/components/NotionDoc";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

import FileTree from "@/components/FileTree";
import TestResults from "@/components/TestResults";
import SubmissionHistory from "@/components/SubmissionHistory";





function formatTime(ms: number) {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContestWorkspacePage() {
  const { contestId } = useParams<{ contestId: string }>();
  const { isLoading, isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ── State
  const [activeTab, setActiveTab] = useState<"code" | "docs" | "leaderboard" | "history">(
    "code",
  );
  const [progress, setProgress] = useState<Progress | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState("");
  const [editedFiles, setEditedFiles] = useState<Record<string, string>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<SubmissionStatusResponse | null>(
    null,
  );
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [error, setError] = useState("");
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const [history, setHistory] = useState<Awaited<ReturnType<typeof submissionService.getHistory>>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"Saving..." | "Saved locally" | "">("");

  const [contestDetails, setContestDetails] = useState<ContestDetail | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  

  useEffect(() => {
    if (!contestId || !isAuthenticated) return;
    api.get(`/contests/${contestId}`).then((res) => {
      setContestDetails(res.data.contest || res.data);
    }).catch(() => {});
  }, [contestId, isAuthenticated]);

  useEffect(() => {
    if (!contestDetails?.endTime) return;
    
    const updateTimer = () => {
      const end = new Date(contestDetails.endTime).getTime();
      const diff = end - Date.now();
      setTimeLeft(Math.max(0, diff));
    };

    updateTimer(); // Initial call to avoid 1-second delay
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [contestDetails?.endTime]);

  useEffect(() => {
    if (!contestId || Object.keys(editedFiles).length === 0) return;

    setSaveStatus("Saving...");
    
    const timeoutId = setTimeout(() => {
      localStorage.setItem(`devforces_draft_${contestId}`, JSON.stringify(editedFiles));
      setSaveStatus("Saved locally");
      
      setTimeout(() => setSaveStatus(""), 3000);
    }, 1000); // 1-second debounce

    return () => clearTimeout(timeoutId);
  }, [editedFiles, contestId]);

  const isEndedContest = contestDetails?.status === "ENDED" || timeLeft === 0;

  // ── Auth guard
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated)
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
  }, [isLoading, isAuthenticated, router, pathname]);

  // ── Leaderboard Fetch
  useEffect(() => {
    if (!contestId || !isAuthenticated || isLoading) return;
    leaderboardService
      .get(contestId)
      .then((data) => {
        setLeaderboard(data.leaderboard);
        const names: Record<string, string> = {};
        data.leaderboard.forEach((e) => {
          names[e.userId] = e.name;
        });
        setUserNames(names);
      })
      .catch(() => {});
  }, [contestId, isAuthenticated, isLoading]);

  const loadProgress = useCallback(async () => {
    if (!contestId) return;
    try {
      const p = await submissionService.getProgress(contestId);
      setProgress(p);
      setFiles(p.files);

      if (p.currentChallenge) {
        const initial: Record<string, string> = {};
        for (const path of p.currentChallenge.editableFiles) {
          initial[path] = p.files[path] ?? "";
        }

        const savedDraft = localStorage.getItem(`devforces_draft_${contestId}`);
        if (savedDraft) {
          try {
            const parsedDraft = JSON.parse(savedDraft);
            let hasRecoveredData = false;
            
            for (const path of p.currentChallenge.editableFiles) {
              if (parsedDraft[path] && parsedDraft[path] !== initial[path]) {
                initial[path] = parsedDraft[path];
                hasRecoveredData = true;
              }
            }
            
            if (hasRecoveredData) {
              setFiles(prev => ({ ...prev, ...initial })); 
              toast.success("Recovered your unsaved draft.");
            }
          } catch (e) {
            console.error("Failed to parse local draft", e);
          }
        }

        setEditedFiles(initial);
        setSelectedFile(p.currentChallenge.editableFiles[0] ?? Object.keys(p.files)[0] ?? "");
      } else {
        setSelectedFile(Object.keys(p.files)[0] ?? "");
      }
    } catch {
      setError("Failed to load contest workspace.");
    } finally {
      setLoadingProgress(false);
    }
  }, [contestId]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) loadProgress();
  }, [isLoading, isAuthenticated, loadProgress]);

  const loadHistory = useCallback(async () => {
    if (!contestId) return;
    setHistoryLoading(true);
    try {
      const h = await submissionService.getHistory(contestId);
      setHistory(h);
    } catch {} 
    finally { setHistoryLoading(false); }
  }, [contestId]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) loadHistory();
  }, [isLoading, isAuthenticated, loadHistory]);

  useSocket(contestId, {
    onLeaderboardUpdate: (data) => {
      const entries = (
        Array.isArray(data) ? data : ((data as any).entries ?? data)
      ) as LeaderboardEntry[];

      setLeaderboard(
        entries.map((e) => ({
          ...e,
          name:
            e.userId === user?.id
              ? user?.name
              : (userNames[e.userId] ?? e.name ?? "Unknown"),
        })),
      );
    },
  });


  const handleSubmit = async () => {
    if (!progress?.currentChallenge || submitting) return;

    setSubmitting(true);
    setLastResult(null);
    setError("");


    const toastId = toast.loading("Executing test cases...");

    try {
      const { submissionId } = await submissionService.submit(contestId, {
        files: editedFiles,
      });
      const result = await submissionService.pollUntilDone(submissionId, {
        intervalMs: 1500,
        timeoutMs: 90_000,
      });

      setLastResult(result);
      await loadHistory();

      if (result.status === "PASSED") {
        localStorage.removeItem(`devforces_draft_${contestId}`);
        toast.success(`Optimal! All tests passed (+${result.points} pts)`, {
          id: toastId,
        });
        await loadProgress();
      } else if (result.status === "FAILED" && result.points > 0) {
        toast(`Partial score: +${result.points} pts earned`, {
          id: toastId,
          icon: "◑",
          style: {
            background: "#78350f",
            color: "#fde68a",
            border: "1px solid #92400e",
          },
        });
      } else if (result.status === "FAILED") {
        toast.error("No tests passed. Check your logic.", { id: toastId });
      } else if (result.status === "ERROR") {
        const backendError =
          (result.testResults as any)?.error ?? "Compilation or runtime error.";
        toast.error(`Error: ${backendError}`, { id: toastId });
      }
    } catch (err: any) {
      // 3. Handle hard API crashes (e.g., 500s or network drops)
      const errorMsg =
        err?.response?.data?.message ?? "Failed to reach grading server.";
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Editor Handlers
  function handleEditorChange(value: string | undefined) {
    if (
      !selectedFile ||
      !progress?.currentChallenge?.editableFiles.includes(selectedFile)
    )
      return;
    const v = value ?? "";
    setEditedFiles((prev) => ({ ...prev, [selectedFile]: v }));
    setFiles((prev) => ({ ...prev, [selectedFile]: v }));
  }

  // Boost Monaco JS Intellisense
  function handleEditorWillMount(monaco: any) {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
    });
  }

  if (isLoading || loadingProgress || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09050d] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#4d2562] border-t-[#FF9FFC] animate-spin" />
      </div>
    );
  }

  if (contestDetails && new Date() < new Date(contestDetails.startTime)) {
    return (
      <div className="min-h-screen bg-[#09050d] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold text-white">Contest hasn't started yet</p>
          <p className="text-zinc-400 font-mono text-sm">
            Starts in {formatTime(new Date(contestDetails.startTime).getTime() - Date.now())}
          </p>
          <Link href="/contests" className="text-violet-400 text-sm hover:underline">
            ← Back to contests
          </Link>
        </div>
      </div>
    );
  }

  const editableFiles = progress?.currentChallenge?.editableFiles ?? [];
  const isEditable = editableFiles.includes(selectedFile);
  const isCompleted = progress?.completed ?? false;

  // ── Dock Items Config
  const dockItems = [
    {
      icon: <VscCode size={20} />,
      label: "Code",
      onClick: () => setActiveTab("code"),
    },
    {
      icon: <VscBook size={20} />,
      label: "Docs",
      onClick: () => setActiveTab("docs"),
    },
    {
      icon: <VscHistory size={20} />,
      label: "History",
      onClick: () => setActiveTab("history"),
    },
    {
      icon: <VscListSelection size={20} />,
      label: "Leaderboard",
      onClick: () => setActiveTab("leaderboard"),
    },
  ];

  return (
    <div className="h-screen bg-[#09050d] flex flex-col overflow-hidden relative">
      <header className="h-12 border-b border-zinc-800/60 bg-[#110a17]/80 backdrop-blur-md shrink-0 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <Link href="/contests" className="text-zinc-400 hover:text-white transition">
            <VscChevronDown className="rotate-90" size={18} />
          </Link>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white tracking-tight">
              Challenge: {progress?.currentChallenge?.title ?? (isCompleted ? "Contest completed" : "Workspace")}
            </span>
            {progress?.currentChallenge && contestDetails?.contestToChallengeMapping && (
              <span className="text-[10px] font-mono font-medium text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-zinc-800 hidden sm:block">
                {progress.currentChallenge.index + 1} / {contestDetails.contestToChallengeMapping.length}
              </span>
            )}
          </div>
        </div>

        

        <div className="flex items-center gap-4">
          {activeTab === "code" && saveStatus && !isEndedContest && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-zinc-500 mr-2">
              {saveStatus === "Saving..." ? (
                <><VscCloudUpload className="animate-pulse" /> Saving...</>
              ) : (
                <><VscCheck className="text-emerald-500" /> Saved locally</>
              )}
            </div>
          )}

          {timeLeft !== null && (
            <div className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border transition-colors ${
              timeLeft > 0 
                ? "bg-[#1a1122] text-[#FF9FFC] border-[#FF9FFC]/30 shadow-[0_0_10px_rgba(255,159,252,0.1)]" 
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              {timeLeft > 0 ? `⏱ ${formatTime(timeLeft)}` : "CONTEST ENDED"}
            </div>
          )}

          {/* Submit Button (Now gets blocked when time is up) */}
          {activeTab === "code" && !isCompleted && progress?.currentChallenge && (
            <button
              onClick={handleSubmit}
              disabled={submitting || timeLeft === 0} // <-- BLOCKS SUBMISSION HERE
              className="bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-xs px-4 py-1.5 rounded-lg transition-all shadow-[0_0_10px_rgba(255,255,255,0.1)]"
            >
              {submitting ? "Grading..." : "Submit Code"}
            </button>
          )}
        </div>
      </header>

      {/* ── Main View Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* VIEW 1: CODE */}
        {activeTab === "code" && (
          <div className="flex h-full w-full">
            <aside className="w-64 shrink-0 border-r border-zinc-800/60 bg-[#0a0a0c] overflow-y-auto hidden md:block">
              <div className="px-4 pt-4 pb-2">
                <p className="text-[10px] font-bold font-mono text-zinc-500 tracking-widest uppercase">
                  Explorer
                </p>
              </div>
              <FileTree
                files={files}
                editableFiles={editableFiles}
                selected={selectedFile}
                onSelect={setSelectedFile}
              />
            </aside>
            <main className="flex-1 flex flex-col h-full relative">
              {/* File Path Header */}
              <div className="h-10 border-b border-zinc-800/60 flex items-center px-4 gap-2 bg-[#0d0d0f] shrink-0">
                {selectedFile && (
                  <>
                    <VscFile className="text-zinc-500" />
                    <span className="text-xs font-mono text-zinc-300">
                      {selectedFile}
                    </span>
                    {!isEditable && (
                      <span className="ml-2 text-[9px] font-mono text-red-400 border border-red-400/20 bg-red-400/10 px-1.5 py-0.5 rounded">
                        READ ONLY
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex-1">
                {selectedFile ? (
                  <MonacoEditor
                    key={selectedFile}
                    path={selectedFile}
                    height="100%"
                    language={
                      selectedFile.endsWith(".ts")
                        ? "typescript"
                        : selectedFile.endsWith(".json")
                          ? "json"
                          : "javascript"
                    }
                    theme="vs-dark"
                    value={files[selectedFile] ?? ""}
                    onChange={handleEditorChange}
                    beforeMount={handleEditorWillMount} // <--- IMPROVES SUGGESTIONS
                    options={{
                      readOnly: !isEditable || timeLeft === 0,
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      lineNumbers: "on",
                      padding: { top: 16 },
                      cursorStyle: "line",
                      smoothScrolling: true,
                      wordWrap: "on",
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-600 font-mono text-sm">
                    Select a file to start coding
                  </div>
                )}
              </div>
            </main>
          </div>
        )}

        {/* VIEW 2: DOCS */}
        {activeTab === "docs" && (
          <div className="h-full w-full max-w-5xl mx-auto p-6 overflow-y-auto no-scrollbar">
            {isCompleted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center mt-10">
                <p className="text-emerald-400 font-bold text-xl mb-2">
                  🎉 Contest Completed!
                </p>
                <p className="text-zinc-400">
                  You've successfully conquered all challenges.
                </p>
              </div>
            ) : progress?.currentChallenge ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {progress.currentChallenge.title}
                  </h1>
                  <div className="flex gap-3">
                    <span className="text-xs font-mono bg-[#FF9FFC]/10 text-[#FF9FFC] px-2.5 py-1 rounded-md">
                      {progress.currentChallenge.maxPoints} Points
                    </span>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-400/10 p-3 rounded-lg">
                    {error}
                  </p>
                )}
                {lastResult && <TestResults result={lastResult} />}

                {/* Docs Embed (If you have a way to render Notion or Markdown, it goes here. Otherwise, the link.) */}
                <div className="bg-[#110a17]/60 border border-[#4d2562]/40 rounded-2xl p-6 backdrop-blur-md">
                  <h3 className="text-sm font-semibold text-zinc-200 mb-4">
                    Problem Statement
                  </h3>
                  {progress.currentChallenge.notionDocId !== "placeholder" ? (
                    <div className="bg-[#110a17]/60 border border-[#4d2562]/40 rounded-2xl p-6 md:p-10 backdrop-blur-md">
                      <NotionDoc
                        pageId={progress.currentChallenge.notionDocId}
                      />
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-sm">
                      No documentation available for this challenge.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-zinc-500 text-center mt-10">
                Loading challenge info...
              </p>
            )}
          </div>
        )}

        {/* VIEW 3: LEADERBOARD */}
        {activeTab === "leaderboard" && (
          <div className="h-full w-full max-w-4xl mx-auto p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Live Leaderboard
              </h1>
            </div>

            <div className="bg-[#110a17]/60 border border-[#4d2562]/40 rounded-2xl overflow-hidden backdrop-blur-md">
              <div className="grid grid-cols-[3rem_1fr_4rem] gap-4 px-6 py-4 border-b border-zinc-800/60 text-xs font-mono text-zinc-500 uppercase tracking-widest">
                <span>Rank</span>
                <span>Developer</span>
                <span className="text-right">Score</span>
              </div>
              <div className="divide-y divide-zinc-800/40">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-12">
                    No submissions yet. Be the first.
                  </p>
                ) : (
                  leaderboard.map((e) => (
                    <div
                      key={e.userId}
                      className={`grid grid-cols-[3rem_1fr_4rem] gap-4 px-6 py-4 items-center transition-colors ${
                        e.userId === user?.id
                          ? "bg-[#FF9FFC]/5"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`text-sm font-mono font-bold ${
                          e.rank === 1
                            ? "text-yellow-400"
                            : e.rank === 2
                              ? "text-zinc-300"
                              : e.rank === 3
                                ? "text-amber-600"
                                : "text-zinc-600"
                        }`}
                      >
                        #{e.rank}
                      </span>
                      <span
                        className={`text-sm font-medium ${e.userId === user?.id ? "text-[#FF9FFC]" : "text-zinc-300"}`}
                      >
                        {e.name} {e.userId === user?.id && "(You)"}
                      </span>
                      <span className="text-sm font-mono text-zinc-400 text-right">
                        {e.score}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="h-full w-full max-w-4xl mx-auto p-6 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Submission History
              </h1>
            </div>
            
            <div className="bg-[#110a17]/60 border border-[#4d2562]/40 rounded-2xl p-6 backdrop-blur-md">
              <SubmissionHistory history={history} loading={historyLoading} />
            </div>
          </div>
        )}
      </div>

      {/* ── Floating Navigation Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Dock
          items={dockItems}
          panelHeight={60}
          baseItemSize={44}
          magnification={60}
        />
      </div>
    </div>
  );
}
