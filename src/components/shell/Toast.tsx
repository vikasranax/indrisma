"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";

export default function Toast() {
  const toast = useStore((s) => s.toast);
  const setToast = useStore((s) => s.setToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast, setToast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast}
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong pointer-events-none fixed bottom-[150px] left-1/2 z-[95] -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2.5 text-[12px] text-ink shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:bottom-[110px]"
          role="status"
          aria-live="polite"
        >
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-gold align-middle animate-pulse-dot" />
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
