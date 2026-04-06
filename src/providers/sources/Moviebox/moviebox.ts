import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer, SourcererOutput } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const API_BASE = 'https://api.videasy.net';
const DEC_API = 'https://enc-dec.app/api/dec-videasy';

/**
 * Decrypts the long hex string you provided using the helper API.
 * Body: { "text": "8c85...", "id": "1416" }
 */
async function decryptVidEasy(
  ctx: MovieScrapeContext | ShowScrapeContext, 
  encryptedText: string, 
  tmdbId: string
): Promise<any> {
  const response = await ctx.proxiedFetcher<any>(DEC_API, {
    method: 'POST',
    body: {
      text: encryptedText,
      id: tmdbId, // Critical: Must be the TMDB ID as a string
    },
  });

  // The API returns { result: "stringified_json" } or { data: [...] }
  const result = response?.result || response?.data || response;

  if (!result) {
    throw new NotFoundError('Decryption API returned no result');
  }

  // Handle double-stringified JSON if necessary
  try {
    return typeof result === 'string' ? JSON.parse(result) : result;
  } catch (e) {
    return result;
  }
}

async function fetchVideasyStream(
  ctx: MovieScrapeContext | ShowScrapeContext,
  type: 'movie' | 'tv',
): Promise<SourcererOutput> {
  const tmdbId = String(ctx.media.tmdbId);
  
  // 1. Fetch encrypted hex from Videasy
  const encodedTitle = encodeURIComponent(ctx.media.title).replace(/%20/g, '+');
  const params = new URLSearchParams({
    title: encodedTitle,
    mediaType: type,
    year: String(ctx.media.releaseYear),
    episodeId: type === 'tv' ? String((ctx as ShowScrapeContext).media.episode.number) : '',
    seasonId: type === 'tv' ? String((ctx as ShowScrapeContext).media.season.number) : '',
    tmdbId: tmdbId,
    imdbId: ctx.media.imdbId ?? ''
  });

  const url = `${API_BASE}/moviebox/sources-with-title?${params.toString()}`;
  
  const response: any = await ctx.proxiedFetcher(url, {
    headers: {
      'Origin': 'https://player.videasy.net',
      'Referer': 'https://player.videasy.net/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    }
  });

  // The encrypted string is either the whole response or response.sources
  const encryptedHex = typeof response === 'string' ? response : response?.sources;
  
  if (!encryptedHex) throw new NotFoundError('No encrypted hex found');

  // 2. Decrypt via the POST endpoint
  const decryptedData = await decryptVidEasy(ctx, encryptedHex, tmdbId);

  // 3. Extract the source list
  // VidEasy decrypted data is usually an array, or an object { sources: [] }
  const sources = Array.isArray(decryptedData) ? decryptedData : decryptedData?.sources || [];

  if (sources.length === 0) {
    throw new NotFoundError('No playable sources found in decrypted payload');
  }

  return {
    embeds: [],
    stream: sources.map((s: any): any => {
      const fileUrl = s.file || s.url;
      if (!fileUrl) return null;

      const isHls = fileUrl.includes('m3u8');
      const common = {
        id: `videasy-${s.label || 'primary'}`,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      };

      if (isHls) {
        return {
          ...common,
          type: 'hls',
          playlist: fileUrl,
        };
      }

      return {
        ...common,
        type: 'file',
        qualities: {
          unknown: {
            type: 'mp4',
            url: fileUrl,
          },
        },
      };
    }).filter(Boolean),
  };
}

export const movieboxScraper = makeSourcerer({
  id: 'moviebox',
  name: 'MovieBox',
  rank: 99,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: (ctx) => fetchVideasyStream(ctx, 'movie'),
  scrapeShow: (ctx) => fetchVideasyStream(ctx, 'tv'),
});