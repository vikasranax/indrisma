"use client";

import { useStore } from "@/lib/store";
import { CHANNELS } from "@/lib/channels";
import youtubeManager from "@/lib/youtube";

function EqBars({ accent }: { accent: string }) {
  return (
    <span className="flex h-2.5 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="eq-bar w-[2px] rounded-[1px]"
          style={{ height: `${5 + i * 2.5}px`, background: accent, animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

export default function ChannelDeck() {
  const channelId = useStore((s) => s.currentChannelId);

  return (
    <section className="w-full max-w-3xl" aria-label="Channels">
      <div className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
        {CHANNELS.map((c) => {
          const active = c.id === channelId;
          return (
            <button
              key={c.id}
              onClick={() => youtubeManager.playChannel(c.id)}
              className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 transition-all duration-200 ${
                active
                  ? "border-gold/50 bg-gold/10 shadow-[0_0_18px_rgba(232,180,88,0.14)]"
                  : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.18] hover:bg-white/[0.06]"
              }`}
              aria-label={`Play channel ${c.name}`}
              aria-pressed={active}
              title={`${c.name} — ${c.note}`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full transition-all duration-300"
                style={{ background: c.art.accent, boxShadow: active ? `0 0 10px ${c.art.accent}` : "none" }}
              />
              <span
                className={`whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.14em] ${
                  active ? "text-ink" : "text-muted"
                }`}
              >
                {c.name}
              </span>
              {active && <EqBars accent={c.art.accent} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
