'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import youtubeManager from '@/lib/youtubeManager';
import BackgroundScene from '@/components/BackgroundScene';
import TopBar from '@/components/TopBar';
import LeftRail from '@/components/LeftRail';
import Player from '@/components/Player';
import ChannelBar from '@/components/ChannelBar';
import PasteUrl from '@/components/PasteUrl';
import MoviePanel from '@/components/MoviePanel';
import Toast from '@/components/Toast';

export default function Page() {
  const [showMovies, setShowMovies] = useState(false);

  useEffect(() => {
    youtubeManager.init().then(() => {
      // Not a real click — browsers block unmuted autoplay here, so this keeps
      // the muted-then-arm-on-first-gesture fallback. Every real click elsewhere
      // (ChannelBar, PasteUrl) plays unmuted immediately in one click.
      youtubeManager.playChannel('radio', { gesture: false });
    });
    const { syncKey, pullFromCloud } = useStore.getState();
    if (syncKey) pullFromCloud();
  }, []);

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden font-sans text-ink">
      <BackgroundScene />
      <div className="pointer-events-none fixed inset-0 z-[2] grain" />
      <div
        className="pointer-events-none fixed inset-0 z-[2]"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, transparent 20%, transparent 65%, rgba(0,0,0,.55) 100%)' }}
      />

      <div className="relative z-10 h-full">
        <TopBar onOpenMovies={() => setShowMovies(true)} />
        <LeftRail />
        <div className="absolute inset-x-0 bottom-0 z-[15]">
          <Player />
          <ChannelBar />
        </div>
        <PasteUrl />
        <MoviePanel open={showMovies} onClose={() => setShowMovies(false)} />
        <Toast />
      </div>
    </main>
  );
}