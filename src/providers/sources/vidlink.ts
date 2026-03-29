import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const API_BASE = 'https://enc-dec.app/api';
const VIDLINK_BASE = 'https://vidlink.pro/api/b';

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  Connection: 'keep-alive',
  Referer: 'https://vidlink.pro/',
  Origin: 'https://vidlink.pro',
};

async function encryptTmdbId(ctx: MovieScrapeContext | ShowScrapeContext, tmdbId: string): Promise<string> {
  const response = await ctx.proxiedFetcher<{ result: string }>(`${API_BASE}/enc-vidlink`, {
    method: 'GET',
    query: { text: tmdbId },
  });

  if (!response?.result) {
    throw new NotFoundError('Failed to encrypt TMDB ID');
  }

  return response.result;
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const { tmdbId } = ctx.media;

  ctx.progress(10);

  const encryptedId = await encryptTmdbId(ctx, tmdbId.toString());

  ctx.progress(30);

  const apiUrl =
    ctx.media.type === 'movie'
      ? `${VIDLINK_BASE}/movie/${encryptedId}`
      : `${VIDLINK_BASE}/tv/${encryptedId}/${ctx.media.season.number}/${ctx.media.episode.number}`;

  const vidlinkRaw = await ctx.proxiedFetcher<string>(apiUrl, {
    headers,
  });

  if (!vidlinkRaw) {
    throw new NotFoundError('No response from vidlink API');
  }

  ctx.progress(60);

  let vidlinkData: { stream?: any };
  try {
    vidlinkData = typeof vidlinkRaw === 'string' ? JSON.parse(vidlinkRaw) : vidlinkRaw;
  } catch {
    throw new NotFoundError('Invalid JSON from vidlink API');
  }

  ctx.progress(80);

  if (!vidlinkData.stream) {
    throw new NotFoundError('No stream data found in vidlink response');
  }

  const { stream } = vidlinkData;

  const captions = [];
  if (stream.captions && Array.isArray(stream.captions)) {
    for (const caption of stream.captions) {
      const captionType = caption.type === 'srt' ? 'srt' : 'vtt';
      captions.push({
        id: caption.id || caption.url,
        url: caption.url,
        language: caption.language || 'Unknown',
        type: captionType as 'srt' | 'vtt',
        hasCorsRestrictions: caption.hasCorsRestrictions || false,
      });
    }
  }

  // const flags = stream.flags || [];
  // if (vidlinkData.flags) {
  //   flags.push(...vidlinkData.flags);
  // }

  ctx.progress(90);

  return {
    embeds: [],
    stream: [
      {
        id: stream.id || 'primary',
        type: stream.type || 'file',
        qualities: stream.qualities || {},
        playlist: stream.playlist,
        captions,
        flags: [],
        headers: stream.headers || headers,
      },
    ],
  };
}

export const vidlinkScraper = makeSourcerer({
  id: 'vidlink',
  name: 'VidLink 🔥',
  rank: 96,
  disabled: false,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
