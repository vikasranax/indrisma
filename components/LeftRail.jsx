'use client';
import { Waves, Droplet, Gem, TreePine, Mountain, CloudRain, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';

const SCENES = [
  { id: 'nebula',   icon: Sparkles,  label: 'Nebula'   },
  { id: 'river',    icon: Waves,     label: 'River'    },
  { id: 'ocean',    icon: Droplet,   label: 'Ocean'    },
  { id: 'glacier',  icon: Gem,       label: 'Glacier'  },
  { id: 'forest',   icon: TreePine,  label: 'Forest'   },
  { id: 'mountain', icon: Mountain,  label: 'Mountain' },
  { id: 'rain',     icon: CloudRain, label: 'Rain'     },
];

function RailButton({ scene, active, onClick, vertical }) {
  const Icon = scene.icon;
  return (
    <div className="group relative flex items-center">
      <button
        onClick={onClick}
        className={`grid h-10 w-10 place-items-center rounded-full border transition
          ${active
            ? 'border-accent/45 bg-accent/12 text-accent shadow-glow'
            : 'border-white/[0.08] bg-black/25 text-muted hover:text-sub hover:border-white/[0.16]'}`}
        aria-label={scene.label}
      >
        <Icon size={15} strokeWidth={1.75} />
      </button>
      <span
        className={`pointer-events-none absolute whitespace-nowrap rounded-full border border-white/[0.08] bg-black/80 px-3 py-1.5 text-[11px] text-ink opacity-0 transition-all duration-200
          ${vertical ? 'left-13 translate-x-[-6px]' : 'top-13 translate-y-[-6px]'}
          group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0`}
        style={vertical ? { left: '54px' } : { top: '54px' }}
      >
        {scene.label}
      </span>
    </div>
  );
}

export default function LeftRail() {
  const sceneId = useStore((s) => s.sceneId);
  const setSceneId = useStore((s) => s.setSceneId);

  return (
    <>
      <div className="absolute left-6 top-1/2 z-[18] hidden -translate-y-1/2 flex-col gap-3 md:flex">
        {SCENES.map((s) => (
          <RailButton key={s.id} scene={s} active={sceneId === s.id} onClick={() => setSceneId(s.id)} vertical />
        ))}
      </div>

      <div className="no-scrollbar absolute top-[68px] left-1/2 z-[18] flex -translate-x-1/2 gap-2 overflow-x-auto px-4 md:hidden">
        {SCENES.map((s) => (
          <RailButton key={s.id} scene={s} active={sceneId === s.id} onClick={() => setSceneId(s.id)} />
        ))}
      </div>
    </>
  );
}