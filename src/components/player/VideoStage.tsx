"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MonitorDown, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useStore } from "@/lib/store";
import youtubeManager from "@/lib/youtube";
import { SCENE_CFG } from "@/lib/scenes";
import { formatTime } from "@/lib/format";
import Visualizer from "@/components/ambient/Visualizer";

const IMAGE_AURA: [string, string] = ["#e8b458", "#f4f1ea"];

/**
 * Full-screen real-time player. The hidden YouTube iframe is promoted via the
 * `stage-live` body class (z-80). This overlay must stay transparent (no bg),
 * otherwise it would cover the video.
 */
export default function VideoStage() {
  const open = useStore((s) => s.videoStageOpen);
  const setOpen = useStore((s) => s.setVideoStageOpen);
  const status = useStore((s) => s.status);
  const track = useStore((s) => s.currentTrack);
  const volume = useStore((s) => s.volume);
  const muted = useStore((s) => s.muted);
  const setVolume = useStore((s) => s.setVolume);
  const setMuted = useStore((s) => s.setMuted);
  const sceneId = useStore((s) => s.sceneId);
  const bgMode = useStore((s) => s.bgMode);

  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [scrubbing, setScrubbing] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const hideTimer = useRef<number>(0);
  const statusRef = useRef(status);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const playing = status === "playing" || status === "loading";
  const live =
    status !== "idle" &&
    status !== "error" &&
    (!progress.duration || !Number.isFinite(progress.duration) || progress.duration > 86400);

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

  useEffect(() => {
    document.body.classList.toggle("stage-live", open);
    if (open && !youtubeManager.isEngineStarted()) youtubeManager.startEngine();
    return () => document.body.classList.remove("stage-live");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let last = 0;
    const tick = (t: number) => {
      if (t - last > 330) {
        last = t;
        if (!scrubbing) setProgress(youtubeManager.getProgress());
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [open, scrubbing]);

  const bump = useCallback(() => {
    setUiVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (statusRef.current === "playing") setUiVisible(false);
    }, 2800);
  }, []);

  useEffect(() => {
    if (!open) return;
    const start = window.setTimeout(bump, 0);
    const evs = ["pointermove", "pointerdown", "keydown"] as const;
    evs.forEach((ev) => window.addEventListener(ev, bump));
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(hideTimer.current);
      evs.forEach((ev) => window.removeEventListener(ev, bump));
    };
  }, [open, bump]);

  const keyRef = useRef({ onPlayPause, onMute, onSeek, live, progress, setOpen });
  useEffect(() => {
    keyRef.current = { onPlayPause, onMute, onSeek, live, progress, setOpen };
  });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const k = keyRef.current;
      if (e.key === "Escape") {
        e.preventDefault();
        k.setOpen(false);
      } else if (e.code === "Space") {
        e.preventDefault();
        k.onPlayPause();
      } else if (e.key === "m" || e.key === "M") {
        k.onMute();
      } else if (e.key === "ArrowRight" && !k.live) {
        e.preventDefault();
        k.onSeek({ target: { value: String(Math.min(k.progress.duration, k.progress.current + 10)) } } as React.ChangeEvent<HTMLInputElement>);
      } else if (e.key === "ArrowLeft" && !k.live) {
        e.preventDefault();
        k.onSeek({ target: { value: String(Math.max(0, k.progress.current - 10)) } } as React.ChangeEvent<HTMLInputElement>);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const aura: [string, string] =
    bgMode === "image" ? IMAGE_AURA : SCENE_CFG[sceneId]?.aura || SCENE_CFG.nebula.aura;
  const pct = live ? 0 : progress.duration ? (progress.current / progress.duration) * 100 : 0;
  const fade = uiVisible ? "opacity-100" : "opacity-0";

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Video player">
      <button
        className="absolute inset-0 z-[5] cursor-pointer"
        onClick={onPlayPause}
        aria-label={playing ? "Pause video" : "Play video"}
      />

      <div
        className={`absolute inset-x-0 top-0 z-20 flex items-center gap-4 bg-linear-to-b from-black/85 via-black/45 to-transparent px-5 pb-10 pt-5 transition-opacity duration-300 sm:px-8 ${fade}`}
      >
        <span className="status-chip shrink-0">
          <span className={`h-1.5 w-1.5 rounded-full ${playing ? "bg-gold animate-pulse-dot" : "bg-faint"}`} />
          {live ? "Live" : "Video"}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{track.title}</span>
        <button
          onClick={() => setOpen(false)}
          className="icon-btn h-9 w-9 shrink-0"
          aria-label="Back to ambience"
          title="Back to ambience (Esc)"
        >
          <MonitorDown size={15} strokeWidth={1.8} />
        </button>
      </div>

      <div className={`absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300 ${fade}`}>
        <div className="pointer-events-none h-[86px] w-full opacity-90">
          <Visualizer colors={aura} status={status} mirrored={false} />
        </div>

        <div className="bg-linear-to-t from-black/90 via-black/60 to-transparent pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-1">
          <div className="flex items-center gap-3 px-5 sm:px-8">
            <span className="w-11 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-sub">
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
                aria-label="Seek video"
                style={{ ["--range-progress" as string]: `${pct}%` }}
              />
            )}
            <span className="w-11 shrink-0 font-mono text-[10.5px] tabular-nums text-sub">
              {live ? "LIVE" : formatTime(progress.duration)}
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-4 px-5 sm:px-8">
            <button
              onClick={onPlayPause}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold text-gold-ink shadow-[0_0_28px_rgba(232,180,88,0.4)] transition hover:scale-105 active:scale-95"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause size={17} fill="currentColor" />
              ) : (
                <Play size={17} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium text-ink sm:hidden">{track.title}</div>
              <div className="hidden truncate font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted sm:block">
                {track.badge}
              </div>
            </div>

            <button onClick={onMute} className="icon-btn h-9 w-9 shrink-0" aria-label={muted ? "Unmute" : "Mute"}>
              {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={onVol}
              className="seek hidden w-24 sm:block"
              aria-label="Volume"
              style={{ ["--range-progress" as string]: `${muted ? 0 : volume}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
