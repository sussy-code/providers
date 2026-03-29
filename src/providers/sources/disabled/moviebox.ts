import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer, SourcererOutput } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const API_BASE = 'https://api.videasy.net';

interface MovieboxApiResponse {
  success: boolean;
  data?: {
    streamUrl?: string;
    hls?: string;
    url?: string;
    sources?: Array<{ file: string; type: string }>;
  };
}

async function fetchMovieboxStream(
  ctx: MovieScrapeContext | ShowScrapeContext,
  type: 'movie' | 'tv',
): Promise<SourcererOutput> {
  const params = new URLSearchParams({
    title: ctx.media.title,
    mediaType: type,
    year: String(ctx.media.releaseYear),
    tmdbId: String(ctx.media.tmdbId),
    imdbId: ctx.media.imdbId ?? '',
    providerId: 'moviebox',
  });

  if (type === 'tv') {
    const showCtx = ctx as ShowScrapeContext;
    if (showCtx.media?.season?.number && showCtx.media?.episode?.number) {
      params.append('seasonId', String(showCtx.media.season.number));
      params.append('episodeId', String(showCtx.media.episode.number));
    }
  }

  const apiUrl = `${API_BASE}/moviebox/sources-with-title?${params.toString()}`;

  // DEBUG: Log the request URL
  console.log('[moviebox] Request URL:', apiUrl);

  try {
    // Fetch as text first to see raw response
    const rawResponse = await ctx.proxiedFetcher<string>(apiUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    // DEBUG: Log raw response
    console.log('[moviebox] Raw API Response:', rawResponse.slice(0, 2000));

    // Try to parse as JSON
    let response: MovieboxApiResponse;
    try {
      response = JSON.parse(rawResponse);
    } catch (parseErr) {
      console.error('[moviebox] JSON parse error:', parseErr);
      console.error('[moviebox] Response was not valid JSON');
      throw new Error('API response is not valid JSON');
    }

    console.log('[moviebox] Parsed response:', JSON.stringify(response, null, 2));

    if (!response?.success || !response?.data) {
      console.error('[moviebox] API error:', response?.error || 'No data field');
      throw new Error('API returned no data');
    }

    const hlsUrl =
      response.data.streamUrl ||
      response.data.hls ||
      response.data.url ||
      response.data.sources?.find((s) => s.type === 'hls')?.file;

    if (!hlsUrl || typeof hlsUrl !== 'string' || !hlsUrl.toLowerCase().includes('.m3u8')) {
      console.error('[moviebox] No HLS URL found in:', response.data);
      throw new Error('No valid HLS URL found');
    }

    return {
      embeds: [],
      stream: [
        {
          id: 'moviebox-primary',
          type: 'hls',
          playlist: hlsUrl,
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
    console.error('[moviebox] Fetch error:', err);
    throw new NotFoundError('Moviebox stream not found');
  }
}

export const movieboxScraper = makeSourcerer({
  id: 'moviebox',
  name: 'Moviebox',
  rank: 99,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: (ctx) => fetchMovieboxStream(ctx, 'movie'),
  scrapeShow: (ctx) => fetchMovieboxStream(ctx, 'tv'),
});
