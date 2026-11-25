"use client";

import { useState } from "react";
import { Link2, ArrowRight } from "lucide-react";
import youtubeManager from "@/lib/youtube";
import { useStore } from "@/lib/store";

export default function PasteUrl() {
  const [url, setUrl] = useState("");
  const setToast = useStore((s) => s.setToast);

  const submit = () => {
    const v = url.trim();
    if (!v) return;
    youtubeManager.playUrl(v);
    setToast("Loading YouTube link");
    setUrl("");
  };

  return (
    <div className="glass flex w-full max-w-sm flex-1 items-center gap-2.5 rounded-full py-1.5 pl-3.5 pr-1.5">
      <Link2 size={12} className="shrink-0 text-muted" aria-hidden />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Paste a YouTube video or playlist"
        aria-label="Paste a YouTube link"
        className="min-w-0 flex-1 bg-transparent font-sans text-[12px] text-ink placeholder:text-muted focus:outline-none"
      />
      <button
        onClick={submit}
        disabled={!url.trim()}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold text-gold-ink transition hover:brightness-110 disabled:opacity-30"
        aria-label="Play link"
      >
        <ArrowRight size={13} />
      </button>
    </div>
  );
}
