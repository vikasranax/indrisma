'use client';
import { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, AudioWaveform } from 'lucide-react';
import { useStore } from '@/lib/store';
import youtubeManager from '@/lib/youtubeManager';

export default function Player() {
  const status = useStore((s) => s.status);
  const volume = useStore((s) => s.volume);
  const muted = useStore((s) => s.muted);
  const track = useStore((s) => s.currentTrack);
  const setVolume = useStore((s) => s.setVolume);
  const setMuted = useStore((s) => s.setMuted);

  const [showVol, setShowVol] = useState(false);
  const playing = status === 'playing' || status === 'loading';

  const onPlayPause = () => {
    if (!youtubeManager.isEngineStarted()) { youtubeManager.startEngine(); return; }
    youtubeManager.togglePlay();
  };
  const onVol = (e) => { const v = +e.target.value; setVolume(v); setMuted(v === 0); youtubeManager.setVolume(v); };
  const onMute = () => { const m = !muted; setMuted(m); youtubeManager.applyMute(m); };

  // Keyboard shortcuts: Space/P play-pause, M mute, N/→ next, B/← previous.
  // Disabled while typing in a text field (search, paste-link, sync key, etc).
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space' || e.key === 'p' || e.key === 'P') { e.preventDefault(); onPlayPause(); }
      else if (e.key === 'm' || e.key === 'M') { onMute(); }
      else if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') { youtubeManager.next(); }
      else if (e.key === 'b' || e.key === 'B' || e.key === 'ArrowLeft') { youtubeManager.prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [muted, volume]);

  return (
    <div className="flex items-center gap-4 px-5 pb-2 pt-4 sm:px-8">
      <button onClick={() => youtubeManager.prev()} className="icon-btn h-9 w-9" aria-label="Previous">
        <SkipBack size={14} fill="currentColor" />
      </button>
      <button
        onClick={onPlayPause}
        className="grid h-12 w-12 place-items-center rounded-full border border-white/[0.14] bg-black/35 text-ink backdrop-blur transition hover:scale-105 hover:border-accent/40"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" className="ml-0.5" />}
      </button>
      <button onClick={() => youtubeManager.next()} className="icon-btn h-9 w-9" aria-label="Next">
        <SkipForward size={14} fill="currentColor" />
      </button>

      <div className="ml-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 truncate text-[13px] font-medium text-ink">
          {playing && <AudioWaveform size={13} className="shrink-0 text-accent" />}
          <span className="truncate">{track.title}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-sub">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
          {track.badge || 'Live Stream'}
        </div>
      </div>

      <div
        className="hidden items-center gap-2 sm:flex"
        onMouseEnter={() => setShowVol(true)}
        onMouseLeave={() => setShowVol(false)}
      >
        <button onClick={onMute} className="icon-btn h-9 w-9" aria-label="Mute">
          {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <input
          type="range" min={0} max={100} value={muted ? 0 : volume} onChange={onVol}
          className={`seek transition-all duration-200 ${showVol ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}
        />
      </div>
    </div>
  );
}