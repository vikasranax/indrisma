"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import youtubeManager from "@/lib/youtube";
import BackgroundScene from "@/components/ambient/BackgroundScene";
import TopBar from "@/components/shell/TopBar";
import SceneRail from "@/components/shell/SceneRail";
import ShortcutsDialog from "@/components/shell/ShortcutsDialog";
import Toast from "@/components/shell/Toast";
import NowPlaying from "@/components/player/NowPlaying";
import ChannelDeck from "@/components/player/ChannelDeck";
import PlayerDock from "@/components/player/PlayerDock";
import VideoStage from "@/components/player/VideoStage";
import MoviePanel from "@/components/movies/MoviePanel";

export default function Page() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).then(() => {
      const { syncKey, pullFromCloud, currentChannelId } = useStore.getState();
      if (syncKey) void pullFromCloud();
      void youtubeManager.init().then(() => {
        youtubeManager.playChannel(currentChannelId || "radio", { gesture: false });
      });
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const dlg = document.activeElement?.closest('[role="dialog"]');
      if (dlg) return;
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        useStore.getState().setPanelOpen(true);
      } else if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        useStore.getState().setVideoStageOpen(!useStore.getState().videoStageOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-x-clip bg-canvas text-ink">
      <BackgroundScene />
      <div className="grain pointer-events-none fixed inset-0 z-[2]" aria-hidden />
      <div className="vignette pointer-events-none fixed inset-0 z-[2]" aria-hidden />

      <TopBar onOpenShortcuts={() => setShortcutsOpen(true)} />
      <SceneRail />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-7 px-6 pb-4 pt-[104px] [@media(max-height:760px)]:gap-4 [@media(max-height:760px)]:pt-[92px] md:pl-[104px]">
        <NowPlaying />
        <ChannelDeck />
      </div>

      <footer className="sticky bottom-0 z-30 mt-auto">
        <PlayerDock />
        <p className="pb-2 pt-0.5 text-center font-mono text-[8.5px] uppercase tracking-[0.3em] text-faint">
          Indrisma · streams via YouTube · films via TMDB
        </p>
      </footer>

      <MoviePanel />
      <VideoStage />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <Toast />
    </main>
  );
}
