'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';

export default function Toast() {
  const msg = useStore((s) => s.toast);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!msg) { setVisible(false); return; }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(t);
  }, [msg]);

  if (!visible) return null;
  return (
    <div className="animate-rise fixed top-6 left-1/2 z-[70] -translate-x-1/2 rounded-full glass-strong px-4 py-2 text-[11px] text-sub shadow-dock">
      {msg}
    </div>
  );
}