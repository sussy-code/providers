import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

interface PStreamResponse {
  imdb_id: string;
  streams: Array<{
    headers: Record<string, string>;
    link: string;
    quality: string;
    server: string;
    type: string;
  }>;
  title: string;
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  // Build the API URL based on media type
  let apiUrl: string;
  if (ctx.media.type === 'movie') {
    // For movies, we need IMDB ID
    if (!ctx.media.imdbId) throw new NotFoundError('IMDB ID required for movies');
    apiUrl = `https://primewire.pstream.mov/movie/${ctx.media.imdbId}`;
  } else {
    // For TV shows, we need IMDB ID, season, and episode
    if (!ctx.media.imdbId) throw new NotFoundError('IMDB ID required for TV shows');
    apiUrl = `https://primewire.pstream.mov/tv/${ctx.media.imdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  }

  ctx.progress(30);

  // Fetch the stream data
  const response = await ctx.fetcher<PStreamResponse>(apiUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    },
  });

  if (!response.streams || !Array.isArray(response.streams) || response.streams.length === 0) {
    throw new NotFoundError('No streams found');
  }

  ctx.progress(60);

  // Process each stream as a separate embed using server-mirrors
  const embeds: SourcererEmbed[] = [];

  for (const stream of response.streams) {
    if (!stream.link || !stream.quality) continue;

    let mirrorContext: any;

    if (stream.type === 'm3u8') {
      // Handle HLS streams
      mirrorContext = {
        type: 'hls',
        stream: stream.link,
        headers: stream.headers || [],
        captions: [],
        flags: !stream.headers || Object.keys(stream.headers).length === 0 ? [flags.CORS_ALLOWED] : [],
      };
    } else {
      // Handle file streams
      // Convert quality string to numeric key for the qualities object
      let qualityKey: string;
      if (stream.quality === 'ORG') {
        // Handle original quality - check if it's an MP4
        const urlPath = stream.link.split('?')[0];
        if (urlPath.toLowerCase().endsWith('.mp4')) {
          qualityKey = 'unknown';
        } else {
          continue; // Skip non-MP4 original quality
        }
      } else if (stream.quality === '4K') {
        qualityKey = '4k';
      } else {
        // Parse numeric qualities like "720", "1080", etc.
        const parsed = parseInt(stream.quality.replace('P', ''), 10);
        if (Number.isNaN(parsed)) continue;
        qualityKey = parsed.toString();
      }

      // Create the mirror context for server-mirrors embed
      mirrorContext = {
        type: 'file',
        qualities: {
          [qualityKey === 'unknown' || qualityKey === '4k' ? qualityKey : parseInt(qualityKey, 10)]: {
            type: 'mp4',
            url: stream.link,
          },
        },
        flags: !stream.headers || Object.keys(stream.headers).length === 0 ? [flags.CORS_ALLOWED] : [],
        headers: stream.headers || [],
        captions: [],
      };
    }

    embeds.push({
      embedId: 'mirror',
      url: JSON.stringify(mirrorContext),
    });
  }

  if (embeds.length === 0) {
    throw new NotFoundError('No valid streams found');
  }

  ctx.progress(90);

  return { embeds };
}

export const primewireScraper = makeSourcerer({
  id: 'primewire',
  name: 'PrimeWire 🔥',
  rank: 206,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
