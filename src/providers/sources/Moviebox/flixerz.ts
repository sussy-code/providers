// src/providers/sources/flixerz/flixerz.ts
import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer, SourcererOutput } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const API_BASE = 'https://api.videasy.net';
const PROVIDER = 'flixerz';

// Helper: Detect hex token (64+ hex chars)
function isHexToken(str: string): boolean {
  return /^[0-9a-f]{64,}$/i.test(str.trim());
}

// Helper: Extract body text from various response shapes
function extractResponseBody(res: unknown): string {
  if (typeof res === 'string') return res;

  if (res instanceof Buffer) return res.toString('utf-8');

  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>;

    // Common response body locations
    const bodyFields = ['data', 'body', 'text', 'content', 'response'];
    for (const field of bodyFields) {
      if (typeof obj[field] === 'string') {
        return obj[field] as string;
      }
      // Nested object with text/data inside
      if (obj[field] && typeof obj[field] === 'object') {
        const nested = obj[field] as Record<string, unknown>;
        if (typeof nested.data === 'string') return nested.data;
        if (typeof nested.body === 'string') return nested.body;
        if (typeof nested.text === 'string') return nested.text;
      }
    }

    // Try JSON stringify as last resort
    return JSON.stringify(obj);
  }

  return String(res);
}

// Helper: Build playback URLs from token
function buildPlaybackUrls(token: string): string[] {
  return [
    `${API_BASE}/${PROVIDER}/play?token=${token}`,
    `${API_BASE}/${PROVIDER}/stream?token=${token}`,
    `${API_BASE}/${PROVIDER}/source?token=${token}`,
    `${API_BASE}/${PROVIDER}/play/${token}`,
    `${API_BASE}/${PROVIDER}/hls/${token}.m3u8`,
    `https://cdn.videasy.net/${PROVIDER}/${token}/index.m3u8`,
    `https://cdn.videasy.net/hls/${token}.m3u8?provider=${PROVIDER}`,
  ];
}

async function fetchFlixerzStream(
  ctx: MovieScrapeContext | ShowScrapeContext,
  type: 'movie' | 'tv',
): Promise<SourcererOutput> {
  const params = new URLSearchParams({
    title: ctx.media.title,
    mediaType: type,
    year: String(ctx.media.releaseYear),
    tmdbId: String(ctx.media.tmdbId),
    imdbId: ctx.media.imdbId ?? '',
    providerId: PROVIDER,
  });

  if (type === 'tv') {
    const showCtx = ctx as ShowScrapeContext;
    if (showCtx.media?.season?.number && showCtx.media?.episode?.number) {
      params.append('seasonId', String(showCtx.media.season.number));
      params.append('episodeId', String(showCtx.media.episode.number));
    }
  }

  const tokenUrl = `${API_BASE}/${PROVIDER}/sources-with-title?${params.toString()}`;

  try {
    // Fetch without generic type to get raw response
    const rawResponse = await ctx.proxiedFetcher(tokenUrl, {
      headers: {
        Accept: '*/*',
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://videasy.net/',
        Origin: 'https://videasy.net',
      },
    });

    // Debug: Log response structure
    console.log('[flixerz] Raw response type:', typeof rawResponse);
    console.log('[flixerz] Raw response keys:', Object.keys(rawResponse || {}));

    // Extract body text
    const token = extractResponseBody(rawResponse).trim();

    // Debug: Log extracted token
    console.log('[flixerz] Extracted token preview:', token.slice(0, 100));
    console.log('[flixerz] Token length:', token.length);

    if (!isHexToken(token)) {
      console.error(`[flixerz] Expected hex token, got: ${token.slice(0, 200)}`);
      throw new Error('Invalid token response from API');
    }

    console.log(`[flixerz] Got token (${token.length} chars), testing playback URLs...`);

    const candidates = buildPlaybackUrls(token);

    for (const candidate of candidates) {
      try {
        const testRes = await ctx.proxiedFetcher<string>(candidate, {
          headers: {
            Referer: 'https://videasy.net/',
            Origin: 'https://videasy.net',
          },
        });

        if (testRes.startsWith('#EXTM3U') || testRes.includes('#EXTINF:')) {
          console.log(`[flixerz] ✅ Found working playlist: ${candidate}`);
          return {
            embeds: [],
            stream: [
              {
                id: 'flixerz-primary',
                type: 'hls',
                playlist: candidate,
                headers: {
                  referer: 'https://videasy.net/',
                  origin: 'https://videasy.net',
                },
                flags: [flags.CORS_ALLOWED],
                captions: [],
              },
            ],
          };
        }
      } catch {
        continue;
      }
    }

    // Fallback to first pattern
    const fallback = candidates[0];
    console.log(`[flixerz] Using fallback: ${fallback}`);
    return {
      embeds: [],
      stream: [
        {
          id: 'flixerz-primary',
          type: 'hls',
          playlist: fallback,
          headers: {
            referer: 'https://videasy.net/',
            origin: 'https://videasy.net',
          },
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  } catch (err) {
    console.error('[flixerz] Error:', err);
    throw new NotFoundError('Flixerz stream not found');
  }
}

export const flixerScraper = makeSourcerer({
  id: 'flixerz',
  name: 'Flixerz',
  rank: 99,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: (ctx) => fetchFlixerzStream(ctx, 'movie'),
  scrapeShow: (ctx) => fetchFlixerzStream(ctx, 'tv'),
});
