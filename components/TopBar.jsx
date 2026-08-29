'use client';
import { useEffect, useState } from 'react';
import { Clapperboard } from 'lucide-react';

export default function TopBar({ onOpenMovies }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  return (
    <div className="absolute top-0 inset-x-0 z-[20] flex items-start justify-between px-5 pt-6 sm:px-8">
      <div className="leading-none select-none">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[19px] sm:text-[23px] font-medium tracking-[0.02em] text-ink">INDRISMA</span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
        </div>
        <div className="mt-1 font-mono text-[9px] tracking-[0.28em] text-muted">MUSIC, OUT OF THIS WORLD</div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:block font-mono text-[13px] text-sub">{hh}:{mm}</span>
        <button
          onClick={onOpenMovies}
          className="icon-btn h-9 w-9"
          aria-label="Watchlist"
          title="Watchlist"
        >
          <Clapperboard size={15} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}