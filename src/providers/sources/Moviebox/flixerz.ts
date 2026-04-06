import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer, SourcererOutput } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const API_BASE = 'https://api.videasy.net';
const DEC_API = 'https://enc-dec.app/api/dec-videasy';

const PROVIDER_HEADERS = {
  'Origin': 'https://player.videasy.net',
  'Referer': 'https://player.videasy.net/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
};

async function decryptVidEasy(ctx: MovieScrapeContext | ShowScrapeContext, encryptedText: string, tmdbId: string): Promise<any> {
  const response = await ctx.proxiedFetcher<any>(DEC_API, {
    method: 'POST',
    body: { text: encryptedText, id: tmdbId },
  });
  const result = response?.result || response?.data || response;
  if (!result) throw new NotFoundError('Decryption API failed');
  return typeof result === 'string' ? JSON.parse(result) : result;
}

async function fetchVideasyStream(ctx: MovieScrapeContext | ShowScrapeContext, type: 'movie' | 'tv'): Promise<SourcererOutput> {
  const tmdbId = String(ctx.media.tmdbId);
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

  const url = `${API_BASE}/myflixerzupcloud/sources-with-title?${params.toString()}`;
  const response: any = await ctx.proxiedFetcher(url, { headers: PROVIDER_HEADERS });

  const encryptedHex = typeof response === 'string' ? response : response?.sources || response?.data;
  if (!encryptedHex || encryptedHex.length < 50) throw new NotFoundError('No encrypted hex found');

  const decryptedData = await decryptVidEasy(ctx, encryptedHex, tmdbId);
  const sources = Array.isArray(decryptedData) ? decryptedData : decryptedData?.sources || [];

  if (sources.length === 0) throw new NotFoundError('No sources after decryption');

  return {
    embeds: [],
    stream: sources.map((s: any): any => {
      const fileUrl = s.file || s.url;
      if (!fileUrl) return null;

      const isHls = fileUrl.includes('m3u8');
      return {
        id: `videasy-${s.label || 'primary'}`,
        type: isHls ? 'hls' : 'file',
        flags: [flags.CORS_ALLOWED],
        captions: [],
        headers: PROVIDER_HEADERS,
        ...(isHls ? { playlist: fileUrl } : {
          qualities: {
            unknown: {
              type: 'mp4',
              url: fileUrl,
            },
          },
        }),
      };
    }).filter(Boolean),
  };
}

export const flixerScraper = makeSourcerer({
  id: 'flixer',
  name: 'Flixerz',
  rank: 98,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: (ctx) => fetchVideasyStream(ctx, 'movie'),
  scrapeShow: (ctx) => fetchVideasyStream(ctx, 'tv'),
});