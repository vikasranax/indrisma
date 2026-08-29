import { useStore } from './store';
import { CHANNEL_SCENE } from './scenes';
import { getChannel, FALLBACK_QUEUE } from './playlistData';

let player = null;
let ready = false;
let pending = null;
let queue = [];
let idx = 0;
let mode = 'video';
let engineStarted = false;
let mutedForAutoplay = false;
let unmuterArmed = false;

// Guards against the "plays the previous click" race: every playChannel/playUrl
// call gets a fresh token. If a newer call comes in before an older one finishes
// loading, the older one's queued work is dropped instead of silently winning.
let loadToken = 0;
let awaitingAutoplayToken = null;
let scriptLoadPromise = null;

const S = () => useStore.getState();

function loadScript() {
  if (typeof window !== 'undefined' && window.YT && window.YT.Player) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev && prev(); resolve(); };
    if (document.getElementById('yt-iframe-api')) return; // already requested once
    const tag = document.createElement('script');
    tag.id = 'yt-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    const first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(tag, first);
  });
  return scriptLoadPromise;
}

function buildPlayer() {
  if (player) return;
  player = new window.YT.Player('yt-hidden-player', {
    height: '0', width: '0',
    playerVars: { autoplay: 1, controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1, iv_load_policy: 3 },
    events: { onReady, onStateChange, onError },
  });
}

function flushPending() {
  if (pending) { const fn = pending; pending = null; fn(); }
}

function onReady() {
  ready = true;
  const { volume, muted } = S();
  player.setVolume(muted ? 0 : volume);
  flushPending();
}

function onStateChange(e) {
  const st = e.data;
  const YT = window.YT;

  // Safety net for the replay race. A channel switch fires SEVERAL lifecycle
  // events in a row (the outgoing video ending/buffering, then the incoming
  // one un-starting, cueing, buffering...). We keep re-asserting play on every
  // one of them — harmless if already playing — and only stand down once we
  // see actual PLAYING for this exact load. Clearing the guard after just the
  // *first* event (the old bug) let the outgoing video's own event satisfy it,
  // leaving the real new video loaded-but-paused until another click nudged it.
  if (awaitingAutoplayToken !== null && awaitingAutoplayToken === loadToken) {
    if (st === YT.PlayerState.CUED || st === YT.PlayerState.UNSTARTED || st === YT.PlayerState.BUFFERING) {
      tryPlay();
    } else if (st === YT.PlayerState.PLAYING) {
      awaitingAutoplayToken = null; // confirmed — stop re-asserting
    }
  }

  if (st === YT.PlayerState.PLAYING) {
    S().setStatus('playing');
    const d = player.getVideoData ? player.getVideoData() : {};
    if (d && d.title) S().setCurrentTrack({ title: d.title, badge: 'Live Stream', videoId: d.video_id || null });
  } else if (st === YT.PlayerState.PAUSED) {
    S().setStatus('paused');
  } else if (st === YT.PlayerState.BUFFERING) {
    S().setStatus('loading');
  } else if (st === YT.PlayerState.ENDED) {
    next();
  }
}

function onError() {
  S().setToast('Track unavailable — skipping…');
  S().setStatus('error');
  setTimeout(next, 600);
}

function loadCurrent() {
  S().setStatus('loading');
  player.loadVideoById(queue[idx]);
}

function shuffleArr(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function armUnmute() {
  if (unmuterArmed || typeof window === 'undefined') return;
  unmuterArmed = true;
  const evs = ['click', 'pointerdown', 'keydown'];
  const un = () => {
    if (mutedForAutoplay && !S().muted && player && ready) {
      try { player.unMute(); player.setVolume(S().volume); player.playVideo(); } catch {}
      mutedForAutoplay = false;
    }
    evs.forEach((ev) => window.removeEventListener(ev, un));
    unmuterArmed = false;
  };
  evs.forEach((ev) => window.addEventListener(ev, un));
}

function tryPlay() {
  if (!player || !ready) return;
  if (engineStarted) {
    try { player.unMute(); player.setVolume(S().muted ? 0 : S().volume); player.playVideo(); } catch {}
    return;
  }
  try {
    player.mute();
    player.playVideo();
    mutedForAutoplay = true;
    armUnmute();
  } catch {}
}

export function parseUrl(url) {
  const video = url.match(/(?:v=|youtu\.be\/|\/embed\/|\/v\/|shorts\/)([A-Za-z0-9_-]{11})/);
  const list = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
  return { videoId: video ? video[1] : null, playlistId: list ? list[1] : null };
}

export async function init() {
  if (typeof window === 'undefined') return;
  if (!document.getElementById('yt-hidden-player')) {
    const div = document.createElement('div');
    div.id = 'yt-hidden-player';
    div.style.position = 'fixed'; div.style.width = '0'; div.style.height = '0';
    div.style.opacity = '0'; div.style.pointerEvents = 'none';
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
      player.unMute();
      player.setVolume(S().muted ? 0 : S().volume);
      player.playVideo();
    } catch {}
    flushPending();
  };
  if (!ready) { init().then(go); return; }
  go();
}

/**
 * 1-click channel switch that always ends up playing the *last* channel you
 * clicked, even if clicks land close together or the load races the player.
 * Pass { gesture: false } only for the initial script-triggered autoplay on
 * page load (no real click behind it), which still needs the muted fallback.
 */
export function playChannel(channelId, { gesture = true } = {}) {
  const ch = getChannel(channelId);
  if (!ch) return;
  const myToken = ++loadToken;

  S().setCurrentChannelId(channelId);
  if (S().autoSync && CHANNEL_SCENE[channelId]) S().setSceneId(CHANNEL_SCENE[channelId]);
  if (gesture) { engineStarted = true; mutedForAutoplay = false; }

  const doLoad = () => {
    if (myToken !== loadToken) return; // superseded by a newer click — drop it
    S().setStatus('loading');
    awaitingAutoplayToken = myToken;
    if (ch.playlistId) {
      mode = 'playlist';
      player.loadPlaylist({ list: ch.playlistId, listType: 'playlist' });
      try { player.setShuffle(true); player.setLoop(true); } catch {}
    } else {
      mode = 'video';
      queue = shuffleArr((ch.seed && ch.seed.length ? ch.seed : FALLBACK_QUEUE).slice());
      idx = 0;
      loadCurrent();
    }
    tryPlay();
  };

  if (!ready) pending = doLoad; else doLoad();
}

/** Pasting a URL is always a real click/Enter-press, so it plays with sound in one shot. */
export function playUrl(url) {
  const { videoId, playlistId } = parseUrl(url || '');
  const myToken = ++loadToken;
  engineStarted = true;
  mutedForAutoplay = false;

  if (playlistId) {
    mode = 'playlist';
    const run = () => {
      if (myToken !== loadToken) return;
      S().setStatus('loading');
      awaitingAutoplayToken = myToken;
      player.loadPlaylist({ list: playlistId });
      try { player.setLoop(true); } catch {}
      tryPlay();
    };
    if (!ready) pending = run; else run();
    S().setCurrentTrack({ title: 'YouTube playlist', badge: 'Live Stream', videoId: null });
  } else if (videoId) {
    mode = 'video'; queue = [videoId]; idx = 0;
    const run = () => {
      if (myToken !== loadToken) return;
      awaitingAutoplayToken = myToken;
      loadCurrent();
      tryPlay();
    };
    if (!ready) pending = run; else run();
  } else {
    S().setToast('Invalid YouTube URL');
  }
}

export function togglePlay() {
  if (!player || !ready) return;
  engineStarted = true;
  if (mutedForAutoplay && !S().muted) {
    try { player.unMute(); player.setVolume(S().volume); } catch {}
    mutedForAutoplay = false;
  }
  const st = player.getPlayerState();
  if (st === window.YT.PlayerState.PLAYING) player.pauseVideo();
  else player.playVideo();
}

export function next() {
  if (!player || !ready) return;
  if (mode === 'playlist') { player.nextVideo(); return; }
  if (!queue.length) return;
  idx = (idx + 1) % queue.length; // wraps forever — infinite loop
  loadCurrent();
}

export function prev() {
  if (!player || !ready) return;
  if (mode === 'playlist') { try { player.previousVideo(); } catch {} return; }
  if (!queue.length) return;
  idx = (idx - 1 + queue.length) % queue.length;
  loadCurrent();
}

export function getProgress() {
  if (!player || !ready) return { current: 0, duration: 0 };
  try { return { current: player.getCurrentTime() || 0, duration: player.getDuration() || 0 }; }
  catch { return { current: 0, duration: 0 }; }
}

export function seek(sec) { if (player && ready) { try { player.seekTo(sec, true); } catch {} } }

export function setVolume(v) {
  if (player && ready) {
    player.setVolume(v);
    if (v > 0) { player.unMute(); mutedForAutoplay = false; }
  }
}
export function applyMute(m) {
  if (player && ready) {
    if (m) player.mute();
    else { player.unMute(); mutedForAutoplay = false; }
  }
}
export const isEngineStarted = () => engineStarted;

const youtubeManager = { init, startEngine, playChannel, playUrl, togglePlay, next, prev, getProgress, seek, setVolume, applyMute, parseUrl, isEngineStarted };
export default youtubeManager;