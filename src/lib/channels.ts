// A channel is either a real YouTube playlist (playlistId) or a shuffled
// list of video IDs (seed). A channel with neither falls back to FALLBACK_QUEUE.
// TODO: put a real playlist ID on "bollywood" (the old one was truncated),
// or paste a playlist link in the app, which works without editing this file.

export interface Channel {
  id: string;
  name: string;
  note: string;
  playlistId?: string;
  seed?: string[];
  art: { wash: string; accent: string; tag: string };
}

export const CHANNELS: Channel[] = [
  {
    id: "radio", name: "Radio", note: "The flagship mix",
    playlistId: "PLVPt7YJKnZJALtkfMhJCuI2jWkaM_jwn8",
    art: { wash: "linear-gradient(140deg, #2b1a4d 0%, #0d0a18 55%, #1a0f08 100%)", accent: "#c084fc", tag: "Signature" },
  },
  {
    id: "bollywood", name: "Bollywood Essentials", note: "Golden-era standards",
    playlistId : "PLY5fKEIEUxyU",
    art: { wash: "linear-gradient(140deg, #4d2410 0%, #180d06 55%, #3a1006 100%)", accent: "#e8b458", tag: "Classics" },
  },
  {
    id: "alka", name: "Alka Nostalgia", note: "The 90s, softly",
    playlistId: "PLVPt7YJKnZJAeL4Qbh0Vx4-V208-hbGMZ",
    art: { wash: "linear-gradient(140deg, #401722 0%, #160a0d 55%, #2b0d1c 100%)", accent: "#fb7185", tag: "Melody" },
  },
  {
    id: "bhojpuri", name: "Bhojpuri Hits", note: "Full-throttle folk",
    playlistId: "PLVPt7YJKnZJDA5lulZ5tFuQ5Jwxu-0U2B",
    art: { wash: "linear-gradient(140deg, #452508 0%, #1a1005 55%, #241a04 100%)", accent: "#fbbf24", tag: "Folk" },
  },
  {
    id: "global", name: "Global Pop", note: "Everywhere at once",
    playlistId: "PLVPt7YJKnZJCUE9WQ0ffocb0NJJ5sHjcS",
    art: { wash: "linear-gradient(140deg, #0a2b28 0%, #061312 55%, #0a1f1c 100%)", accent: "#2dd4bf", tag: "Worldwide" },
  },
  {
    id: "lofi", name: "Lo-Fi Beats", note: "Beats to drift to",
    seed: ["jfKfPfyJRdk"],
    art: { wash: "linear-gradient(140deg, #12291a 0%, #081309 55%, #0d1f12 100%)", accent: "#4ade80", tag: "Endless" },
  },
];

export const FALLBACK_QUEUE = ["jfKfPfyJRdk"];

export function getChannel(id: string): Channel | null {
  return CHANNELS.find((c) => c.id === id) || null;
}
