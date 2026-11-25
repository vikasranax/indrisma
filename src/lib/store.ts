"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "./supabase";

export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "error";

export interface TrackInfo {
  title: string;
  badge: string;
  videoId: string | null;
}

export interface MiniMovie {
  id: number;
  title: string;
  year: string;
  date?: string;
  poster: string | null;
  rating: number | null;
  mediaType: "movie" | "tv";
}

export interface WatchedMovie extends MiniMovie {
  rating: number;
  watchedAt: number;
}

export interface KnownKey {
  key: string;
  label: string;
  usedAt: number;
}

interface AppState {
  status: PlaybackStatus;
  setStatus: (s: PlaybackStatus) => void;
  volume: number;
  muted: boolean;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  currentChannelId: string;
  setCurrentChannelId: (id: string) => void;
  currentTrack: TrackInfo;
  setCurrentTrack: (t: TrackInfo) => void;

  sceneId: string;
  setSceneId: (id: string) => void;
  autoSync: boolean;
  setAutoSync: (b: boolean) => void;
  bgMode: "scene" | "image";
  customBg: string;
  setCustomBg: (url: string) => void;
  clearCustomBg: () => void;

  syncKey: string;
  knownKeys: KnownKey[];
  setSyncKey: (k: string) => void;
  setKeyLabel: (key: string, label: string) => void;
  removeKnownKey: (key: string) => void;
  generateSyncKey: () => string;

  watchlist: MiniMovie[];
  watched: WatchedMovie[];
  addToWatchlist: (m: MiniMovie) => void;
  markWatched: (m: MiniMovie, rating?: number) => void;
  setRating: (id: number, rating: number) => void;
  removeMovie: (list: "watchlist" | "watched", id: number) => void;
  pullFromCloud: () => Promise<boolean>;

  panelOpen: boolean;
  setPanelOpen: (b: boolean) => void;
  videoStageOpen: boolean;
  setVideoStageOpen: (b: boolean) => void;
  toast: string | null;
  setToast: (t: string | null) => void;

  _push: () => void;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

let pushTimer: ReturnType<typeof setTimeout> | null = null;
function debouncePush(fn: () => void, ms = 1200) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(fn, ms);
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      status: "idle",
      setStatus: (s) => set({ status: s }),
      volume: 70,
      muted: false,
      setVolume: (v) => set({ volume: v }),
      setMuted: (m) => set({ muted: m }),
      currentChannelId: "radio",
      setCurrentChannelId: (id) => set({ currentChannelId: id }),
      currentTrack: { title: "Indrisma — Streaming", badge: "Live Stream", videoId: null },
      setCurrentTrack: (t) => set({ currentTrack: t }),

      sceneId: "nebula",
      setSceneId: (id) => set({ sceneId: id, bgMode: "scene" }),
      autoSync: true,
      setAutoSync: (b) => set({ autoSync: b }),

      bgMode: "scene",
      customBg: "",
      setCustomBg: (url) => set({ customBg: url, bgMode: "image" }),
      clearCustomBg: () => set({ customBg: "", bgMode: "scene" }),

      syncKey: "",
      knownKeys: [],
      setSyncKey: (k) => {
        set((s) => {
          const exists = s.knownKeys.find((x) => x.key === k);
          const updated = exists
            ? s.knownKeys.map((x) => (x.key === k ? { ...x, usedAt: Date.now() } : x))
            : [{ key: k, label: "", usedAt: Date.now() }, ...s.knownKeys];
          return { syncKey: k, knownKeys: updated.slice(0, 10) };
        });
      },
      setKeyLabel: (key, label) =>
        set((s) => ({
          knownKeys: s.knownKeys.map((x) => (x.key === key ? { ...x, label } : x)),
        })),
      removeKnownKey: (key) =>
        set((s) => ({
          knownKeys: s.knownKeys.filter((x) => x.key !== key),
          syncKey: s.syncKey === key ? "" : s.syncKey,
        })),
      generateSyncKey: () => {
        const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let key = "";
        for (let i = 0; i < 5; i++) {
          key += ALPHA[Math.floor(Math.random() * ALPHA.length)];
        }
        get().setSyncKey(key);
        return key;
      },

      watchlist: [],
      watched: [],
      addToWatchlist: (m) => {
        set((s) => ({
          watchlist: s.watchlist.some((x) => x.id === m.id) ? s.watchlist : [m, ...s.watchlist],
          watched: s.watched.filter((x) => x.id !== m.id),
        }));
        get()._push();
      },
      markWatched: (m, rating) => {
        set((s) => ({
          watched: [
            { ...m, rating: rating ?? 0, watchedAt: Date.now() },
            ...s.watched.filter((x) => x.id !== m.id),
          ],
          watchlist: s.watchlist.filter((x) => x.id !== m.id),
        }));
        get()._push();
      },
      setRating: (id, rating) => {
        set((s) => ({ watched: s.watched.map((x) => (x.id === id ? { ...x, rating } : x)) }));
        get()._push();
      },
      removeMovie: (list, id) => {
        set((s) => ({ [list]: s[list].filter((x) => x.id !== id) }));
        get()._push();
      },

      pullFromCloud: async () => {
        const sb = supabase();
        if (!sb) return false;
        const { syncKey } = get();
        if (!syncKey) return false;
        const { data, error } = await sb.from("lists").select("*").eq("sync_key", syncKey).single();
        if (error && error.code !== "PGRST116") {
          console.log("Sync fetch error:", error.message);
          return false;
        }
        if (data) {
          set({
            watchlist: Array.isArray(data.watchlist) ? data.watchlist : [],
            watched: Array.isArray(data.watched) ? data.watched : [],
          });
        }
        return true;
      },

      panelOpen: false,
      setPanelOpen: (b) => set({ panelOpen: b }),

      videoStageOpen: false,
      setVideoStageOpen: (b) => set({ videoStageOpen: b }),

      toast: null,
      setToast: (t) => set({ toast: t }),

      _push: () => {
        debouncePush(() => {
          const sb = supabase();
          if (!sb) return;
          const { syncKey, watchlist, watched } = get();
          if (!syncKey) return;
          void sb.from("lists").upsert({
            sync_key: syncKey,
            watchlist,
            watched,
            updated_at: new Date().toISOString(),
          });
        });
      },
    }),
    {
      name: "indrisma-store",
      skipHydration: true,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage
      ),
      partialize: (s) => ({
        volume: s.volume,
        muted: s.muted,
        autoSync: s.autoSync,
        sceneId: s.sceneId,
        currentChannelId: s.currentChannelId,
        watchlist: s.watchlist,
        watched: s.watched,
        customBg: s.customBg,
        bgMode: s.bgMode,
        syncKey: s.syncKey,
        knownKeys: s.knownKeys,
      }),
    }
  )
);
