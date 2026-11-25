"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Search as SearchIcon, Film } from "lucide-react";
import { useStore, type MiniMovie } from "@/lib/store";
import {
  searchMulti,
  upcoming as fetchUpcoming,
  onTheAirTv as fetchOnAir,
  toMini,
  toMiniTv,
  type TmdbRaw,
} from "@/lib/tmdb";
import MovieCard from "./MovieCard";
import MovieDetail from "./MovieDetail";
import KeyManager from "./KeyManager";

type Tab = "discover" | "search" | "watchlist" | "watched";

const TABS: { id: Tab; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "search", label: "Search" },
  { id: "watchlist", label: "Watchlist" },
  { id: "watched", label: "Watched" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso.slice(0, 4) || "";
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}`;
}

function RailSkeleton() {
  return (
    <div className="mb-6">
      <div className="shimmer mb-2.5 h-2.5 w-24 rounded" />
      <div className="no-scrollbar flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shimmer aspect-[2/3] w-[94px] shrink-0 rounded-xl border border-white/[0.06]" />
        ))}
      </div>
    </div>
  );
}

function PosterRail({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: MiniMovie[];
  onOpen: (m: MiniMovie) => void;
}) {
  if (!items.length) return null;
  return (
    <section className="mb-6">
      <div className="mb-2.5 px-0.5">
        <span className="mono-label">{title}</span>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {items.map((m) => (
          <div key={`${m.mediaType}-${m.id}`} className="w-[94px] shrink-0">
            <MovieCard m={m} onOpen={() => onOpen(m)} caption={fmtDate(m.date)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="pt-10 text-center text-[11.5px] leading-relaxed text-muted">{children}</p>;
}

export default function MoviePanel() {
  const open = useStore((s) => s.panelOpen);
  const setPanelOpen = useStore((s) => s.setPanelOpen);
  const watchlist = useStore((s) => s.watchlist);
  const watched = useStore((s) => s.watched);
  const syncKey = useStore((s) => s.syncKey);
  const pullFromCloud = useStore((s) => s.pullFromCloud);

  const [tab, setTab] = useState<Tab>("discover");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MiniMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [activeMovie, setActiveMovie] = useState<MiniMovie | null>(null);
  const [discover, setDiscover] = useState<{
    state: "idle" | "loading" | "ready" | "error";
    errCode: string;
    movies: MiniMovie[];
    series: MiniMovie[];
  }>({ state: "idle", errCode: "", movies: [], series: [] });
  const closeRef = useRef<HTMLButtonElement>(null);
  const searchSeq = useRef(0);

  const counts = useMemo(() => ({ watchlist: watchlist.length, watched: watched.length }), [watchlist, watched]);

  useEffect(() => {
    if (!open || discover.state !== "idle") return;
    setDiscover((d) => ({ ...d, state: "loading" }));
    const moviesP = fetchUpcoming().catch((e: { code?: string }) => ({ __err: e.code || "ERROR" }));
    const tvP = fetchOnAir().catch((e: { code?: string }) => ({ __err: e.code || "ERROR" }));
    Promise.all([moviesP, tvP]).then(([mv, tv]) => {
      const movies = Array.isArray(mv?.results)
        ? (mv.results as TmdbRaw[])
            .map(toMini)
            .filter((m) => m.title && m.poster)
            .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"))
            .slice(0, 14)
        : [];
      const series = Array.isArray(tv?.results)
        ? (tv.results as TmdbRaw[]).map(toMiniTv).filter((m) => m.title && m.poster).slice(0, 14)
        : [];
      const errCode = mv?.__err || tv?.__err || "";
      setDiscover({ state: errCode ? "error" : "ready", errCode, movies, series });
    });
  }, [open, discover.state]);

  useEffect(() => {
    if (!open) return;
    const seq = ++searchSeq.current;
    if (!query.trim()) {
      setResults([]);
      setErr("");
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await searchMulti(query.trim());
        if (seq !== searchSeq.current) return;
        const mapped = (data.results || [])
          .filter((m: TmdbRaw & { media_type?: string }) => m.media_type === "movie" || m.media_type === "tv")
          .map((m: TmdbRaw & { media_type?: string }) => (m.media_type === "tv" ? toMiniTv(m) : toMini(m)))
          .filter((m: MiniMovie) => m.title && m.poster);
        setResults(mapped);
        setErr("");
      } catch (e) {
        if (seq !== searchSeq.current) return;
        setResults([]);
        setErr((e as { code?: string }).code || "ERROR");
      } finally {
        if (seq === searchSeq.current) setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    if (open && syncKey) void pullFromCloud();
  }, [open, syncKey, pullFromCloud]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !activeMovie) setPanelOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, activeMovie, setPanelOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:bg-black/25"
            onClick={() => setPanelOpen(false)}
            aria-hidden
          />

          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="glass-strong fixed inset-0 z-[60] flex w-full flex-col overflow-hidden md:inset-y-0 md:left-auto md:right-0 md:w-[400px] md:rounded-l-3xl md:shadow-[var(--shadow-panel)]"
            role="dialog"
            aria-modal="true"
            aria-label="Films"
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 pb-3.5 pt-5">
              <div className="flex items-center gap-2.5">
                <Film size={15} className="text-gold" aria-hidden />
                <h2 className="font-display text-[16px] font-medium tracking-[0.02em] text-ink">Films</h2>
              </div>
              <button
                ref={closeRef}
                onClick={() => setPanelOpen(false)}
                className="icon-btn h-8 w-8 !border-transparent !bg-transparent"
                aria-label="Close films panel"
              >
                <X size={15} />
              </button>
            </div>

            <div className="no-scrollbar flex gap-5 overflow-x-auto border-b border-white/[0.07] px-5">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex shrink-0 items-center gap-1.5 pb-3 pt-3.5 text-[11.5px] capitalize tracking-[0.03em] transition ${
                    tab === t.id ? "text-ink" : "text-muted hover:text-sub"
                  }`}
                  aria-selected={tab === t.id}
                  role="tab"
                >
                  {t.label}
                  {t.id !== "discover" && t.id !== "search" && counts[t.id] > 0 && (
                    <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 font-mono text-[9px] text-sub">
                      {counts[t.id]}
                    </span>
                  )}
                  {tab === t.id && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute inset-x-0 bottom-0 h-[1.5px] rounded-full bg-gold"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <KeyManager />

              {tab === "discover" && (
                <>
                  {discover.state === "error" && discover.errCode === "MISSING_TMDB_KEY" && (
                    <EmptyState>
                      Discover needs a TMDB key — add your personal key above, or set{" "}
                      <code className="text-sub">NEXT_PUBLIC_TMDB_API_KEY</code> in .env.local.
                    </EmptyState>
                  )}
                  {discover.state === "error" && discover.errCode === "INVALID_TMDB_KEY" && (
                    <EmptyState>That key was rejected — double-check it above.</EmptyState>
                  )}
                  {discover.state === "error" && !["MISSING_TMDB_KEY", "INVALID_TMDB_KEY"].includes(discover.errCode) && (
                    <EmptyState>Could not reach the film database. Try again in a moment.</EmptyState>
                  )}
                  {discover.state === "loading" && (
                    <>
                      <RailSkeleton />
                      <RailSkeleton />
                    </>
                  )}
                  {discover.state === "ready" && (
                    <>
                      <PosterRail title="Coming soon · films" items={discover.movies} onOpen={setActiveMovie} />
                      <PosterRail title="On air · series" items={discover.series} onOpen={setActiveMovie} />
                      {!discover.movies.length && !discover.series.length && (
                        <EmptyState>Nothing on the horizon right now.</EmptyState>
                      )}
                    </>
                  )}
                </>
              )}

              {tab === "search" && (
                <>
                  <div className="relative mb-4">
                    <SearchIcon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search films and series"
                      className="field pl-9"
                      aria-label="Search films"
                    />
                  </div>

                  {err === "MISSING_TMDB_KEY" && (
                    <EmptyState>
                      Film search needs a TMDB key — add your personal key above, or set{" "}
                      <code className="text-sub">NEXT_PUBLIC_TMDB_API_KEY</code> in .env.local.
                    </EmptyState>
                  )}
                  {err === "INVALID_TMDB_KEY" && (
                    <EmptyState>That key was rejected — double-check it above.</EmptyState>
                  )}
                  {err === "ERROR" && <EmptyState>Search failed. Try again in a moment.</EmptyState>}

                  {loading && (
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="shimmer aspect-[2/3] rounded-xl border border-white/[0.06]" />
                      ))}
                    </div>
                  )}
                  {!loading && !err && results.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {results.map((m) => (
                        <MovieCard key={`${m.mediaType}-${m.id}`} m={m} onOpen={() => setActiveMovie(m)} />
                      ))}
                    </div>
                  )}
                  {!loading && !err && query.trim() && results.length === 0 && (
                    <EmptyState>No matches for &ldquo;{query.trim()}&rdquo;.</EmptyState>
                  )}
                  {!query.trim() && !err && (
                    <EmptyState>Search a film or series, then add it to your watchlist.</EmptyState>
                  )}
                </>
              )}

              {tab === "watchlist" &&
                (watchlist.length ? (
                  <div className="grid grid-cols-3 gap-2">
                    {watchlist.map((m) => (
                      <MovieCard key={m.id} m={m} onOpen={() => setActiveMovie(m)} listContext="watchlist" />
                    ))}
                  </div>
                ) : (
                  <EmptyState>Nothing queued — search and tap + to add.</EmptyState>
                ))}

              {tab === "watched" &&
                (watched.length ? (
                  <div className="grid grid-cols-3 gap-2">
                    {watched.map((m) => (
                      <MovieCard key={m.id} m={m} onOpen={() => setActiveMovie(m)} listContext="watched" />
                    ))}
                  </div>
                ) : (
                  <EmptyState>Mark films watched from search or your watchlist.</EmptyState>
                ))}
            </div>
          </motion.aside>

          {activeMovie && <MovieDetail movie={activeMovie} onClose={() => setActiveMovie(null)} />}
        </>
      )}
    </AnimatePresence>
  );
}
