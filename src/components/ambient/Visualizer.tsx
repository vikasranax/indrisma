"use client";

import { useEffect, useRef } from "react";
import type { PlaybackStatus } from "@/lib/store";

interface VisualizerProps {
  colors: [string, string];
  status: PlaybackStatus;
  mirrored?: boolean;
  className?: string;
}

/** Aurora visualizer: smoothed sine-noise bars that breathe with playback state (ambience, not real FFT). */
export default function Visualizer({ colors, status, mirrored = true, className = "" }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 1;
    let h = 1;
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const BAR_COUNT = 64;
    const seeds = Array.from({ length: BAR_COUNT }, (_, i) => ({
      a: (i * 0.37 + 1.3) % (Math.PI * 2),
      b: (i * 0.11 + 4.1) % (Math.PI * 2),
      c: (i * 0.53 + 0.7) % (Math.PI * 2),
    }));

    const targetFor = () => {
      switch (statusRef.current) {
        case "playing":
          return 1;
        case "loading":
          return 0.55;
        case "paused":
          return 0.16;
        default:
          return 0.22;
      }
    };
    let amp = targetFor();

    const draw = () => {
      const t = performance.now() / 1000;
      amp += (targetFor() - amp) * 0.03;

      ctx.clearRect(0, 0, w, h);
      const baseline = mirrored ? h * 0.62 : h * 0.9;
      const maxBar = baseline * 0.82;
      const barW = w / BAR_COUNT;

      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);

      const values: number[] = [];
      for (let i = 0; i < BAR_COUNT; i++) {
        const s = seeds[i];
        if (reduced) {
          values.push(0.3 + 0.12 * Math.sin(i * 0.6 + 1.2));
          continue;
        }
        const n =
          0.5 +
          0.28 * Math.sin(t * 1.7 + s.a) +
          0.16 * Math.sin(t * 3.1 + s.b) +
          0.12 * Math.sin(t * 5.3 + s.c) +
          0.1 * Math.sin(i * 0.42);
        const edge = Math.sin((i / (BAR_COUNT - 1)) * Math.PI) ** 0.7;
        values.push(Math.max(0.05, n * edge));
      }

      ctx.fillStyle = grad;
      ctx.shadowColor = colors[0];
      ctx.shadowBlur = 12;

      for (let i = 0; i < BAR_COUNT; i++) {
        const bh = Math.max(2, values[i] * maxBar * amp);
        const x = i * barW + barW * 0.18;
        const bw = barW * 0.64;
        const r = Math.min(bw / 2, 3);
        const y = baseline - bh;
        ctx.beginPath();
        ctx.moveTo(x, baseline);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.lineTo(x + bw - r, y);
        ctx.arcTo(x + bw, y, x + bw, y + r, r);
        ctx.lineTo(x + bw, baseline);
        ctx.closePath();
        ctx.fill();

        if (mirrored) {
          ctx.globalAlpha = 0.16;
          ctx.beginPath();
          ctx.moveTo(x, baseline);
          ctx.lineTo(x, baseline + bh * 0.42);
          ctx.lineTo(x + bw, baseline + bh * 0.42);
          ctx.lineTo(x + bw, baseline);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(0, baseline, w, 1);

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [colors, mirrored]);

  return <canvas ref={canvasRef} aria-hidden className={`block h-full w-full ${className}`} />;
}
