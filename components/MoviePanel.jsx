'use client';
import { useEffect, useState } from 'react';
import { X, Search as SearchIcon, KeyRound, Copy, Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { search as tmdbSearch, toMini } from '@/lib/tmdbApi';
import MovieCard from './MovieCard';
import MovieDetail from './MovieDetail';

const TABS = ['search', 'watchlist', 'watched'];

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-[2/3] animate-pulse rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#1a1a1c] to-[#0d0d0f]" />
      ))}
    </div>
  );
}
function EmptyState({ children }) {
  return <p className="pt-8 text-center text-[11px] leading-relaxed text-muted">{children}</p>;
}

function SyncRow() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinKey, setJoinKey] = useState('');
  const syncKey = useStore((s) => s.syncKey);
  const generateSyncKey = useStore((s) => s.generateSyncKey);
  const setSyncKey = useStore((s) => s.setSyncKey);
  const pullFromCloud = useStore((s) => s.pullFromCloud);
  const setToast = useStore((s) => s.setToast);

  const copy = async () => {
    try { await navigator.clipboard.writeText(syncKey); setCopied(true); setTimeout(() => setCopied(false), 1400); }
    catch { setToast('Could not copy — select and copy manually'); }
  };
  const join = async () => {
    const k = joinKey.trim();
    if (!k) return;
    setSyncKey(k);
    await pullFromCloud();
    setJoinKey('');
    setToast('Connected — lists synced from that key');
  };

  return (
    <div className="mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left">
        <KeyRound size={12} className={syncKey ? 'text-accent' : 'text-muted'} />
        <span className="flex-1 text-[10.5px] text-sub">{syncKey ? 'Synced across devices' : 'Sync this watchlist across devices'}</span>
        <span className="text-[10px] text-muted">{open ? 'Hide' : syncKey ? 'Manage' : 'Set up'}</span>
      </button>
      {open && (
        <div className="animate-rise space-y-2.5 border-t border-white/[0.06] px-3.5 py-3">
          {syncKey ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2">
              <code className="truncate text-[11px] text-ink">{syncKey}</code>
              <button onClick={copy} className="shrink-0 text-muted transition hover:text-ink">
                {copied ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
              </button>
            </div>
          ) : (
            <button onClick={() => { generateSyncKey(); setToast('Sync key created'); }} className="btn-accent w-full">
              Create a sync key
            </button>
          )}
          <div className="flex gap-2">
            <input
              value={joinKey}
              onChange={(e) => setJoinKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && join()}
              placeholder="Have a key from another device?"
              className="field flex-1 !py-1.5 !text-[11px]"
            />
            <button onClick={join} className="btn-ghost w-20 shrink-0 !py-1.5 !text-[11px]">Connect</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MoviePanel({ open, onClose }) {
  const [tab, setTab] = useState('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [activeMovie, setActiveMovie] = useState(null);

  const watchlist = useStore((s) => s.watchlist);
  const watched = useStore((s) => s.watched);

  useEffect(() => {
    if (!open) return;
    if (!query.trim()) { setResults([]); setErr(''); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await tmdbSearch(query.trim());
        setResults((data.results || []).map(toMini).filter((m) => m.title));
        setErr('');
      } catch (e) {
        setResults([]);
        setErr(e.code || 'ERROR');
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query, open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[50] md:inset-auto md:right-3 md:top-3 md:bottom-3 md:z-[30] md:w-[320px]">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm md:hidden" onClick={onClose} />

        <div className="animate-rise absolute inset-0 flex w-full flex-col overflow-hidden glass-strong md:relative md:rounded-2xl md:shadow-dock">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 pt-4 pb-3 sm:px-[18px]">
            <div className="flex gap-4">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`border-b pb-1 text-[11px] capitalize tracking-[0.03em] transition
                    ${tab === t ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-sub'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-muted transition hover:text-ink" aria-label="Close">
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-[18px]">
            <SyncRow />

            {tab === 'search' && (
              <>
                <div className="relative mb-3">
                  <SearchIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search films…" className="field pl-8" />
                </div>

                {err === 'MISSING_TMDB_KEY' && (
                  <p className="mb-3 text-[10.5px] text-muted">
                    Search needs a TMDB API key — add <code className="text-sub">NEXT_PUBLIC_TMDB_API_KEY</code> to your <code className="text-sub">.env.local</code> and restart the dev server.
                  </p>
                )}
                {err === 'INVALID_TMDB_KEY' && (
                  <p className="mb-3 text-[10.5px] text-muted">That TMDB key was rejected — double check it in <code className="text-sub">.env.local</code>.</p>
                )}
                {err === 'ERROR' && <p className="mb-3 text-[10.5px] text-muted">Search failed. Try again in a moment.</p>}

                {loading && <SkeletonGrid />}
                {!loading && !err && results.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {results.map((m) => <MovieCard key={m.id} m={m} onOpen={setActiveMovie} />)}
                  </div>
                )}
                {!loading && !err && query.trim() && results.length === 0 && <EmptyState>No matches for “{query.trim()}”.</EmptyState>}
                {!query.trim() && !err && <EmptyState>Search for a film to add it to your watchlist.</EmptyState>}
              </>
            )}

            {tab === 'watchlist' && (
              watchlist.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {watchlist.map((m) => <MovieCard key={m.id} m={m} onOpen={setActiveMovie} listContext="watchlist" />)}
                </div>
              ) : <EmptyState>Nothing here yet — search and tap + to add.</EmptyState>
            )}

            {tab === 'watched' && (
              watched.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {watched.map((m) => <MovieCard key={m.id} m={m} onOpen={setActiveMovie} listContext="watched" />)}
                </div>
              ) : <EmptyState>Mark films watched from search or your watchlist.</EmptyState>
            )}
          </div>
        </div>
      </div>

      {activeMovie && <MovieDetail movie={activeMovie} onClose={() => setActiveMovie(null)} />}
    </>
  );
}