"use client";

import { useEffect, useState } from "react";
import { Clapperboard, Keyboard } from "lucide-react";
import { useStore } from "@/lib/store";

export default function TopBar({ onOpenShortcuts }: { onOpenShortcuts: () => void }) {
  const [now, setNow] = useState<Date | null>(null);
  const setPanelOpen = useStore((s) => s.setPanelOpen);
  const panelOpen = useStore((s) => s.panelOpen);
  const watchCount = useStore((s) => s.watchlist.length + s.watched.length);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = now ? String(now.getHours()).padStart(2, "0") : "--";
  const mm = now ? String(now.getMinutes()).padStart(2, "0") : "--";

  return (
    <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6">
      <div className="leading-none select-none">
        <div className="flex items-center gap-2.5">
          <span className="relative grid h-7 w-7 place-items-center">
            <span className="absolute inset-0 rounded-full border border-gold/35" />
            <span className="animate-orbit absolute inset-0">
              <span className="absolute -top-[3px] left-1/2 h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-gold shadow-[0_0_10px_rgba(232,180,88,0.8)]" />
            </span>
          </span>
          <span className="font-display text-[19px] font-medium tracking-[0.02em] text-ink sm:text-[22px]">
            INDRISMA
          </span>
        </div>
        <div className="mono-label mt-2 hidden sm:block">Music, out of this world</div>
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className="hidden font-mono text-[12.5px] tabular-nums tracking-[0.14em] text-sub sm:block"
          suppressHydrationWarning
        >
          {hh}:{mm}
        </span>

        <button
          onClick={onOpenShortcuts}
          className="icon-btn hidden h-9 w-9 sm:grid"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard size={15} strokeWidth={1.8} />
        </button>

        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className={`icon-btn relative h-9 w-9 ${panelOpen ? "is-active" : ""}`}
          aria-label="Open watchlist"
          title="Watchlist"
        >
          <Clapperboard size={15} strokeWidth={1.8} />
          {watchCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-gold px-1 font-mono text-[9px] font-semibold text-gold-ink">
              {watchCount > 99 ? "99+" : watchCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
