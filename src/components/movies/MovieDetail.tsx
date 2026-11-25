"use client";

import { useEffect, useState } from "react";
import { X, Plus, Check, Star, Clock } from "lucide-react";
import {
  details as tmdbDetails,
  detailsTv,
  providers as tmdbProviders,
  tvProviders,
  img,
  imgOrig,
  type ProviderLists,
} from "@/lib/tmdb";
import { useStore, type MiniMovie } from "@/lib/store";
import { fmtRuntime } from "@/lib/format";
import { Stars } from "./MovieCard";

interface TmdbFull {
  overview?: string;
  tagline?: string;
  runtime?: number;
  genres?: { id: number; name: string }[];
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtFullDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export default function MovieDetail({ movie, onClose }: { movie: MiniMovie; onClose: () => void }) {
  const [loaded, setLoaded] = useState<{
    id: number;
    full: TmdbFull | null;
    provs: ProviderLists | null;
  } | null>(null);
  const full = loaded?.id === movie.id ? loaded.full : null;
  const provs = loaded?.id === movie.id ? loaded.provs : null;
  const loading = loaded?.id !== movie.id;

  const inWatchlist = useStore((s) => s.watchlist.some((x) => x.id === movie.id));
  const inWatched = useStore((s) => s.watched.some((x) => x.id === movie.id));
  const addToWatchlist = useStore((s) => s.addToWatchlist);
  const markWatched = useStore((s) => s.markWatched);
  const setRating = useStore((s) => s.setRating);

  useEffect(() => {
    let cancelled = false;
    const d = movie.mediaType === "tv" ? detailsTv(movie.id) : tmdbDetails(movie.id);
    const p = movie.mediaType === "tv" ? tvProviders(movie.id) : tmdbProviders(movie.id);
    Promise.all([d.catch(() => null), p.catch(() => null)]).then(([dd, pp]) => {
      if (!cancelled) setLoaded({ id: movie.id, full: dd, provs: pp });
    });
    return () => {
      cancelled = true;
    };
  }, [movie.id, movie.mediaType]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const backdrop = full?.backdrop_path ? imgOrig(full.backdrop_path) : null;
  const poster = movie.poster ? img(movie.poster, "w342") : null;
  const providerList = provs
    ? [...(provs.flatrate || []), ...(provs.rent || []), ...(provs.buy || [])].slice(0, 5)
    : [];
  const watchedEntry = useStore((s) => s.watched.find((x) => x.id === movie.id) || null);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="animate-rise relative z-10 max-h-[86vh] w-full max-w-[720px] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0b0a09]">
        <div
          className="relative h-[190px] bg-cover bg-center sm:h-[230px]"
          style={{
            backgroundImage: backdrop ? `url(${backdrop})` : "linear-gradient(160deg,#1c1a16,#0b0a09)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a09] via-[#0b0a09]/10 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-ink transition hover:bg-black/75"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 pb-8 sm:px-8">
          {poster && (
            <img
              src={poster}
              alt={`Poster for ${movie.title}`}
              className="-mt-16 mb-4 h-[180px] w-[122px] rounded-xl border border-white/[0.1] object-cover shadow-2xl sm:h-[200px] sm:w-[136px]"
            />
          )}

          <h2 className="font-display text-[24px] font-medium text-ink sm:text-[28px]">{movie.title}</h2>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-sub">
            <span>{movie.year || full?.release_date?.slice(0, 4) || full?.first_air_date?.slice(0, 4) || "—"}</span>
            {full?.runtime ? (
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {fmtRuntime(full.runtime)}
              </span>
            ) : null}
            {movie.rating ? (
              <span className="flex items-center gap-1.5 text-gold">
                <Star size={13} fill="currentColor" />
                {movie.rating.toFixed(1)}
              </span>
            ) : null}
            <span className="rounded-full border border-white/[0.1] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
              {movie.mediaType === "tv" ? "Series" : "Film"}
            </span>
          </div>

          {full?.tagline ? (
            <p className="mt-3 text-[13.5px] italic text-gold/90">&ldquo;{full.tagline}&rdquo;</p>
          ) : null}

          {movie.date && movie.mediaType === "movie" && movie.date > new Date().toISOString().slice(0, 10) && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
              Releases {fmtFullDate(movie.date)}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => addToWatchlist(movie)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-[12.5px] transition ${
                inWatchlist
                  ? "border-gold bg-gold text-gold-ink"
                  : "border-white/[0.14] bg-white/[0.03] text-ink hover:bg-white/[0.07]"
              }`}
            >
              {inWatchlist ? <Check size={14} /> : <Plus size={14} />} Watchlist
            </button>
            <button
              onClick={() => markWatched(movie, 0)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-[12.5px] transition ${
                inWatched
                  ? "border-gold bg-gold text-gold-ink"
                  : "border-white/[0.14] bg-white/[0.03] text-ink hover:bg-white/[0.07]"
              }`}
            >
              <Star size={14} fill={inWatched ? "currentColor" : "none"} /> Mark Watched
            </button>
          </div>

          {inWatched && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <span className="text-[11px] text-sub">Your rating</span>
              <Stars value={watchedEntry?.rating ?? 0} size={15} onChange={(v) => setRating(movie.id, v)} />
            </div>
          )}

          {loading ? (
            <div className="mt-7 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-white/[0.06]" />
            </div>
          ) : (
            <>
              {full?.overview && (
                <>
                  <h4 className="mb-2 mt-7 text-[13px] font-semibold text-ink">Overview</h4>
                  <p className="text-[13.5px] leading-relaxed text-sub">{full.overview}</p>
                </>
              )}
              {full?.genres?.length ? (
                <>
                  <h4 className="mb-2 mt-6 text-[13px] font-semibold text-ink">Genres</h4>
                  <div className="flex flex-wrap gap-2">
                    {full.genres.map((g) => (
                      <span
                        key={g.id}
                        className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11.5px] text-sub"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
              {providerList.length > 0 && (
                <>
                  <h4 className="mb-2 mt-6 text-[13px] font-semibold text-ink">Streaming on</h4>
                  <div className="flex gap-2">
                    {providerList.map((p) => (
                      <img
                        key={p.provider_id}
                        src={img(p.logo_path, "w92") || ""}
                        alt={p.provider_name}
                        title={p.provider_name}
                        className="h-9 w-9 rounded-lg border border-white/[0.08]"
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
