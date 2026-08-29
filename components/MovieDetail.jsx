'use client';
import { useEffect, useState } from 'react';
import { X, Plus, Check, Star, Clock } from 'lucide-react';
import { details as tmdbDetails, providers as tmdbProviders, img, imgOrig } from '@/lib/tmdbApi';
import { useStore } from '@/lib/store';

function fmtRuntime(min) {
  if (!min) return null;
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default function MovieDetail({ movie, onClose }) {
  const [full, setFull] = useState(null);
  const [provs, setProvs] = useState(null);
  const [loading, setLoading] = useState(true);

  const inList = useStore((s) => s.inList);
  const addToWatchlist = useStore((s) => s.addToWatchlist);
  const markWatched = useStore((s) => s.markWatched);
  const st = inList(movie.id);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([tmdbDetails(movie.id).catch(() => null), tmdbProviders(movie.id).catch(() => null)]).then(
      ([d, p]) => { if (!cancelled) { setFull(d); setProvs(p); setLoading(false); } }
    );
    return () => { cancelled = true; };
  }, [movie.id]);

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const backdrop = full?.backdrop_path ? imgOrig(full.backdrop_path) : null;
  const poster = movie.poster ? img(movie.poster, 'w342') : null;
  const providerList = provs ? [...(provs.flatrate || []), ...(provs.rent || []), ...(provs.buy || [])].slice(0, 5) : [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-rise relative z-10 max-h-[86vh] w-full max-w-[720px] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0b0b0d]">
        <div
          className="relative h-[190px] bg-cover bg-center sm:h-[230px]"
          style={{ backgroundImage: backdrop ? `url(${backdrop})` : 'linear-gradient(160deg,#1a1a1c,#0b0b0d)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-[#0b0b0d]/10 to-transparent" />
          <button onClick={onClose} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-ink" aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 pb-8 sm:px-8">
          {poster && (
            <img src={poster} alt="" className="-mt-16 mb-4 h-[180px] w-[122px] rounded-xl border border-white/[0.1] object-cover shadow-2xl sm:h-[200px] sm:w-[136px]" />
          )}
          <h2 className="font-display text-[24px] font-medium text-ink sm:text-[28px]">{movie.title}</h2>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px] text-sub">
            <span>{movie.year || full?.release_date?.slice(0, 4) || '—'}</span>
            {full?.runtime ? (
              <span className="flex items-center gap-1.5"><Clock size={13} />{fmtRuntime(full.runtime)}</span>
            ) : null}
            {movie.rating ? (
              <span className="flex items-center gap-1.5 text-accent">
                <Star size={13} fill="currentColor" />{movie.rating.toFixed(1)}
              </span>
            ) : null}
          </div>

          {full?.tagline ? <p className="mt-3 text-[13.5px] italic text-accent/90">"{full.tagline}"</p> : null}

          <div className="mt-5 flex gap-2.5">
            <button
              onClick={() => addToWatchlist(movie)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-[12.5px] transition ${st.watchlist ? 'border-accent bg-accent text-accent-ink' : 'border-white/[0.14] bg-white/[0.03] text-ink hover:bg-white/[0.07]'}`}
            >
              {st.watchlist ? <Check size={14} /> : <Plus size={14} />} Watchlist
            </button>
            <button
              onClick={() => markWatched(movie, 0)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-[12.5px] transition ${st.watched ? 'border-accent bg-accent text-accent-ink' : 'border-white/[0.14] bg-white/[0.03] text-ink hover:bg-white/[0.07]'}`}
            >
              <Star size={14} fill={st.watched ? 'currentColor' : 'none'} /> Mark Watched
            </button>
          </div>

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
                  <h4 className="mt-7 mb-2 text-[13px] font-semibold text-ink">Overview</h4>
                  <p className="text-[13.5px] leading-relaxed text-sub">{full.overview}</p>
                </>
              )}
              {full?.genres?.length ? (
                <>
                  <h4 className="mt-6 mb-2 text-[13px] font-semibold text-ink">Genres</h4>
                  <div className="flex flex-wrap gap-2">
                    {full.genres.map((g) => (
                      <span key={g.id} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11.5px] text-sub">{g.name}</span>
                    ))}
                  </div>
                </>
              ) : null}
              {providerList.length > 0 && (
                <>
                  <h4 className="mt-6 mb-2 text-[13px] font-semibold text-ink">Streaming on</h4>
                  <div className="flex gap-2">
                    {providerList.map((p) => (
                      <img key={p.provider_id} src={img(p.logo_path, 'w92')} alt={p.provider_name} title={p.provider_name} className="h-9 w-9 rounded-lg border border-white/[0.08]" />
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