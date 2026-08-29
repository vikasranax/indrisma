'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as storeModule from '@/lib/store';
import { getChannel } from '@/lib/playlistData';

const useStore =
  storeModule.useStore ||
  storeModule.default?.useStore ||
  storeModule.default;

function useReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function ImageBackground({ url }) {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center blur-md scale-110"
      style={{ backgroundImage: `url(${url})` }}
    />
  );
}

// Each scene: a background wash + one soft glowing horizon line, tinted differently.
const SCENE_CFG = {
  river:    { bg: 'radial-gradient(120% 90% at 50% 100%, #0d2a26 0%, #051512 45%, #030808 100%)', line: '#2dd4bf', y: 0.72, amp: 10, particles: null },
  ocean:    { bg: 'radial-gradient(120% 90% at 50% 0%, #0a1a33 0%, #050c1a 45%, #030509 100%)',   line: '#38bdf8', y: 0.4,  amp: 18, particles: 'stars' },
  glacier:  { bg: 'radial-gradient(120% 90% at 50% 20%, #10262e 0%, #071319 50%, #04090c 100%)',  line: '#a5f3fc', y: 0.55, amp: 8,  particles: 'snow' },
  forest:   { bg: 'radial-gradient(120% 90% at 50% 100%, #0e2a16 0%, #061a0d 45%, #030a06 100%)', line: '#4ade80', y: 0.68, amp: 9,  particles: 'fireflies' },
  mountain: { bg: 'radial-gradient(120% 90% at 50% 100%, #1a2130 0%, #0d1220 45%, #05070c 100%)', line: '#94a3b8', y: 0.6,  amp: 22, particles: 'snow' },
  rain:     { bg: 'radial-gradient(120% 90% at 50% 0%, #101822 0%, #070b12 45%, #04060a 100%)',   line: '#7dd3fc', y: 0.5,  amp: 7,  particles: 'rain' },
  nebula:   { bg: 'radial-gradient(120% 100% at 50% 30%, #2a1348 0%, #150a2e 40%, #06040f 100%)', line: '#c084fc', y: 0.45, amp: 14, particles: 'stars' },
};

function HorizonLine({ cfg }) {
  const w = 1600, h = 900, yBase = h * cfg.y;
  const layers = 3;
  let paths = '';
  for (let l = 0; l < layers; l++) {
    const amp = cfg.amp * (1 - l * 0.22);
    const opacity = (0.5 - l * 0.14).toFixed(2);
    let d = `M0 ${yBase + l * 18}`;
    for (let x = 0; x <= w; x += 32) {
      const y = yBase + l * 18 + Math.sin(x * 0.012 + l * 1.3) * amp;
      d += ` L${x} ${y.toFixed(1)}`;
    }
    paths += `<path d="${d}" fill="none" stroke="${cfg.line}" stroke-width="${1.3 - l * 0.15}" opacity="${opacity}"/>`;
  }
  const glow = `<ellipse cx="${w / 2}" cy="${yBase}" rx="620" ry="90" fill="${cfg.line}" opacity="0.05" filter="blur(40px)"/>`;
  const svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${glow}<g class="horizon-line">${paths}</g></svg>`;
  return <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Particles({ type, color }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let w, h, raf;

    // Read the canvas's actual rendered box size (not just once on mount —
    // a ResizeObserver catches cases where the fixed-position parent hasn't
    // finished laying out yet, which previously left the canvas locked to a
    // stale/partial size and made particles bunch into one corner).
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = canvas.width = Math.max(1, Math.round(rect.width));
      h = canvas.height = Math.max(1, Math.round(rect.height));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('resize', resize);

    const count = type === 'rain' ? 120 : type === 'stars' ? 70 : type === 'snow' ? 70 : 30;
    const parts = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: type === 'stars' ? 0.6 + Math.random() * 1.2 : type === 'snow' ? 1 + Math.random() * 1.8 : type === 'fireflies' ? 1.3 + Math.random() * 1.3 : 0,
      len: type === 'rain' ? 9 + Math.random() * 12 : 0,
      speed: type === 'rain' ? 6 + Math.random() * 5 : type === 'snow' ? 0.35 + Math.random() * 0.5 : 0.12 + Math.random() * 0.16,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.3,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const t = performance.now() / 1000;
      parts.forEach((p) => {
        if (type === 'rain') {
          ctx.strokeStyle = 'rgba(200,220,255,0.55)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3, p.y + p.len); ctx.stroke();
          p.y += p.speed; if (p.y > h) { p.y = -p.len; p.x = Math.random() * w; }
        } else if (type === 'snow') {
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
          p.y += p.speed; p.x += Math.sin(t + p.phase) * 0.25;
          if (p.y > h) { p.y = -4; p.x = Math.random() * w; }
        } else if (type === 'stars') {
          const tw = 0.35 + Math.sin(t * 1.1 + p.phase) * 0.35;
          ctx.fillStyle = `${color}`; ctx.globalAlpha = Math.max(0.15, tw);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          const glow = Math.max(0.08, 0.4 + Math.sin(t * 1.4 + p.phase) * 0.4);
          ctx.fillStyle = `rgba(220,255,150,${glow})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
          p.x += p.drift; p.y += Math.sin(t + p.phase) * 0.12;
          if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('resize', resize); };
  }, [type, color, reduced]);

  return <canvas ref={ref} className="absolute inset-0 block h-full w-full" />;
}

function AmbientScene({ sceneId }) {
  const cfg = SCENE_CFG[sceneId] || SCENE_CFG.river;
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{ background: cfg.bg }}>
      <HorizonLine cfg={cfg} />
      {cfg.particles && <Particles type={cfg.particles} color={cfg.line} />}
    </div>
  );
}

export default function BackgroundScene() {
  const { sceneId, bgMode, customBg, currentChannelId } = useStore();
  const channel = useMemo(
    () => (currentChannelId ? getChannel(currentChannelId) : null),
    [currentChannelId]
  );

  if (bgMode === 'image' && customBg) return <ImageBackground url={customBg} />;
  if (channel && channel.bg) return <ImageBackground url={channel.bg} />;
  return <AmbientScene sceneId={sceneId} />;
}