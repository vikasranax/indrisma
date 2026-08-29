'use client';
import { useState } from 'react';
import { Link2, ArrowRight, X } from 'lucide-react';
import youtubeManager from '@/lib/youtubeManager';
import { useStore } from '@/lib/store';

export default function PasteUrl() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const setToast = useStore((s) => s.setToast);

  const submit = () => {
    if (!url.trim()) return;
    youtubeManager.playUrl(url.trim());
    setToast('Loading YouTube link…');
    setUrl('');
    setOpen(false);
  };

  return (
    <div className="absolute bottom-[104px] right-5 z-[25] flex items-center gap-2 sm:right-8">
      {open && (
        <div className="animate-rise flex items-center gap-2 rounded-full glass-strong py-1.5 pl-4 pr-1.5 shadow-dock">
          <Link2 size={12} className="shrink-0 text-muted" />
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
            placeholder="Paste a YouTube video or playlist link…"
            className="w-40 bg-transparent text-[12px] text-ink placeholder:text-muted focus:outline-none sm:w-64"
          />
          <button
            onClick={submit}
            disabled={!url.trim()}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-accent-ink transition disabled:opacity-30"
            aria-label="Play link"
          >
            <ArrowRight size={12} />
          </button>
          <button onClick={() => setOpen(false)} className="icon-btn h-5 w-5 shrink-0 border-0 bg-transparent" aria-label="Close">
            <X size={12} />
          </button>
        </div>
      )}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="icon-btn h-11 w-11"
          aria-label="Paste a YouTube link"
          title="Paste a YouTube link"
        >
          <Link2 size={16} strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}