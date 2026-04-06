import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { Caption } from '@/providers/captions';
import { flags } from '@/entrypoint/utils/targets';

const API_BASE = 'https://enc-dec.app/api';
const VIDLINK_BASE = 'https://vidlink.pro/api/b';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  'Referer': 'https://vidlink.pro/',
  'Origin': 'https://vidlink.pro',
};

async function encryptTmdbId(ctx: MovieScrapeContext | ShowScrapeContext, tmdbId: string): Promise<string> {
  const response = await ctx.proxiedFetcher<any>(`${API_BASE}/enc-vidlink`, {
    method: 'GET',
    query: { text: tmdbId },
  });

  const result = response?.result || response?.data?.result;
  if (!result) throw new NotFoundError('Failed to encrypt TMDB ID');

  return result;
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const { tmdbId } = ctx.media;
  ctx.progress(10);

  const encryptedId = await encryptTmdbId(ctx, tmdbId.toString());
  ctx.progress(40);

  const apiUrl = ctx.media.type === 'movie'
    ? `${VIDLINK_BASE}/movie/${encryptedId}`
    : `${VIDLINK_BASE}/tv/${encryptedId}/${ctx.media.season.number}/${ctx.media.episode.number}`;

  const rawResponse = await ctx.proxiedFetcher<any>(apiUrl, {
    headers: HEADERS,
  });

  if (!rawResponse) throw new NotFoundError('Empty response from VidLink');

  let vidlinkData: any;
  try {
    vidlinkData = typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;
  } catch (e) {
    throw new NotFoundError('Failed to parse VidLink response');
  }

  const stream = vidlinkData?.stream || vidlinkData?.data?.stream;

  if (!stream) {
    throw new NotFoundError('No stream data found in VidLink response');
  }

  ctx.progress(80);

  const captions: Caption[] = [];
  if (Array.isArray(stream.captions)) {
    for (const caption of stream.captions) {
      captions.push({
        id: caption.url,
        url: caption.url,
        language: caption.language || 'English',
        type: (caption.url.endsWith('.srt') ? 'srt' : 'vtt') as 'srt' | 'vtt',
        hasCorsRestrictions: false,
      });
    }
  }

  ctx.progress(95);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: stream.type === 'hls' || stream.playlist ? 'hls' : 'file',
        playlist: stream.playlist || stream.file || stream.url,
        qualities: stream.qualities || {},
        captions,
        flags: [],
        headers: {
          ...HEADERS,
          ...(stream.headers || {}),
        },
      },
    ],
  };
}

export const vidlinkScraper = makeSourcerer({
  id: 'vidlink',
  name: 'VidLink 🔥',
  rank: 100,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});