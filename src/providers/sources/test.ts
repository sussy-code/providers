import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { getTurnstileToken } from '@/utils/turnstile';
import { Caption, labelToLanguageCode } from '../captions';

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = 'https://z6mgd9v3-8787.euw.devtunnels.ms';
const TURNSTILE_SITE_KEY = '0x4AAAAAACuH31Fvud7uaIMf';
let FEB_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NzIyMTQxODAsIm5iZiI6MTc3MjIxNDE4MCwiZXhwIjoxODAzMzE4MjAwLCJkYXRhIjp7InVpZCI6OTMxMzA0LCJ0b2tlbiI6Ijc5NjhmYTc2ZDYzNTFjZTJjMDAxMjE4NzYyNjg4M2VkIn19.zeGmJN0gdC4ObOGIBMiHSqM0M6JtdJeT0dQELGUvVhA";

// ── Types ─────────────────────────────────────────────────────────────────────
interface StreamEntry {
  type: 'hls' | 'mp4';
  url: string;
  download?: string;
}

interface ApiResponse {
  streams: Record<string, StreamEntry>;
  subtitles: Record<string, {
    subtitle_link: string;
    language: string;
    type: 'vtt' | 'srt';
  }>;
  name?: string;
  error?: string;
}

type StreamInfo = { url: string; type: 'hls' | 'mp4' };
const QUALITY_MAP: Record<string, number | 'unknown'> = {
  '4K': 2160,
  '2160P': 2160,
  '1080P': 1080,
  '720P': 720,
  '480P': 480,
  '360P': 360,
  'ORG': 'unknown',
};

// ── Helper: normalize streams ─────────────────────────────────────────────────
function normalizeStreams(data: ApiResponse) {
  const streams: Record<string | number, StreamInfo> = {};
  for (const [q, entry] of Object.entries(data.streams)) {
    const key = QUALITY_MAP[q.toUpperCase()];
    if (key === undefined) continue;
    if (!streams[key]) streams[key] = { url: entry.url, type: entry.type };
  }
  return streams;
}

function normalizeCaptions(data: ApiResponse): Caption[] {
  const captions: Caption[] = [];
  for (const sub of Object.values(data.subtitles ?? {})) {
    if (!sub.subtitle_link) continue;
    const langCode = labelToLanguageCode(sub.language)?.toLowerCase() ?? 'unknown';
    captions.push({
      type: sub.type,
      id: sub.subtitle_link,
      url: sub.subtitle_link,
      language: langCode,
      hasCorsRestrictions: false,
    });
  }
  return captions;
}

// ── Fetch from worker ─────────────────────────────────────────────────────────
async function fetchMedia(tmdbId: string, type: 'movie' | 'tv', season?: number, episode?: number): Promise<ApiResponse> {
  if (!FEB_TOKEN) throw new NotFoundError('Febbox token not set');

  const turnstileToken = await getTurnstileToken(TURNSTILE_SITE_KEY);
  const params = new URLSearchParams({
    ui: FEB_TOKEN,
    imdb_id: tmdbId,
    type: type === 'tv' ? 'show' : 'movie',
  });
  if (type === 'tv' && season && episode) {
    params.set('season', String(season));
    params.set('episode', String(episode));
  }

  const res = await fetch(`${API_BASE}/fedapi?${params}`, {
    headers: { 'cf-turnstile-response': turnstileToken },
  });

  if (res.status === 401) throw new NotFoundError('Invalid Febbox token');
  if (res.status === 403) throw new NotFoundError('Turnstile rejected');
  if (res.status === 404) throw new NotFoundError('Content not found');
  if (!res.ok) throw new NotFoundError(`API error ${res.status}`);

  const data: ApiResponse = await res.json();
  if (data.error) throw new NotFoundError(data.error);
  if (!data.streams) throw new NotFoundError('No streams returned');

  return data;
}

// ── Main scraper ──────────────────────────────────────────────────────────────
async function scraper(tmdbId: string, type: 'movie' | 'tv', season?: number, episode?: number): Promise<SourcererOutput> {
  const data = await fetchMedia(tmdbId, type, season, episode);
  const streams = normalizeStreams(data);
  const captions = normalizeCaptions(data);

  const orderedKeys = [2160, 1080, 720, 480, 360, 'unknown'] as const;
  const hlsStream = orderedKeys.map(k => streams[k]).find(s => s?.type === 'hls');

  if (hlsStream) {
    return {
      embeds: [],
      stream: [{
        id: 'primary',
        captions,
        playlist: hlsStream.url,
        type: 'hls',
        flags: [flags.CORS_ALLOWED],
      }],
    };
  }

  return {
    embeds: [],
    stream: [{
      id: 'primary',
      captions,
      qualities: {
        ...(streams[2160] && { '4k': { type: 'mp4', url: streams[2160]!.url } }),
        ...(streams[1080] && { 1080: { type: 'mp4', url: streams[1080]!.url } }),
        ...(streams[720] && { 720: { type: 'mp4', url: streams[720]!.url } }),
        ...(streams[480] && { 480: { type: 'mp4', url: streams[480]!.url } }),
        ...(streams[360] && { 360: { type: 'mp4', url: streams[360]!.url } }),
        ...(streams['unknown'] && { unknown: { type: 'mp4', url: streams['unknown']!.url } }),
      },
      type: 'file',
      flags: [flags.CORS_ALLOWED],
    }],
  };
}

// ── Exports ───────────────────────────────────────────────────────────────────
export const FEDIAPIScraper = makeSourcerer({
  id: 'fediapi',
  name: 'FEDI API 🔥',
  rank: 105,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: (ctx: MovieScrapeContext) => scraper(ctx.media.tmdbId, 'movie'),
  scrapeShow: (ctx: ShowScrapeContext) => scraper(
    ctx.media.tmdbId,
    'tv',
    ctx.media.season?.number,
    ctx.media.episode?.number,
  ),
});