"use client";

import { useState } from "react";
import { KeyRound, Copy, Check, Clapperboard, ChevronDown, Trash2, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { getApiKey, setApiKey, verifyApiKey } from "@/lib/tmdb";

const SETUP_SQL = `create table if not exists lists (
  sync_key text primary key,
  watchlist jsonb default '[]'::jsonb,
  watched  jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);
alter table lists enable row level security;
create policy "open lists" on lists
  for all using (true) with check (true);`;

function Row({
  icon,
  title,
  hint,
  open,
  onToggle,
  children,
  active,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <button onClick={onToggle} className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left" aria-expanded={open}>
        <span className={active ? "text-gold" : "text-muted"}>{icon}</span>
        <span className="flex-1 text-[11px] text-sub">{title}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className="mono-label px-3.5 pb-1.5">{hint}</div>
      {open && <div className="animate-rise space-y-2.5 border-t border-white/[0.06] px-3.5 py-3">{children}</div>}
    </div>
  );
}

export default function KeyManager() {
  const [syncOpen, setSyncOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinKey, setJoinKey] = useState("");
  const [tmdbInput, setTmdbInput] = useState("");
  const [saving, setSaving] = useState(false);

  const syncKey = useStore((s) => s.syncKey);
  const generateSyncKey = useStore((s) => s.generateSyncKey);
  const setSyncKey = useStore((s) => s.setSyncKey);
  const removeKnownKey = useStore((s) => s.removeKnownKey);
  const knownKeys = useStore((s) => s.knownKeys);
  const pullFromCloud = useStore((s) => s.pullFromCloud);
  const setToast = useStore((s) => s.setToast);

  const envKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
  const activeKey = getApiKey();
  const cloud = supabase();

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
      return true;
    } catch {
      setToast("Could not copy — select and copy manually");
      return false;
    }
  };

  const createKey = async () => {
    const key = generateSyncKey();
    setToast("Key created — copy it to your other devices");
    await copy(key);
  };

  const normalizeJoin = (raw: string) =>
    /^vrx-/i.test(raw.trim()) ? raw.trim() : raw.trim().toUpperCase();

  const join = async () => {
    const k = normalizeJoin(joinKey);
    if (!k) return;
    setSyncKey(k);
    const ok = await pullFromCloud();
    setJoinKey("");
    setToast(ok ? "Connected — lists synced from that key" : "Connected — nothing stored under that key yet");
  };

  const saveTmdb = async () => {
    const k = tmdbInput.trim();
    if (!k) return;
    setSaving(true);
    const ok = await verifyApiKey(k);
    setSaving(false);
    if (ok) {
      setApiKey(k);
      setTmdbInput("");
      setToast("TMDB key verified and saved");
    } else {
      setToast("That key was rejected by TMDB");
    }
  };

  const clearTmdb = () => {
    setApiKey("");
    setToast("Personal key removed" + (envKey ? " — falling back to the server key" : ""));
  };

  return (
    <div className="mb-4">
      <Row
        icon={<KeyRound size={13} />}
        title={syncKey ? "Synced across devices" : "Sync this watchlist across devices"}
        hint="One 5-letter key · same lists everywhere"
        open={syncOpen}
        onToggle={() => setSyncOpen((o) => !o)}
        active={!!syncKey}
      >
        {cloud ? (
          <>
            {syncKey ? (
              <>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-2.5">
                  <code
                    className="flex-1 font-mono text-[15px] font-medium tracking-[0.42em] text-ink"
                    aria-label={`Sync key ${syncKey.split("").join(" ")}`}
                  >
                    {syncKey}
                  </code>
                  <button
                    onClick={() => void copy(syncKey)}
                    className="shrink-0 text-muted transition hover:text-ink"
                    aria-label="Copy sync key"
                  >
                    {copied ? <Check size={14} className="text-gold" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[10px] leading-relaxed text-muted">
                  Enter this key on any device to pull the same watchlist. Anything you add here pushes
                  there automatically.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => void pullFromCloud().then(() => setToast("Lists pulled from that key"))}
                    className="btn-ghost flex flex-1 items-center justify-center gap-1.5 !py-2 !text-[11px]"
                  >
                    <RefreshCw size={12} /> Pull now
                  </button>
                  <button
                    onClick={() => {
                      removeKnownKey(syncKey);
                      setToast("Disconnected from sync");
                    }}
                    className="btn-ghost flex-1 !py-2 !text-[11px]"
                  >
                    Disconnect
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => void createKey()} className="btn-gold w-full !py-2 !text-[11.5px]">
                Create a 5-letter key
              </button>
            )}
            <div className="flex gap-2">
              <input
                value={joinKey}
                onChange={(e) => setJoinKey(e.target.value.slice(0, 16))}
                onKeyDown={(e) => e.key === "Enter" && join()}
                placeholder="Enter a key from another device"
                aria-label="Enter an existing sync key"
                maxLength={16}
                className="field flex-1 font-mono !py-1.5 uppercase !text-[12px] tracking-[0.3em]"
              />
              <button onClick={() => void join()} className="btn-ghost w-[74px] shrink-0 !py-1.5 !text-[11px]">
                Connect
              </button>
            </div>
            {knownKeys.length > 1 && (
              <div>
                <div className="mono-label mb-1.5">Recent keys</div>
                {knownKeys
                  .filter((k) => k.key !== syncKey)
                  .slice(0, 4)
                  .map((k) => (
                    <div key={k.key} className="mb-1 flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                      <code className="truncate text-[10.5px] tracking-[0.18em] text-sub">{k.key}</code>
                      <button
                        onClick={() => removeKnownKey(k.key)}
                        className="shrink-0 text-faint transition hover:text-red-300"
                        aria-label={`Forget key ${k.key}`}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2.5 text-[10.5px] leading-relaxed text-muted">
            <p>
              Cross-device sync needs a free Supabase backend (2 minutes, one table). Until then, lists
              still save on this device.
            </p>
            <ol className="list-inside list-decimal space-y-1">
              <li>
                Create a project at <span className="text-sub">supabase.com</span>
              </li>
              <li>SQL Editor → paste and run:</li>
            </ol>
            <pre className="no-scrollbar max-h-32 overflow-auto rounded-lg border border-white/[0.06] bg-black/40 p-2.5 font-mono text-[9.5px] leading-relaxed text-sub select-all">
              {SETUP_SQL}
            </pre>
            <ol className="list-inside list-decimal space-y-1" start={3}>
              <li>
                Add to .env.local:
                <br />
                <code className="text-sub">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code className="text-sub">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>
              </li>
            </ol>
          </div>
        )}
      </Row>

      <Row
        icon={<Clapperboard size={13} />}
        title={activeKey ? "Movie key active" : "Use your own TMDB key"}
        hint="Personal key for film search — never leaves this device"
        open={keyOpen}
        onToggle={() => setKeyOpen((o) => !o)}
        active={!!activeKey}
      >
        <div className="flex gap-2">
          <input
            value={tmdbInput}
            onChange={(e) => setTmdbInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveTmdb()}
            placeholder={activeKey ? "Replace key…" : "Paste a TMDB API key (v3)"}
            className="field flex-1 !py-1.5 !text-[11px]"
          />
          <button onClick={() => void saveTmdb()} disabled={!tmdbInput.trim() || saving} className="btn-gold w-16 shrink-0 !py-1.5 !text-[11px]">
            {saving ? "…" : "Save"}
          </button>
        </div>
        {activeKey && (
          <button onClick={clearTmdb} className="btn-ghost w-full !py-1.5 !text-[11px]">
            Remove personal key
          </button>
        )}
        <p className="text-[10px] leading-relaxed text-muted">
          Free keys at themoviedb.org. {envKey ? "A server key is already set as fallback." : "Without a key, film search stays hidden."}
        </p>
      </Row>
    </div>
  );
}
