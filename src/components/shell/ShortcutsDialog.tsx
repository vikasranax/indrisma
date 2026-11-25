"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "Playback",
    items: [
      ["Space / P", "Play or pause"],
      ["M", "Mute or unmute"],
      ["← / →", "Seek ±10s (videos)"],
      ["V", "Full-screen player"],
    ],
  },
  {
    title: "Interface",
    items: [
      ["F", "Search films"],
      ["?", "This shortcuts panel"],
      ["Esc", "Close panels"],
    ],
  },
];

export default function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-w-sm rounded-2xl border-line bg-[#0d0c0a] text-ink sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-medium tracking-[0.02em]">
            Keyboard shortcuts
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-sub">
            Shortcuts pause automatically while you type in any field.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-5">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <div className="mono-label mb-2.5">{g.title}</div>
              <ul className="space-y-2">
                {g.items.map(([k, d]) => (
                  <li key={k} className="flex items-center justify-between gap-4 text-[13px]">
                    <kbd className="rounded-md border border-line bg-white/[0.05] px-2 py-1 font-mono text-[11px] text-gold">
                      {k}
                    </kbd>
                    <span className="text-right text-sub">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
