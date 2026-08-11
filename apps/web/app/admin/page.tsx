"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminService } from "@/services/admin.service";
import { contestService } from "@/services/contest.service";
import type {
  AdminContest,
  AdminChallenge,
  CreateContestPayload,
  CreateChallengePayload,
  TestSpec,
} from "@/lib/types";
import api from "@/lib/api";
import toast from "react-hot-toast";

// Icons for the Dock
import Dock from "@/components/Dock";
import { VscLayers, VscCode, VscVersions, VscEdit, VscTrash } from "react-icons/vsc";

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-mono text-[#FF9FFC] tracking-widest uppercase mb-4 flex items-center gap-2">
      {children}
    </h2>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1a1122]/60 border border-[#4d2562]/40 backdrop-blur-md rounded-2xl p-6 shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder, required, min }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-400 tracking-wide">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} required={required} min={min}
        className="bg-[#09050d] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FF9FFC]/50 focus:ring-2 focus:ring-[#FF9FFC]/20 transition-all"
      />
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, type = "button", className = "" }: any) {
  const styles = {
    primary: "bg-white hover:bg-zinc-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20",
    ghost: "bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300",
  };
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${styles[variant as keyof typeof styles]} ${className}`}
    >
      {children}
    </button>
  );
}

// Format ISO string to fit <input type="datetime-local">
const formatForInput = (iso: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

// ─── Contest Form (Create & Edit) ─────────────────────────────────────────────

function ContestForm({ initialData, onSaved, onCancel }: {
  initialData?: AdminContest | null;
  onSaved: (c: AdminContest, isEdit: boolean) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<CreateContestPayload>({
    title: "", description: "", boilerplateId: "node-express-v1",
    startTime: "", endTime: "", mode: "CONTEST",
  });
  const [loading, setLoading] = useState(false);
  const isPractice = form.mode === "PRACTICE";

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title,
        description: initialData.description ?? "",
        boilerplateId: initialData.boilerplateId,
        startTime: formatForInput(initialData.startTime),
        endTime: formatForInput(initialData.endTime),
        mode: initialData.mode ?? "CONTEST",
      });
    } else {
      setForm({
        title: "", description: "", boilerplateId: "node-express-v1",
        startTime: "", endTime: "", mode: "CONTEST",
      });
    }
  }, [initialData]);

  function set(key: keyof CreateContestPayload) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  function togglePractice(on: boolean) {
    if (on) {
      setForm((f) => ({
        ...f,
        mode: "PRACTICE",
        startTime: new Date().toISOString().slice(0, 16),
        endTime: "2099-12-31T23:59",
      }));
    } else {
      setForm((f) => ({ ...f, mode: "CONTEST", startTime: "", endTime: "" }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return toast.error("Title is required.");
    if (!isPractice && (!form.startTime || !form.endTime)) {
      return toast.error("Title and times are required.");
    }
    if (!isPractice && new Date(form.endTime) <= new Date(form.startTime)) {
      return toast.error("End time must be after start time.");
    }

    setLoading(true);
    const tid = toast.loading(initialData ? "Updating contest..." : "Creating contest...");
    try {
      const contest = initialData
        ? await adminService.updateContest(initialData.id, form)
        : await adminService.createContest(form);

      onSaved(contest, !!initialData);
      toast.success(`Contest ${initialData ? "updated" : "created"}!`, { id: tid });
      if (!initialData) {
        setForm({
          title: "", description: "", boilerplateId: "node-express-v1",
          startTime: "", endTime: "", mode: "CONTEST",
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to save contest.", { id: tid });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-h-[600px] overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center mb-4">
        <SectionTitle>{initialData ? "Edit Contest" : "New Contest"}</SectionTitle>
        {initialData && <Btn variant="ghost" onClick={onCancel}>Cancel Edit</Btn>}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputField label="Title" value={form.title} onChange={set("title")} placeholder="Contest #1" required />
        <InputField label="Description" value={form.description ?? ""} onChange={set("description")} />
        <InputField label="Boilerplate ID" value={form.boilerplateId} onChange={set("boilerplateId")} required />

        {/* Practice Mode Toggle */}
        <div className="flex items-center justify-between bg-[#09050d] border border-zinc-800 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm text-zinc-200 font-medium">Practice mode</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">No time limit · Always open · Fills times automatically</p>
          </div>
          <button
            type="button"
            onClick={() => togglePractice(!isPractice)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
              isPractice ? "bg-cyan-500" : "bg-zinc-700"
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
              isPractice ? "translate-x-5" : "translate-x-0"
            }`} />
          </button>
        </div>

        {/* Time fields — hidden and auto-filled in practice mode */}
        {!isPractice && (
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Start time" type="datetime-local" value={form.startTime} onChange={set("startTime")} required />
            <InputField label="End time" type="datetime-local" value={form.endTime} onChange={set("endTime")} required />
          </div>
        )}

        {isPractice && (
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block shrink-0" />
            Start: now · End: Dec 31, 2099 — set automatically
          </div>
        )}

        <Btn type="submit" disabled={loading}>
          {loading ? "Saving…" : initialData ? "Update Contest" : "Create Contest"}
        </Btn>
      </form>
    </Card>
  );
}

// ─── Challenge Form (Create & Edit) ───────────────────────────────────────────

const EMPTY_TEST: TestSpec = { 
  name: "", 
  method: "GET", 
  path: "", 
  weight: 10, 
  expect: { status: 200 },
  body: undefined,
  saveAs: undefined
};

function ChallengeForm({ initialData, onSaved, onCancel }: { initialData?: AdminChallenge | null, onSaved: (c: AdminChallenge, isEdit: boolean) => void, onCancel?: () => void }) {
  const [form, setForm] = useState<CreateChallengePayload>({
    title: "", notionDocId: "", maxPoints: 0, editableFiles: [], testSpec: [], timeLimitSeconds: 15,
  });
  const [editableFilesRaw, setEditableFilesRaw] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      setEditableFilesRaw(initialData.editableFiles.join(", "));
    } else {
      setForm({ title: "", notionDocId: "", maxPoints: 0, editableFiles: [], testSpec: [], timeLimitSeconds: 15 });
      setEditableFilesRaw("");
    }
  }, [initialData]);

  function set(key: keyof CreateChallengePayload) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const editableFiles = editableFilesRaw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!form.title || editableFiles.length === 0 || form.testSpec.length === 0) {
      return toast.error("Title, editable files, and tests are required.");
    }
    setLoading(true);
    const tid = toast.loading(initialData ? "Updating challenge..." : "Creating challenge...");
    const payload = { ...form, editableFiles, maxPoints: form.testSpec.reduce((s, t) => s + t.weight, 0) };
    try {
      const challenge = initialData
        ? await adminService.updateChallenge(initialData.id, payload)
        : await adminService.createChallenge(payload);
      onSaved(challenge, !!initialData);
      toast.success(`Challenge ${initialData ? "updated" : "created"}!`, { id: tid });
      if (!initialData) {
        setForm({ title: "", notionDocId: "", maxPoints: 0, editableFiles: [], testSpec: [], timeLimitSeconds: 15 });
        setEditableFilesRaw("");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to save challenge.", { id: tid });
    } finally {
      setLoading(false);
    }
  }

  const updateTest = (i: number, patch: Partial<TestSpec>) => {
    setForm(f => ({ ...f, testSpec: f.testSpec.map((t, idx) => idx === i ? { ...t, ...patch } : t) }));
  };

  const updateExpect = (i: number, patch: Partial<TestSpec["expect"]>) => {
    setForm(f => ({
      ...f,
      testSpec: f.testSpec.map((t, idx) => idx === i ? { ...t, expect: { ...t.expect, ...patch } } : t)
    }));
  };

  return (
    <Card className="max-h-[600px] overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center mb-4">
         <SectionTitle>{initialData ? "Edit Challenge" : "New Challenge"}</SectionTitle>
         {initialData && <Btn variant="ghost" onClick={onCancel}>Cancel Edit</Btn>}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputField label="Title" value={form.title} onChange={set("title")} required />
        <InputField label="Notion Doc ID" value={form.notionDocId} onChange={set("notionDocId")} />
        <InputField label="Editable files (comma-separated)" value={editableFilesRaw} onChange={setEditableFilesRaw} />
        <InputField label="Time limit (sec)" type="number" value={String(form.timeLimitSeconds)} onChange={(v: string) => setForm(f => ({ ...f, timeLimitSeconds: Number(v) }))} />
        
        <div className="border border-zinc-800 rounded-xl p-4 bg-[#09050d]">
          <div className="flex justify-between mb-3 items-center">
             <label className="text-xs font-medium text-zinc-400">Test Cases</label>
             <button type="button" onClick={() => setForm(f => ({ ...f, testSpec: [...f.testSpec, { ...EMPTY_TEST }] }))} className="text-[10px] bg-[#4d2562]/30 text-[#FF9FFC] px-2 py-1 rounded hover:bg-[#4d2562]/60 transition font-mono">+ add test</button>
          </div>
          
          <div className="flex flex-col gap-3">
            {form.testSpec.map((t, i) => (
              <div key={i} className="p-3 bg-[#1a1122]/40 border border-[#4d2562]/30 rounded-lg flex flex-col gap-3 relative group">
                
                {/* Header & Delete */}
                <div className="flex items-center justify-between">
                  <input value={t.name} onChange={(e) => updateTest(i, { name: e.target.value })} placeholder="Test name" className="bg-transparent border-b border-zinc-700 text-xs font-mono text-white outline-none w-[80%] pb-1 focus:border-[#FF9FFC]" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, testSpec: f.testSpec.filter((_, idx) => idx !== i) }))} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                </div>

                {/* Primary Config Row */}
                <div className="grid grid-cols-12 gap-2">
                  <select value={t.method} onChange={(e) => updateTest(i, { method: e.target.value as any })} className="col-span-3 bg-zinc-900 border border-zinc-800 text-xs text-white rounded p-1.5 outline-none focus:border-[#FF9FFC]/50">
                    <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
                  </select>
                  <input value={t.path} onChange={(e) => updateTest(i, { path: e.target.value })} placeholder="/api/route" className="col-span-9 bg-zinc-900 border border-zinc-800 text-xs font-mono text-white rounded p-1.5 outline-none focus:border-[#FF9FFC]/50" />
                </div>

                {/* Status & Weight Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500">Expected Status</label>
                    <input type="number" value={t.expect.status} onChange={(e) => updateExpect(i, { status: Number(e.target.value) })} className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded p-1.5 outline-none focus:border-[#FF9FFC]/50" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500">Weight (pts)</label>
                    <input type="number" value={t.weight} onChange={(e) => updateTest(i, { weight: Number(e.target.value) })} className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded p-1.5 outline-none focus:border-[#FF9FFC]/50" />
                  </div>
                </div>

                {/* Optional Configurations */}
                <div className="flex flex-col gap-2 border-t border-zinc-800 pt-2 mt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500">Request JSON Body (optional)</label>
                    <input 
                      value={t.body ? JSON.stringify(t.body) : ""} 
                      onChange={(e) => {
                        try { updateTest(i, { body: e.target.value ? JSON.parse(e.target.value) : undefined }); } catch {}
                      }} 
                      placeholder='{"key": "value"}' 
                      className="bg-zinc-900 border border-zinc-800 text-xs font-mono text-white rounded p-1.5 outline-none focus:border-[#FF9FFC]/50" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500">Required JSON Fields (comma-separated)</label>
                    <input 
                      value={t.expect.jsonSchema?.required?.join(",") ?? ""} 
                      onChange={(e) => {
                        const fields = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                        updateExpect(i, { jsonSchema: fields.length ? { required: fields } : undefined });
                      }} 
                      placeholder="token, user.id" 
                      className="bg-zinc-900 border border-zinc-800 text-xs font-mono text-white rounded p-1.5 outline-none focus:border-[#FF9FFC]/50" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500">Save Context Variables (e.g. token=$.token)</label>
                    <input 
                      value={t.saveAs ? Object.entries(t.saveAs).map(([k,v]) => `${k}=${v}`).join(",") : ""} 
                      onChange={(e) => {
                        const pairs: Record<string,string> = {};
                        e.target.value.split(",").forEach(pair => {
                          const [k, v] = pair.split("=");
                          if (k && v) pairs[k.trim()] = v.trim();
                        });
                        updateTest(i, { saveAs: Object.keys(pairs).length ? pairs : undefined });
                      }} 
                      placeholder="token=$.token" 
                      className="bg-zinc-900 border border-zinc-800 text-xs font-mono text-white rounded p-1.5 outline-none focus:border-[#FF9FFC]/50" 
                    />
                  </div>

                  {/* Expected Exact Body */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500">Expected Response Body (Exact JSON)</label>
                    <input 
                      value={t.expect.body ? JSON.stringify(t.expect.body) : ""} 
                      onChange={(e) => {
                        try { updateExpect(i, { body: e.target.value ? JSON.parse(e.target.value) : undefined }); } catch {}
                      }} 
                      placeholder='{"success": true}' 
                      className="bg-zinc-900 border border-zinc-800 text-xs font-mono text-white rounded p-1.5 outline-none focus:border-[#FF9FFC]/50" 
                    />
                  </div>

                  {/* Expected Partial Body */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500">Expected Body Contains (Partial JSON)</label>
                    <input 
                      value={t.expect.bodyContains ? JSON.stringify(t.expect.bodyContains) : ""} 
                      onChange={(e) => {
                        try { updateExpect(i, { bodyContains: e.target.value ? JSON.parse(e.target.value) : undefined }); } catch {}
                      }} 
                      placeholder='{"user": {"role": "Admin"}}' 
                      className="bg-zinc-900 border border-zinc-800 text-xs font-mono text-white rounded p-1.5 outline-none focus:border-[#FF9FFC]/50" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <Btn type="submit" disabled={loading}>{loading ? "Saving…" : initialData ? "Update Challenge" : "Create Challenge"}</Btn>
      </form>
    </Card>
  );
}

// ─── Map Challenge Form ───────────────────────────────────────────────────────

function MapChallengeForm({ contests, challenges, onMapped }: { contests: AdminContest[], challenges: AdminChallenge[], onMapped: () => void }) {
  const [contestId, setContestId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [index, setIndex] = useState("0");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contestId || !challengeId) return toast.error("Select both contest and challenge.");
    setLoading(true);
    const tid = toast.loading("Mapping...");
    try {
      await adminService.addChallengeToContest(contestId, { challengeId, index: Number(index) });
      toast.success("Challenge successfully mapped!", { id: tid });
      onMapped();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to map challenge.", { id: tid });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <SectionTitle>Link Challenge to Contest</SectionTitle>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400">Contest</label>
          <select value={contestId} onChange={(e) => setContestId(e.target.value)} className="bg-[#09050d] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#FF9FFC]/50">
            <option value="">Select contest…</option>
            {contests.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400">Challenge</label>
          <select value={challengeId} onChange={(e) => setChallengeId(e.target.value)} className="bg-[#09050d] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#FF9FFC]/50">
            <option value="">Select challenge…</option>
            {challenges.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.maxPoints}pts)</option>)}
          </select>
        </div>
        <InputField label="Order index (0 = first)" type="number" value={index} onChange={setIndex} min="0" />
        <Btn type="submit" disabled={loading}>{loading ? "Linking…" : "Link Challenge"}</Btn>
      </form>
    </Card>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

type Tab = "contests" | "challenges" | "map";

export default function AdminPage() {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  
  const [tab, setTab] = useState<Tab>("contests");
  const [contests, setContests] = useState<AdminContest[]>([]);
  const [challenges, setChallenges] = useState<AdminChallenge[]>([]);
  const [fetching, setFetching] = useState(true);
  
  // Edit States
  const [editingContest, setEditingContest] = useState<AdminContest | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<AdminChallenge | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && !isAdmin) router.replace("/contests");
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const loadData = useCallback(async () => {
    try {
      const rawContests = await contestService.list();
      const rawPracticeContests = await contestService.listPractice();
      const { data } = await api.get<{ challenges: AdminChallenge[] }>("/contests/admin/challenges");
      setChallenges(data.challenges);
      setContests([...rawContests, ...rawPracticeContests] as unknown as AdminContest[]);
    } catch {}
    setFetching(false);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isAdmin) loadData();
  }, [isLoading, isAuthenticated, isAdmin, loadData]);

  const dockItems = [
    { icon: <VscLayers size={20} />, label: 'Contests', onClick: () => setTab('contests') },
    { icon: <VscCode size={20} />, label: 'Challenges', onClick: () => setTab('challenges') },
    { icon: <VscVersions size={20} />, label: 'Map Data', onClick: () => setTab('map') },
  ];

  if (isLoading || fetching || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#09050d] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#4d2562] border-t-[#FF9FFC] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09050d] relative overflow-hidden pb-24">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#4d2562]/10 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Main Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-28">
        
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
            Admin Panel
          </h1>
          <p className="text-sm text-zinc-400 font-mono uppercase tracking-widest">
            {tab} Configuration
          </p>
        </div>

        {/* ── CONTESTS VIEW ── */}
        {tab === "contests" && (
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            <ContestForm 
               initialData={editingContest}
               onSaved={(c, isEdit) => {
                 if (isEdit) setContests(prev => prev.map(x => x.id === c.id ? c : x));
                 else setContests(prev => [c, ...prev]);
                 setEditingContest(null);
               }}
               onCancel={() => setEditingContest(null)}
            />
            <Card>
              <SectionTitle>Database ({contests.length})</SectionTitle>
              <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto no-scrollbar">
                {contests.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 bg-[#09050d]/50 border border-zinc-800/60 rounded-xl px-4 py-3 group">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                      <p className="text-[10px] font-mono text-zinc-500">{c.id}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingContest(c)} className="p-2 text-zinc-400 hover:text-[#FF9FFC] bg-white/5 rounded-lg transition"><VscEdit size={14} /></button>
                      <button onClick={async () => {
                         if (!confirm(`Delete ${c.title}?`)) return;
                         await adminService.deleteContest(c.id);
                         setContests(p => p.filter(x => x.id !== c.id));
                         toast.success("Deleted");
                      }} className="p-2 text-zinc-400 hover:text-red-400 bg-white/5 rounded-lg transition"><VscTrash size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── CHALLENGES VIEW ── */}
        {tab === "challenges" && (
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            <ChallengeForm 
               initialData={editingChallenge}
               onSaved={(c, isEdit) => {
                 if (isEdit) setChallenges(prev => prev.map(x => x.id === c.id ? c : x));
                 else setChallenges(prev => [c, ...prev]);
                 setEditingChallenge(null);
               }}
               onCancel={() => setEditingChallenge(null)}
            />
            <Card>
              <SectionTitle>Database ({challenges.length})</SectionTitle>
              <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto no-scrollbar">
                {challenges.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 bg-[#09050d]/50 border border-zinc-800/60 rounded-xl px-4 py-3 group">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                      <p className="text-[10px] font-mono text-zinc-500">{c.maxPoints} pts · {c.testSpec.length} tests</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingChallenge(c)} className="p-2 text-zinc-400 hover:text-[#FF9FFC] bg-white/5 rounded-lg transition"><VscEdit size={14} /></button>
                      <button onClick={async () => {
                         if (!confirm(`Delete ${c.title}?`)) return;
                         await adminService.deleteChallenge(c.id);
                         setChallenges(p => p.filter(x => x.id !== c.id));
                         toast.success("Deleted");
                      }} className="p-2 text-zinc-400 hover:text-red-400 bg-white/5 rounded-lg transition"><VscTrash size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── MAP VIEW ── */}
        {tab === "map" && (
          <div className="max-w-lg mx-auto">
            <MapChallengeForm contests={contests} challenges={challenges} onMapped={loadData} />
          </div>
        )}

      </main>

      {/* Floating Navigation Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Dock items={dockItems} panelHeight={60} baseItemSize={44} magnification={60} />
      </div>
    </div>
  );
}