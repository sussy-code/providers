import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { getTurnstileToken } from '@/utils/turnstile';

import { Caption, labelToLanguageCode } from '../captions';

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = 'https://z6mgd9v3-8787.euw.devtunnels.ms';
const TURNSTILE_SITE_KEY = '0x4AAAAAACuH31Fvud7uaIMf';

let FebToken =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NzIyMTQxODAsIm5iZiI6MTc3MjIxNDE4MCwiZXhwIjoxODAzMzE4MjAwLCJkYXRhIjp7InVpZCI6OTMxMzA0LCJ0b2tlbiI6Ijc5NjhmYTc2ZDYzNTFjZTJjMDAxMjE4NzYyNjg4M2VkIn19.zeGmJN0gdC4ObOGIBMiHSqM0M6JtdJeT0dQELGUvVhA";

// ── Turnstile Cache ───────────────────────────────────────────────────────────
let cachedTurnstile: { token: string; ts: number } | null = null;

async function getCachedTurnstile(): Promise<string> {
  const now = Date.now();

  if (cachedTurnstile && now - cachedTurnstile.ts < 120000) {
    return cachedTurnstile.token;
  }

  const token = await getTurnstileToken(TURNSTILE_SITE_KEY);
  cachedTurnstile = { token, ts: now };
  return token;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface StreamEntry {
  type: 'hls' | 'mp4';
  url: string;
  download?: string;
}

interface ApiResponse {
  streams: Record<string, StreamEntry>;
  subtitles: Record<
    string,
    {
      subtitle_link: string;
      language: string;
      type: 'vtt' | 'srt';
    }
  >;
  name?: string;
  error?: string;
}

// Quality key → numeric for player
const QUALITY_MAP: Record<string, number | 'unknown'> = {
  '4K': 2160,
  '2160P': 2160,
  '1080P': 1080,
  '720P': 720,
  '480P': 480,
  '360P': 360,
  'ORG': 'unknown',
};

// ── Main scraper ──────────────────────────────────────────────────────────────
async function comboScraper(
  ctx: ShowScrapeContext | MovieScrapeContext,
): Promise<SourcererOutput> {
  const userToken = FebToken;
  if (!userToken)
    throw new NotFoundError('Febbox token not set');

  // 1. Turnstile
  let turnstileToken: string;
  try {
    turnstileToken = await getCachedTurnstile();
  } catch (err) {
    console.log('Turnstile verification failed');
    throw new NotFoundError(`Turnstile failed: ${err}`);
  }

  ctx.progress(25);

  // 2. Require IMDB ID
  const imdbId = ctx.media.imdbId;
  if (!imdbId) throw new NotFoundError('No IMDB ID available');

  // 3. Build params
  const params = new URLSearchParams({
    name: ctx.media.title,
    year: String(ctx.media.releaseYear ?? ''),
    ui: userToken,
    imdb_id: imdbId,
    type: ctx.media.type === 'show' ? 'show' : 'movie',
  });

  if (ctx.media.type === 'show') {
    params.set('season', String(ctx.media.season.number));
    params.set('episode', String(ctx.media.episode.number));
  }

  ctx.progress(40);

  // 4. Fetch
  const res = await fetch(`${API_BASE}/fedapi?${params}`, {
    headers: {
      'cf-turnstile-response': turnstileToken,
    },
    credentials: 'omit',
  });

  if (res.status === 401)
    throw new NotFoundError('Invalid Febbox token');
  if (res.status === 403)
    throw new NotFoundError('Turnstile rejected');
  if (res.status === 404)
    throw new NotFoundError('Content not found');
  if (!res.ok)
    throw new NotFoundError(`API error ${res.status}`);

  const data: ApiResponse = await res.json();

  if (data?.error)
    throw new NotFoundError(data.error);
  if (!data?.streams)
    throw new NotFoundError('No streams');

  ctx.progress(80);

  // 5. Normalize streams
  type StreamInfo = { url: string; type: 'hls' | 'mp4' };
  const streams: Record<string | number, StreamInfo> = {};

  for (const [qualityKey, entry] of Object.entries(data.streams)) {
    const normKey = QUALITY_MAP[qualityKey.toUpperCase()];
    if (normKey === undefined) continue;
    if (streams[normKey]) continue;
    streams[normKey] = { url: entry.url, type: entry.type };
  }

  // 6. Captions
  const captions: Caption[] = [];
  for (const sub of Object.values(data.subtitles ?? {})) {
    const url = sub.subtitle_link;
    if (!url) continue;

    const langCode =
      labelToLanguageCode(sub.language)?.toLowerCase() ??
      'unknown';

    captions.push({
      type: sub.type,
      id: url,
      url,
      language: langCode,
      hasCorsRestrictions: false,
    });
  }

  ctx.progress(95);

  // 7. Return
  const orderedKeys = [2160, 1080, 720, 480, 360, 'unknown'] as const;
  const hlsStream = orderedKeys
    .map((k) => streams[k])
    .find((s) => s?.type === 'hls');

  if (hlsStream) {
    return {
      embeds: [],
      stream: [
        {
          id: 'primary',
          captions,
          playlist: hlsStream.url,
          type: 'hls',
          flags: [flags.CORS_ALLOWED],
        },
      ],
    };
  }

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        captions,
        qualities: {
          ...(streams[2160] && {
            '4k': { type: 'mp4', url: streams[2160].url },
          }),
          ...(streams[1080] && {
            1080: { type: 'mp4', url: streams[1080].url },
          }),
          ...(streams[720] && {
            720: { type: 'mp4', url: streams[720].url },
          }),
          ...(streams[480] && {
            480: { type: 'mp4', url: streams[480].url },
          }),
          ...(streams[360] && {
            360: { type: 'mp4', url: streams[360].url },
          }),
          ...(streams['unknown'] && {
            unknown: {
              type: 'mp4',
              url: streams['unknown'].url,
            },
          }),
        },
        type: 'file',
        flags: [flags.CORS_ALLOWED],
      },
    ],
  };
}

export const FEDIAPIScraper = makeSourcerer({
  id: 'fediapi',
  name: 'FEDI API 🔥',
  rank: 105,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});