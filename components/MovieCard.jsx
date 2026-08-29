'use client';
import { Plus, Check, Star, X } from 'lucide-react';
import { img } from '@/lib/tmdbApi';
import { useStore } from '@/lib/store';

export default function MovieCard({ m, onOpen, listContext }) {
  const inList = useStore((s) => s.inList);
  const addToWatchlist = useStore((s) => s.addToWatchlist);
  const markWatched = useStore((s) => s.markWatched);
  const setRating = useStore((s) => s.setRating);
  const removeMovie = useStore((s) => s.removeMovie);
  const st = inList(m.id);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] transition hover:border-white/[0.16]">
      <button onClick={() => onOpen?.(m)} className="block w-full">
        <div className="aspect-[2/3] w-full overflow-hidden bg-black/40">
          {m.poster ? (
            <img src={img(m.poster, 'w342')} alt={m.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="grid h-full place-items-center text-[10px] text-faint">no poster</div>
          )}
        </div>
      </button>

      <div className="p-2.5">
        <div className="truncate text-[12.5px] font-medium text-ink">{m.title}</div>
        <div className="mt-0.5 flex items-center justify-between text-[10.5px] text-muted">
          <span>{m.year || '—'}</span>
          {listContext === 'watched' && (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(m.id, n)} aria-label={`Rate ${n}`}>
                  <Star size={10} className={n <= (m.rating || 0) ? 'text-accent' : 'text-faint'} fill={n <= (m.rating || 0) ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {listContext ? (
        <button
          title="Remove" onClick={() => removeMovie(listContext, m.id)}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-ink opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-black/80"
        >
          <X size={13} />
        </button>
      ) : (
        <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
          <button
            title="Watchlist" onClick={() => addToWatchlist(m)}
            className={`grid h-7 w-7 place-items-center rounded-full backdrop-blur transition ${st.watchlist ? 'bg-accent text-accent-ink' : 'bg-black/60 text-ink hover:bg-black/80'}`}
          >
            {st.watchlist ? <Check size={14} /> : <Plus size={14} />}
          </button>
          <button
            title="Mark watched" onClick={() => markWatched(m, 0)}
            className={`grid h-7 w-7 place-items-center rounded-full backdrop-blur transition ${st.watched ? 'bg-accent text-accent-ink' : 'bg-black/60 text-ink hover:bg-black/80'}`}
          >
            <Star size={13} fill={st.watched ? 'currentColor' : 'none'} />
          </button>
        </div>
      )}
    </div>
  );
}