"use client";

import { Wand2, ImageOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { SCENE_CFG } from "@/lib/scenes";

function RailButton({
  label,
  active,
  onClick,
  vertical,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  vertical: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex items-center">
      <button
        onClick={onClick}
        className={`grid h-10 w-10 place-items-center rounded-full border transition-all duration-200 [@media(max-height:720px)]:h-9 [@media(max-height:720px)]:w-9 ${
          active
            ? "border-gold/45 bg-gold/12 text-gold shadow-[0_0_20px_rgba(232,180,88,0.25)]"
            : "border-white/[0.08] bg-black/25 text-muted hover:border-white/[0.16] hover:text-sub"
        }`}
        aria-label={label}
        aria-pressed={active}
      >
        {children}
      </button>
      <span
        className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-full border border-white/[0.08] bg-black/85 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink opacity-0 transition-all duration-200 ${
          vertical ? "left-[52px]" : "top-[52px]"
        } group-hover:opacity-100 ${vertical ? "group-hover:translate-x-0" : "group-hover:translate-y-0"} ${
          vertical ? "translate-x-[-6px]" : "translate-y-[-6px]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function SceneRail() {
  const sceneId = useStore((s) => s.sceneId);
  const setSceneId = useStore((s) => s.setSceneId);
  const autoSync = useStore((s) => s.autoSync);
  const setAutoSync = useStore((s) => s.setAutoSync);
  const bgMode = useStore((s) => s.bgMode);
  const clearCustomBg = useStore((s) => s.clearCustomBg);

  return (
    <>
      <nav
        className="no-scrollbar absolute left-6 top-1/2 z-20 hidden max-h-[calc(100dvh-200px)] -translate-y-1/2 flex-col gap-2.5 overflow-y-auto md:flex [@media(max-height:720px)]:gap-1.5"
        aria-label="Ambient scenes"
      >
        <RailButton
          label={`Auto-sync ${autoSync ? "on" : "off"}`}
          active={autoSync}
          onClick={() => setAutoSync(!autoSync)}
          vertical
        >
          <Wand2 size={15} strokeWidth={1.75} />
        </RailButton>

        <div className="mx-auto h-5 w-px bg-white/10 [@media(max-height:720px)]:h-3" role="presentation" />

        {Object.values(SCENE_CFG).map((s) => {
          const Icon = s.icon;
          return (
            <RailButton
              key={s.id}
              label={s.label}
              active={bgMode === "scene" && sceneId === s.id}
              onClick={() => setSceneId(s.id)}
              vertical
            >
              <Icon size={15} strokeWidth={1.75} />
            </RailButton>
          );
        })}

        {bgMode === "image" && (
          <>
            <div className="mx-auto h-5 w-px bg-white/10" role="presentation" />
            <RailButton label="Clear custom background" active onClick={clearCustomBg} vertical>
              <ImageOff size={15} strokeWidth={1.75} />
            </RailButton>
          </>
        )}
      </nav>

      <nav
        className="no-scrollbar absolute inset-x-0 top-[64px] z-20 flex gap-2 overflow-x-auto px-5 pb-1 md:hidden"
        aria-label="Ambient scenes"
      >
        <button
          onClick={() => setAutoSync(!autoSync)}
          className={`pill shrink-0 ${autoSync ? "is-active" : ""}`}
          aria-pressed={autoSync}
        >
          Auto
        </button>
        {Object.values(SCENE_CFG).map((s) => (
          <button
            key={s.id}
            onClick={() => setSceneId(s.id)}
            className={`pill shrink-0 ${bgMode === "scene" && sceneId === s.id ? "is-active" : ""}`}
            aria-pressed={bgMode === "scene" && sceneId === s.id}
          >
            {s.label}
          </button>
        ))}
        {bgMode === "image" && (
          <button onClick={clearCustomBg} className="pill shrink-0 is-active" aria-label="Clear custom background">
            Clear image
          </button>
        )}
      </nav>
    </>
  );
}
