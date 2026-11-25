"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { SCENE_CFG } from "@/lib/scenes";

function useReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function ImageBackground({ url }: { url: string }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 scale-110 bg-cover bg-center blur-md"
      style={{ backgroundImage: `url(${url})` }}
    />
  );
}

function HorizonLine({ cfg }: { cfg: (typeof SCENE_CFG)[string] }) {
  const w = 1600;
  const h = 900;
  const yBase = h * cfg.y;
  const layers = 3;
  let paths = "";
  for (let l = 0; l < layers; l++) {
    const amp = cfg.amp * (1 - l * 0.22);
    const opacity = (0.5 - l * 0.14).toFixed(2);
    let d = `M0 ${yBase + l * 18}`;
    for (let x = 0; x <= w; x += 32) {
      const y = yBase + l * 18 + Math.sin(x * 0.012 + l * 1.3) * amp;
      d += ` L${x} ${y.toFixed(1)}`;
    }
    paths += `<path d="${d}" fill="none" stroke="${cfg.line}" stroke-width="${(1.3 - l * 0.15).toFixed(2)}" opacity="${opacity}"/>`;
  }
  const glow = `<ellipse cx="${w / 2}" cy="${yBase}" rx="620" ry="90" fill="${cfg.line}" opacity="0.06" filter="blur(40px)"/>`;
  const svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${glow}<g class="horizon-line">${paths}</g></svg>`;
  return <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Two silhouettes sharing one umbrella in the rain (rain scene only). */
function RainCouple() {
  const canopy =
    "M70 118 Q210 -24 350 118 " +
    "Q326.7 98 303.3 118 Q280 98 256.7 118 Q233.3 98 210 118 " +
    "Q186.7 98 163.3 118 Q140 98 116.7 118 Q93.3 98 70 118 Z";
  const body = "rgba(7, 11, 18, 0.94)";

  return (
    <div
      className="animate-rise pointer-events-none absolute left-[60%] z-[1] -translate-x-1/2"
      style={{ bottom: "calc(48vh - 26px)", height: "min(32vh, 300px)" }}
      aria-hidden
    >
      <svg viewBox="0 0 420 340" style={{ height: "100%", width: "auto" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="rainc-glow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="rgba(125,211,252,0.20)" />
            <stop offset="55%" stopColor="rgba(125,211,252,0.07)" />
            <stop offset="100%" stopColor="rgba(125,211,252,0)" />
          </radialGradient>
          <linearGradient id="rainc-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(125,211,252,0.16)" />
            <stop offset="100%" stopColor="rgba(125,211,252,0)" />
          </linearGradient>
          <filter id="rainc-blur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.6" />
          </filter>
        </defs>

        <ellipse cx="210" cy="165" rx="200" ry="158" fill="url(#rainc-glow)" />

        <g transform="translate(0 576) scale(1 -1)" opacity="0.13" filter="url(#rainc-blur)">
          <path d={canopy} fill={body} />
          <ellipse cx="190" cy="152" rx="13.5" ry="15.5" fill={body} transform="rotate(-9 190 152)" />
          <ellipse cx="224" cy="162" rx="12" ry="14" fill={body} transform="rotate(11 224 162)" />
          <path d="M190 170 L186 288" stroke={body} strokeWidth="23" strokeLinecap="round" />
          <path d="M222 184 L225 288" stroke={body} strokeWidth="20" strokeLinecap="round" />
          <path d="M210 118 L210 258" stroke={body} strokeWidth="4" strokeLinecap="round" />
        </g>

        <rect x="60" y="289" width="300" height="46" fill="url(#rainc-fade)" opacity="0.5" />

        <path d={canopy} fill={body} />
        <path d="M210 44 L210 26" stroke={body} strokeWidth="4" strokeLinecap="round" />
        <circle cx="210" cy="24" r="3" fill={body} />

        <path
          d="M210 118 L210 256 Q210 284 192 284 Q178 284 178 272"
          fill="none"
          stroke={body}
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        <ellipse cx="190" cy="152" rx="13.5" ry="15.5" fill={body} transform="rotate(-9 190 152)" />
        <path d="M190 170 L186 288" stroke={body} strokeWidth="23" strokeLinecap="round" />

        <ellipse cx="224" cy="162" rx="12" ry="14" fill={body} transform="rotate(11 224 162)" />
        <path d="M222 184 L225 288" stroke={body} strokeWidth="20" strokeLinecap="round" />

        <path d="M195 182 Q207 186 215 197" fill="none" stroke={body} strokeWidth="7.5" strokeLinecap="round" />
        <path d="M219 186 Q213 162 210 143" fill="none" stroke={body} strokeWidth="7.5" strokeLinecap="round" />

        <ellipse cx="208" cy="288" rx="64" ry="5.5" fill="rgba(0,0,0,0.4)" />
      </svg>
    </div>
  );
}

function Particles({ type, color }: { type: string; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = 1;
    let h = 1;
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = canvas.width = Math.max(1, Math.round(rect.width));
      h = canvas.height = Math.max(1, Math.round(rect.height));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("resize", resize);

    const count = type === "rain" ? 120 : type === "stars" ? 70 : type === "snow" ? 70 : 30;
    const parts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r:
        type === "stars"
          ? 0.6 + Math.random() * 1.2
          : type === "snow"
            ? 1 + Math.random() * 1.8
            : type === "fireflies"
              ? 1.3 + Math.random() * 1.3
              : 0,
      len: type === "rain" ? 9 + Math.random() * 12 : 0,
      speed:
        type === "rain"
          ? 6 + Math.random() * 5
          : type === "snow"
            ? 0.35 + Math.random() * 0.5
            : 0.12 + Math.random() * 0.16,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.3,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const t = performance.now() / 1000;
      parts.forEach((p) => {
        if (type === "rain") {
          ctx.strokeStyle = "rgba(200,220,255,0.55)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 3, p.y + p.len);
          ctx.stroke();
          p.y += p.speed;
          if (p.y > h) {
            p.y = -p.len;
            p.x = Math.random() * w;
          }
        } else if (type === "snow") {
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.speed;
          p.x += Math.sin(t + p.phase) * 0.25;
          if (p.y > h) {
            p.y = -4;
            p.x = Math.random() * w;
          }
        } else if (type === "stars") {
          const tw = 0.35 + Math.sin(t * 1.1 + p.phase) * 0.35;
          ctx.fillStyle = color;
          ctx.globalAlpha = Math.max(0.15, tw);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          const glow = Math.max(0.08, 0.4 + Math.sin(t * 1.4 + p.phase) * 0.4);
          ctx.fillStyle = `rgba(220,255,150,${glow})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          p.x += p.drift;
          p.y += Math.sin(t + p.phase) * 0.12;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [type, color, reduced]);

  return <canvas ref={ref} className="absolute inset-0 z-[2] block h-full w-full" />;
}

function AmbientScene({ sceneId }: { sceneId: string }) {
  const cfg = SCENE_CFG[sceneId] || SCENE_CFG.nebula;
  const isRain = cfg.id === "rain";
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ background: cfg.bg }}>
      <HorizonLine cfg={cfg} />
      {isRain && <RainCouple />}
      {cfg.particles && <Particles type={cfg.particles} color={cfg.line} />}
      {isRain && <div className="rain-flash absolute inset-0 z-[3]" aria-hidden />}
    </div>
  );
}

export default function BackgroundScene() {
  const sceneId = useStore((s) => s.sceneId);
  const bgMode = useStore((s) => s.bgMode);
  const customBg = useStore((s) => s.customBg);

  if (bgMode === "image" && customBg) return <ImageBackground url={customBg} />;
  return <AmbientScene sceneId={sceneId} />;
}
