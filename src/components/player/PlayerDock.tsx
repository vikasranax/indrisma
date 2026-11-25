"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useStore } from "@/lib/store";
import youtubeManager from "@/lib/youtube";
import { formatTime } from "@/lib/format";

export default function PlayerDock() {
  const status = useStore((s) => s.status);
  const volume = useStore((s) => s.volume);
  const muted = useStore((s) => s.muted);
  const track = useStore((s) => s.currentTrack);
  const setVolume = useStore((s) => s.setVolume);
  const setMuted = useStore((s) => s.setMuted);

  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [scrubbing, setScrubbing] = useState(false);
  const [showVol, setShowVol] = useState(false);
  const rafRef = useRef<number>(0);

  const playing = status === "playing" || status === "loading";
  const live =
    status !== "idle" &&
    status !== "error" &&
    (!progress.duration || !Number.isFinite(progress.duration) || progress.duration > 86400);

  useEffect(() => {
    let last = 0;
    const tick = (t: number) => {
      if (t - last > 500) {
        last = t;
        if (!scrubbing) setProgress(youtubeManager.getProgress());
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scrubbing]);

  const onPlayPause = () => {
    if (!youtubeManager.isEngineStarted()) {
      youtubeManager.startEngine();
      return;
    }
    youtubeManager.togglePlay();
  };

  const onVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    youtubeManager.setVolume(v);
  };
  const onMute = () => {
    const m = !muted;
    setMuted(m);
    youtubeManager.applyMute(m);
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sec = Number(e.target.value);
    setProgress((p) => ({ ...p, current: sec }));
    youtubeManager.seek(sec);
  };

  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (useStore.getState().videoStageOpen) return;
      if (document.activeElement?.closest('[role="dialog"]')) return;
      const p = progressRef.current;
      const isLive = !p.duration || !Number.isFinite(p.duration) || p.duration > 86400;
      if (e.code === "Space" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        onPlayPause();
      } else if (e.key === "m" || e.key === "M") {
        onMute();
      } else if (e.key === "ArrowRight" && !isLive) {
        e.preventDefault();
        youtubeManager.seek(Math.min(p.duration, p.current + 10));
      } else if (e.key === "ArrowLeft" && !isLive) {
        e.preventDefault();
        youtubeManager.seek(Math.max(0, p.current - 10));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [muted, volume]);

  const pct = live ? 0 : progress.duration ? (progress.current / progress.duration) * 100 : 0;

  return (
    <div
      className="glass-strong mx-3 mb-3 rounded-2xl px-4 pb-3 pt-2.5 shadow-[var(--shadow-dock)] sm:mx-6 sm:mb-4 sm:px-6"
      role="region"
      aria-label="Player controls"
    >
      <div className="flex items-center gap-3">
        <span className="hidden w-10 shrink-0 text-right font-mono text-[10px] tabular-nums text-sub sm:block">
          {live ? "—:—" : formatTime(progress.current)}
        </span>

        {live ? (
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="shimmer absolute inset-0" aria-hidden />
          </div>
        ) : (
          <input
            type="range"
            min={0}
            max={Math.floor(progress.duration)}
            step={1}
            value={Math.floor(progress.current)}
            onChange={onSeek}
            onPointerDown={() => setScrubbing(true)}
            onPointerUp={() => setScrubbing(false)}
            className="seek flex-1"
            aria-label="Seek"
            style={{ ["--range-progress" as string]: `${pct}%` }}
          />
        )}

        <span className="hidden w-10 shrink-0 font-mono text-[10px] tabular-nums text-sub sm:block">
          {live ? "LIVE" : formatTime(progress.duration)}
        </span>
        {live && (
          <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-gold sm:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" /> Live
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3.5">
        <button
          onClick={onPlayPause}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold text-gold-ink shadow-[0_0_26px_rgba(232,180,88,0.4)] transition hover:scale-105 active:scale-95"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-medium text-ink">{track.title}</div>
          <div className="truncate font-mono text-[8.5px] uppercase tracking-[0.22em] text-faint">
            {track.badge}
          </div>
        </div>

        <div
          className="hidden items-center gap-2 sm:flex"
          onMouseEnter={() => setShowVol(true)}
          onMouseLeave={() => setShowVol(false)}
        >
          <button onClick={onMute} className="icon-btn h-9 w-9" aria-label={muted ? "Unmute" : "Mute"}>
            {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={muted ? 0 : volume}
            onChange={onVol}
            className={`seek transition-all duration-200 ${showVol ? "w-24 opacity-100" : "w-0 opacity-0"}`}
            aria-label="Volume"
            style={{ ["--range-progress" as string]: `${muted ? 0 : volume}%` }}
          />
        </div>

        <button onClick={onMute} className="icon-btn h-9 w-9 sm:hidden" aria-label={muted ? "Unmute" : "Mute"}>
          {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>
    </div>
  );
}
