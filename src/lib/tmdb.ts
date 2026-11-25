const REGION = process.env.NEXT_PUBLIC_TMDB_REGION || "IN";
const BASE = "https://api.themoviedb.org/3";
const KEY_STORAGE = "indrisma-tmdb-key";
const LEGACY_KEY_STORAGE = "vrx-tmdb-key";

export type TmdbError = Error & { code?: string };

export function getApiKey(): string {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(KEY_STORAGE) || localStorage.getItem(LEGACY_KEY_STORAGE);
      if (stored) return stored;
    } catch {
      /* noop */
    }
  }
  return process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
}

export function setApiKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key.trim());
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* noop */
  }
}

export const hasApiKey = () => !!getApiKey();

async function get(path: string, params: Record<string, string> = {}) {
  const KEY = getApiKey();
  if (!KEY) {
    const e = new Error("No movie database key set") as TmdbError;
    e.code = "MISSING_TMDB_KEY";
    throw e;
  }
  const qs = new URLSearchParams({ api_key: KEY, ...params });
  const r = await fetch(`${BASE}${path}?${qs}`);
  if (!r.ok) {
    if (r.status === 401) {
      const e = new Error("That movie database key was rejected") as TmdbError;
      e.code = "INVALID_TMDB_KEY";
      throw e;
    }
    throw new Error("TMDB " + r.status);
  }
  return r.json();
}

export async function verifyApiKey(key: string): Promise<boolean> {
  const qs = new URLSearchParams({ api_key: key });
  try {
    const r = await fetch(`${BASE}/authentication/token/new?${qs}`);
    return r.ok;
  } catch {
    return false;
  }
}

export const img = (p: string | null, w = "w500") =>
  p ? `https://image.tmdb.org/t/p/${w}${p}` : null;
export const imgOrig = (p: string | null) =>
  p ? `https://image.tmdb.org/t/p/original${p}` : null;

export const trending = () => get("/trending/movie/week");
export const latest = () => get("/movie/now_playing");
export const upcoming = () => get("/movie/upcoming");
export const search = (q: string) => get("/search/movie", { query: q });
export const searchMulti = (q: string) => get("/search/multi", { query: q });
export const details = (id: number) => get(`/movie/${id}`);

export const trendingTv = () => get("/trending/tv/week");
export const popularTv = () => get("/tv/popular");
export const topRatedTv = () => get("/tv/top_rated");
export const onTheAirTv = () => get("/tv/on_the_air");
export const searchTv = (q: string) => get("/search/tv", { query: q });
export const detailsTv = (id: number) => get(`/tv/${id}`);

interface ProviderEntry {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface ProviderData {
  results?: Record<string, { flatrate?: ProviderEntry[]; rent?: ProviderEntry[]; buy?: ProviderEntry[] }>;
}

export interface ProviderLists {
  flatrate: ProviderEntry[];
  rent: ProviderEntry[];
  buy: ProviderEntry[];
}

function pick(data: ProviderData): ProviderLists {
  const r = (data.results && (data.results[REGION] || data.results.US)) || null;
  if (!r) return { flatrate: [], rent: [], buy: [] };
  const uniq = (arr?: ProviderEntry[]) => {
    const m = new Map<number, ProviderEntry>();
    (arr || []).forEach((p) => m.set(p.provider_id, p));
    return [...m.values()];
  };
  return { flatrate: uniq(r.flatrate), rent: uniq(r.rent), buy: uniq(r.buy) };
}

export async function providers(id: number): Promise<ProviderLists> {
  const data = (await get(`/movie/${id}/watch/providers`)) as ProviderData;
  return pick(data);
}

export async function tvProviders(id: number): Promise<ProviderLists> {
  const data = (await get(`/tv/${id}/watch/providers`)) as ProviderData;
  return pick(data);
}

export interface TmdbRaw {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  vote_average?: number;
}

interface MiniMovieRaw {
  id: number;
  title: string;
  year: string;
  date: string;
  poster: string | null;
  rating: number | null;
  mediaType: "movie" | "tv";
}

export const toMini = (m: TmdbRaw): MiniMovieRaw => ({
  id: m.id,
  title: m.title || m.name || "",
  year: (m.release_date || m.first_air_date || "").slice(0, 4),
  date: m.release_date || m.first_air_date || "",
  poster: m.poster_path || null,
  rating: m.vote_average || null,
  mediaType: "movie",
});

export const toMiniTv = (m: TmdbRaw): MiniMovieRaw => ({
  id: m.id,
  title: m.name || m.title || "",
  year: (m.first_air_date || m.release_date || "").slice(0, 4),
  date: m.first_air_date || m.release_date || "",
  poster: m.poster_path || null,
  rating: m.vote_average || null,
  mediaType: "tv",
});
