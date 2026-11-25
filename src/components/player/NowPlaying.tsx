"use client";

import { useEffect, useRef, useState } from "react";
import { MonitorPlay } from "lucide-react";
import { useStore } from "@/lib/store";
import { getChannel } from "@/lib/channels";
import { SCENE_CFG } from "@/lib/scenes";
import Visualizer from "@/components/ambient/Visualizer";
import PasteUrl from "./PasteUrl";

const IMAGE_AURA: [string, string] = ["#e8b458", "#f4f1ea"];

const STATUS_META: Record<string, { label: string; live: boolean }> = {
  idle: { label: "Standby", live: false },
  loading: { label: "Tuning", live: true },
  playing: { label: "On Air", live: true },
  paused: { label: "Paused", live: false },
  error: { label: "Retrying", live: true },
};

function OverflowTitle({ title }: { title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const check = () => {
      const wrap = wrapRef.current;
      const text = textRef.current;
      if (!wrap || !text) return;
      setOverflow(text.scrollWidth > wrap.clientWidth + 8);
    };
    check();
    const ro = new ResizeObserver(check);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [title, overflow]);

  const cls =
    "font-display font-medium leading-[1.05] tracking-[-0.01em] text-ink text-[clamp(1.7rem,min(3.1vw,6.4vh),2.7rem)]";

  if (!overflow) {
    return (
      <div ref={wrapRef} className="max-w-full overflow-hidden">
        <span ref={textRef} className={`block whitespace-nowrap ${cls}`}>
          {title}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="max-w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
    >
      <div
        className="marquee-track flex w-max gap-16"
        style={{ ["--marquee-duration" as string]: `${Math.max(14, title.length * 0.42)}s` }}
      >
        <span ref={textRef} className={`${cls} whitespace-nowrap`}>
          {title}
        </span>
        <span className={`${cls} whitespace-nowrap`} aria-hidden>
          {title}
        </span>
      </div>
    </div>
  );
}

export default function NowPlaying() {
  const status = useStore((s) => s.status);
  const track = useStore((s) => s.currentTrack);
  const currentChannelId = useStore((s) => s.currentChannelId);
  const sceneId = useStore((s) => s.sceneId);
  const bgMode = useStore((s) => s.bgMode);
  const videoStageOpen = useStore((s) => s.videoStageOpen);
  const setVideoStageOpen = useStore((s) => s.setVideoStageOpen);

  const channel = getChannel(currentChannelId);
  const meta = STATUS_META[status] || STATUS_META.idle;
  const aura: [string, string] =
    bgMode === "image" ? IMAGE_AURA : SCENE_CFG[sceneId]?.aura || SCENE_CFG.nebula.aura;

  return (
    <section className="flex w-full max-w-2xl flex-col items-center text-center" aria-label="Now playing">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <span className="status-chip">
          <span className={`h-1.5 w-1.5 rounded-full ${meta.live ? "bg-gold animate-pulse-dot" : "bg-faint"}`} />
          {meta.label}
        </span>
        {channel && (
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">{channel.name}</span>
        )}
      </div>

      <div className="mt-4 flex w-full justify-center px-2">
        <OverflowTitle title={track.title} />
      </div>

      <div className="mt-5 h-[72px] w-full max-w-xl [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:h-[52px]">
        <Visualizer colors={aura} status={status} />
      </div>

      <div className="mt-4 flex w-full items-center justify-center gap-2.5 px-2 [@media(max-height:760px)]:mt-3">
        <PasteUrl />
        <button
          onClick={() => setVideoStageOpen(!videoStageOpen)}
          className="icon-btn h-10 w-10 shrink-0"
          aria-label="Open the video player"
          aria-pressed={videoStageOpen}
          title="Watch the player (V)"
        >
          <MonitorPlay size={15} strokeWidth={1.8} />
        </button>
      </div>
    </section>
  );
}
