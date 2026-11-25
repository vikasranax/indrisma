interface YTPlayer {
  loadVideoById(id: string): void;
  loadPlaylist(o: { list: string; listType?: string }): void;
  playVideo(): void;
  pauseVideo(): void;
  nextVideo(): void;
  previousVideo(): void;
  mute(): void;
  unMute(): void;
  setVolume(v: number): void;
  setShuffle(b: boolean): void;
  setLoop(b: boolean): void;
  seekTo(sec: number, allowSeekAhead: boolean): void;
  getPlayerState(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoData(): { title?: string; video_id?: string };
}

interface YTApi {
  Player: new (
    el: string,
    opts: {
      height: string;
      width: string;
      playerVars: Record<string, number>;
      events: {
        onReady: () => void;
        onStateChange: (e: { data: number }) => void;
        onError: () => void;
      };
    }
  ) => YTPlayer;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}

declare global {
  interface Window {
    YT?: YTApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

import { useStore } from "./store";
import { CHANNEL_SCENE } from "./scenes";
import { getChannel, FALLBACK_QUEUE } from "./channels";

let player: YTPlayer | null = null;
let ready = false;
let pending: (() => void) | null = null;
let queue: string[] = [];
let idx = 0;
let mode: "video" | "playlist" = "video";
let engineStarted = false;
let mutedForAutoplay = false;
let unmuterArmed = false;

let loadToken = 0;
let awaitingAutoplayToken: number | null = null;
let scriptLoadPromise: Promise<void> | null = null;

const S = () => useStore.getState();

function loadScript(): Promise<void> {
  if (typeof window !== "undefined" && window.YT && window.YT.Player) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve();
    };
    if (document.getElementById("yt-iframe-api")) return;
    const tag = document.createElement("script");
    tag.id = "yt-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    const first = document.getElementsByTagName("script")[0];
    if (first && first.parentNode) first.parentNode.insertBefore(tag, first);
    else document.head.appendChild(tag);
  });
  return scriptLoadPromise;
}

function buildPlayer() {
  if (player) return;
  player = new window.YT!.Player("yt-hidden-player", {
    height: "0",
    width: "0",
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
      iv_load_policy: 3,
    },
    events: {
      onReady: () => {
        ready = true;
        const { volume, muted } = S();
        player!.setVolume(muted ? 0 : volume);
        if (pending) {
          const fn = pending;
          pending = null;
          fn();
        }
      },
      onStateChange: (e) => {
        const st = e.data;
        const YT = window.YT!;

        if (awaitingAutoplayToken !== null && awaitingAutoplayToken === loadToken) {
          if (
            st === YT.PlayerState.CUED ||
            st === YT.PlayerState.UNSTARTED ||
            st === YT.PlayerState.BUFFERING
          ) {
            tryPlay();
          } else if (st === YT.PlayerState.PLAYING) {
            awaitingAutoplayToken = null;
          }
        }

        if (st === YT.PlayerState.PLAYING) {
          S().setStatus("playing");
          const d = player!.getVideoData ? player!.getVideoData() : {};
          if (d && d.title)
            S().setCurrentTrack({
              title: d.title,
              badge: "Live Stream",
              videoId: d.video_id || null,
            });
        } else if (st === YT.PlayerState.PAUSED) {
          S().setStatus("paused");
        } else if (st === YT.PlayerState.BUFFERING) {
          S().setStatus("loading");
        } else if (st === YT.PlayerState.ENDED) {
          next();
        }
      },
      onError: () => {
        S().setToast("Track unavailable — skipping");
        S().setStatus("error");
        setTimeout(() => next(), 600);
      },
    },
  });
}

function tryPlay() {
  if (!player || !ready) return;
  if (engineStarted) {
    try {
      player.unMute();
      player.setVolume(S().muted ? 0 : S().volume);
      player.playVideo();
    } catch {
      /* noop */
    }
    return;
  }
  try {
    player.mute();
    player.playVideo();
    mutedForAutoplay = true;
    armUnmute();
  } catch {
    /* noop */
  }
}

function armUnmute() {
  if (unmuterArmed || typeof window === "undefined") return;
  unmuterArmed = true;
  const evs = ["click", "pointerdown", "keydown"] as const;
  const un = () => {
    if (mutedForAutoplay && !S().muted && player && ready) {
      try {
        player.unMute();
        player.setVolume(S().volume);
        player.playVideo();
      } catch {
        /* noop */
      }
      mutedForAutoplay = false;
    }
    evs.forEach((ev) => window.removeEventListener(ev, un));
    unmuterArmed = false;
  };
  evs.forEach((ev) => window.addEventListener(ev, un));
}

function loadCurrent() {
  S().setStatus("loading");
  player!.loadVideoById(queue[idx]);
}

function shuffleArr(a: string[]): string[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function parseUrl(url: string): { videoId: string | null; playlistId: string | null } {
  const video = url.match(/(?:v=|youtu\.be\/|\/embed\/|\/v\/|shorts\/)([A-Za-z0-9_-]{11})/);
  const list = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
  return { videoId: video ? video[1] : null, playlistId: list ? list[1] : null };
}

export async function init() {
  if (typeof window === "undefined") return;
  if (!document.getElementById("yt-hidden-player")) {
    const div = document.createElement("div");
    div.id = "yt-hidden-player";
    div.style.position = "fixed";
    div.style.width = "0";
    div.style.height = "0";
    div.style.opacity = "0";
    div.style.pointerEvents = "none";
    document.body.appendChild(div);
  }
  await loadScript();
  buildPlayer();
}

export function startEngine() {
  engineStarted = true;
  mutedForAutoplay = false;
  const go = () => {
    try {
      player!.unMute();
      player!.setVolume(S().muted ? 0 : S().volume);
      player!.playVideo();
    } catch {
      /* noop */
    }
    if (pending) {
      const fn = pending;
      pending = null;
      fn();
    }
  };
  if (!ready) {
    void init().then(go);
    return;
  }
  go();
}

export function playChannel(channelId: string, { gesture = true } = {}) {
  const ch = getChannel(channelId);
  if (!ch) return;
  const myToken = ++loadToken;

  S().setCurrentChannelId(channelId);
  if (S().autoSync && CHANNEL_SCENE[channelId]) S().setSceneId(CHANNEL_SCENE[channelId]);
  if (gesture) {
    engineStarted = true;
    mutedForAutoplay = false;
  }

  const doLoad = () => {
    if (myToken !== loadToken) return;
    S().setStatus("loading");
    awaitingAutoplayToken = myToken;
    if (ch.playlistId) {
      mode = "playlist";
      player!.loadPlaylist({ list: ch.playlistId, listType: "playlist" });
      try {
        player!.setShuffle(true);
        player!.setLoop(true);
      } catch {
        /* noop */
      }
    } else {
      mode = "video";
      queue = shuffleArr((ch.seed && ch.seed.length ? ch.seed : FALLBACK_QUEUE).slice());
      idx = 0;
      loadCurrent();
    }
    tryPlay();
  };

  if (!ready) pending = doLoad;
  else doLoad();
}

export function playUrl(url: string) {
  const { videoId, playlistId } = parseUrl(url || "");
  const myToken = ++loadToken;
  engineStarted = true;
  mutedForAutoplay = false;

  if (playlistId) {
    mode = "playlist";
    const run = () => {
      if (myToken !== loadToken) return;
      S().setStatus("loading");
      awaitingAutoplayToken = myToken;
      player!.loadPlaylist({ list: playlistId });
      try {
        player!.setShuffle(true);
        player!.setLoop(true);
      } catch {
        /* noop */
      }
      tryPlay();
    };
    if (!ready) pending = run;
    else run();
    S().setCurrentTrack({ title: "YouTube playlist", badge: "Live Stream", videoId: null });
  } else if (videoId) {
    mode = "video";
    queue = [videoId];
    idx = 0;
    const run = () => {
      if (myToken !== loadToken) return;
      awaitingAutoplayToken = myToken;
      loadCurrent();
      tryPlay();
    };
    if (!ready) pending = run;
    else run();
  } else {
    S().setToast("Invalid YouTube URL");
  }
}

export function togglePlay() {
  if (!player || !ready) return;
  engineStarted = true;
  if (mutedForAutoplay && !S().muted) {
    try {
      player.unMute();
      player.setVolume(S().volume);
    } catch {
      /* noop */
    }
    mutedForAutoplay = false;
  }
  const st = player.getPlayerState();
  if (st === window.YT!.PlayerState.PLAYING) player.pauseVideo();
  else player.playVideo();
}

export function next() {
  if (!player || !ready) return;
  if (mode === "playlist") {
    player.nextVideo();
    return;
  }
  if (!queue.length) return;
  if (queue.length > 1) {
    let n = idx;
    while (n === idx) n = Math.floor(Math.random() * queue.length);
    idx = n;
  }
  loadCurrent();
}

export function getProgress(): { current: number; duration: number } {
  if (!player || !ready) return { current: 0, duration: 0 };
  try {
    return {
      current: player.getCurrentTime() || 0,
      duration: player.getDuration() || 0,
    };
  } catch {
    return { current: 0, duration: 0 };
  }
}

export function seek(sec: number) {
  if (player && ready) {
    try {
      player.seekTo(sec, true);
    } catch {
      /* noop */
    }
  }
}

export function setVolume(v: number) {
  if (player && ready) {
    player.setVolume(v);
    if (v > 0) {
      player.unMute();
      mutedForAutoplay = false;
    }
  }
}

export function applyMute(m: boolean) {
  if (player && ready) {
    if (m) player.mute();
    else {
      player.unMute();
      mutedForAutoplay = false;
    }
  }
}

export const isEngineStarted = () => engineStarted;

export function isLiveTrack(): boolean {
  const { duration } = getProgress();
  return !duration || !Number.isFinite(duration) || duration > 86400;
}

const youtubeManager = {
  init,
  startEngine,
  playChannel,
  playUrl,
  togglePlay,
  next,
  getProgress,
  seek,
  setVolume,
  applyMute,
  parseUrl,
  isEngineStarted,
  isLiveTrack,
};
export default youtubeManager;
