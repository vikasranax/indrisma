// Each channel is either:
//   { id, name, playlistId, bg? }   — a real YouTube playlist, looped infinitely
//   { id, name, seed: [videoIds] }  — a shuffled queue of individual videos, looped infinitely
//
// "Radio" is the default channel that autoplays when INDRISMA first loads.
// Swap PLACEHOLDER ids below for your own — or just paste a playlist link in-app,
// which works immediately without editing this file.

export const CHANNELS = [
  {
    id: 'radio',
    name: 'Radio',
    // TODO: replace with your Indian Classical / Jhankar playlist ID (open the
    // playlist on YouTube and copy the ?list= value from the URL).
    playlistId: 'PLVPt7YJKnZJALtkfMhJCuI2jWkaM_jwn8',
  },
  {
    id: 'bollywood',
    name: 'Bollywood Essentials',
    playlistId: 'PLY5fKEIEUxyU',
  },
  {
    id: 'alka',
    name: 'Alka Nostalgia',
    playlistId: 'PLVPt7YJKnZJAeL4Qbh0Vx4-V208-hbGMZ',
  },
  {
    id: 'bhojpuri',
    name: 'Bhojpuri Hits',
    playlistId: 'PLVPt7YJKnZJDA5lulZ5tFuQ5Jwxu-0U2B',
  },
  {
    id: 'global',
    name: 'Global Pop',
    playlistId: 'PLVPt7YJKnZJCUE9WQ0ffocb0NJJ5sHjcS',
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Beats',
    // Real, long-running stream: Lofi Girl — lofi hip hop radio.
    playlistId: 'PLEPY8NcNUpYY',
    seed: ['jfKfPfyJRdk'],
  },
];

export const FALLBACK_QUEUE = ['jfKfPfyJRdk'];

export function getChannel(id) {
  return CHANNELS.find((c) => c.id === id) || null;
}