"use client";

import { useStore } from "@/lib/store";
import { img } from "@/lib/tmdb";
import type { MiniMovie } from "@/lib/store";

function Stars({
  value,
  size = 11,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
}) {
  // read-only stars render as <span> so they never nest a <button> inside MovieCard's <button>
  const Tag: any = onChange ? "button" : "span";
  return (
    <span className="inline-flex items-center gap-[2px]" role="img" aria-label={`Rating ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Tag
          key={i}
          {...(onChange
            ? {
                type: "button",
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  onChange(value === i ? i - 1 : i);
                },
                className: "transition hover:scale-110",
                "aria-label": `${i} star${i > 1 ? "s" : ""}`,
              }
            : { className: "pointer-events-none" })}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <path
              d="M12 2l2.9 6.26L21.5 9.3l-4.75 4.4 1.15 6.8L12 17.15 6.1 20.5l1.15-6.8L2.5 9.3l6.6-1.04L12 2z"
              fill={i <= value ? "#e8b458" : "rgba(255,255,255,0.14)"}
            />
          </svg>
        </Tag>
      ))}
    </span>
  );
}

function PosterFallback() {
  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-white/[0.05] to-transparent">
      <span className="font-display text-2xl text-faint">?</span>
    </div>
  );
}

export default function MovieCard({
  m,
  onOpen,
  listContext,
  caption,
}: {
  m: MiniMovie;
  onOpen: () => void;
  listContext?: "watchlist" | "watched";
  caption?: string;
}) {
  const addToWatchlist = useStore((s) => s.addToWatchlist);
  const markWatched = useStore((s) => s.markWatched);
  const removeMovie = useStore((s) => s.removeMovie);
  const setToast = useStore((s) => s.setToast);
  const watchedEntry = useStore((s) => s.watched.find((x) => x.id === m.id));
  const inWatchlist = useStore((s) => s.watchlist.some((x) => x.id === m.id));
  const inWatched = useStore((s) => s.watched.some((x) => x.id === m.id));

  return (
    <button
      onClick={onOpen}
      className="group relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] text-left transition hover:border-white/[0.16]"
      aria-label={`${m.title} (${m.year || "unknown year"})`}
    >
      {m.poster ? (
        <img
          src={img(m.poster, "w342") || ""}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
        />
      ) : (
        <PosterFallback />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-2.5 pb-2 pt-6">
        <div className="truncate text-[10.5px] font-medium leading-tight text-ink">{m.title}</div>
        <div className="mt-0.5 flex items-center justify-between text-[9px] text-white/50">
          <span className="truncate">{caption || m.year || "—"}</span>
          {listContext === "watched" && watchedEntry ? (
            <Stars value={watchedEntry.rating} size={9} />
          ) : m.rating ? (
            <span className="font-mono">{m.rating.toFixed(1)}</span>
          ) : null}
        </div>
      </div>

      <div
        className="absolute right-1.5 top-1.5 flex flex-col gap-1 opacity-100 transition group-focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        {listContext ? (
          <span
            className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-black/70 text-[10px] text-sub transition hover:border-red-400/50 hover:text-red-300"
            onClick={() => removeMovie(listContext, m.id)}
            role="button"
            aria-label={`Remove ${m.title} from ${listContext}`}
            title="Remove"
          >
            ×
          </span>
        ) : (
          <>
            {!inWatched && (
              <span
                className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-black/70 text-[11px] text-sub transition hover:border-gold/50 hover:text-gold"
                onClick={() => {
                  if (inWatchlist) {
                    removeMovie("watchlist", m.id);
                    setToast("Removed from watchlist");
                  } else {
                    addToWatchlist(m);
                    setToast("Added to watchlist");
                  }
                }}
                role="button"
                aria-label={inWatchlist ? `Remove ${m.title} from watchlist` : `Add ${m.title} to watchlist`}
                title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
              >
                {inWatchlist ? "✓" : "+"}
              </span>
            )}
            <span
              className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-black/70 text-[10px] text-sub transition hover:border-gold/50 hover:text-gold"
              onClick={() => {
                markWatched(m, 0);
                setToast("Marked as watched");
              }}
              role="button"
              aria-label={`Mark ${m.title} as watched`}
              title="Mark watched"
            >
              ✓
            </span>
          </>
        )}
      </div>
    </button>
  );
}

export { Stars };
