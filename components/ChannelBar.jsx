'use client';
import { CHANNELS } from '@/lib/playlistData';
import { useStore } from '@/lib/store';
import youtubeManager from '@/lib/youtubeManager';

export default function ChannelBar() {
  const channelId = useStore((s) => s.currentChannelId);

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-5 pt-1 sm:px-8">
      {CHANNELS.map((c) => (
        <button
          key={c.id}
          onClick={() => youtubeManager.playChannel(c.id)}
          className={`pill shrink-0 ${c.id === channelId ? 'is-active' : ''}`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}