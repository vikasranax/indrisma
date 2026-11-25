import { Waves, Droplet, Gem, TreePine, Mountain, CloudRain, Sparkles, type LucideIcon } from "lucide-react";

export type ParticleKind = "stars" | "snow" | "rain" | "fireflies";

export interface SceneConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  bg: string;
  line: string;
  y: number;
  amp: number;
  particles: ParticleKind | null;
  aura: [string, string];
}

export const SCENE_CFG: Record<string, SceneConfig> = {
  nebula: {
    id: "nebula", label: "Nebula", icon: Sparkles,
    bg: "radial-gradient(120% 100% at 50% 30%, #2a1348 0%, #150a2e 40%, #06040f 100%)",
    line: "#c084fc", y: 0.45, amp: 14, particles: "stars", aura: ["#c084fc", "#e8b458"],
  },
  river: {
    id: "river", label: "River", icon: Waves,
    bg: "radial-gradient(120% 90% at 50% 100%, #0d2a26 0%, #051512 45%, #030808 100%)",
    line: "#2dd4bf", y: 0.72, amp: 10, particles: null, aura: ["#2dd4bf", "#a7f3d0"],
  },
  ocean: {
    id: "ocean", label: "Ocean", icon: Droplet,
    bg: "radial-gradient(120% 90% at 50% 0%, #0a1a33 0%, #050c1a 45%, #030509 100%)",
    line: "#38bdf8", y: 0.4, amp: 18, particles: "stars", aura: ["#38bdf8", "#67e8f9"],
  },
  glacier: {
    id: "glacier", label: "Glacier", icon: Gem,
    bg: "radial-gradient(120% 90% at 50% 20%, #10262e 0%, #071319 50%, #04090c 100%)",
    line: "#a5f3fc", y: 0.55, amp: 8, particles: "snow", aura: ["#a5f3fc", "#e0f2fe"],
  },
  forest: {
    id: "forest", label: "Forest", icon: TreePine,
    bg: "radial-gradient(120% 90% at 50% 100%, #0e2a16 0%, #061a0d 45%, #030a06 100%)",
    line: "#4ade80", y: 0.68, amp: 9, particles: "fireflies", aura: ["#4ade80", "#bbf7d0"],
  },
  mountain: {
    id: "mountain", label: "Mountain", icon: Mountain,
    bg: "radial-gradient(120% 90% at 50% 100%, #1a2130 0%, #0d1220 45%, #05070c 100%)",
    line: "#94a3b8", y: 0.6, amp: 22, particles: "snow", aura: ["#94a3b8", "#e2e8f0"],
  },
  rain: {
    id: "rain", label: "Rain", icon: CloudRain,
    bg: "radial-gradient(120% 90% at 50% 0%, #101822 0%, #070b12 45%, #04060a 100%)",
    line: "#7dd3fc", y: 0.5, amp: 7, particles: "rain", aura: ["#7dd3fc", "#bae6fd"],
  },
};

export const CHANNEL_SCENE: Record<string, string> = {
  radio: "nebula",
  bollywood: "river",
  alka: "mountain",
  bhojpuri: "rain",
  global: "ocean",
  lofi: "forest",
};

export const SCENE_IDS = Object.keys(SCENE_CFG);
