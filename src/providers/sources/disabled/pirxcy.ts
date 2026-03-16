import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://mbp.pirxcy.dev'; // the dev of this api asked it to be removed. however you can host this endpoint yourself. https://github.com/HyperKiko/mbp-api

function buildQualitiesFromStreams(data: {
  list: Array<{ path: string; quality: string; real_quality: string; format: string }>;
}) {
  // Process streams data from the list array
  const streams = data.list.reduce((acc: Record<string, string>, stream) => {
    const { path, quality, format } = stream;
    const realQuality = stream.real_quality;

    // Only process MP4 streams
    if (format !== 'mp4') return acc;

    let qualityKey: number;
    if (quality === '4K' || realQuality === '4K') {
      qualityKey = 2160;
    } else {
      const qualityStr = quality.replace('p', '');
      qualityKey = parseInt(qualityStr, 10);
    }

    if (Number.isNaN(qualityKey) || acc[qualityKey]) return acc;
    acc[qualityKey] = path;
    return acc;
  }, {});

  // Filter qualities based on provider type
  const filteredStreams = Object.entries(streams).reduce((acc: Record<string, string>, [quality, url]) => {
    // Skip unknown for cached provider if needed
    // For now, include all qualities
    acc[quality] = url;
    return acc;
  }, {});

  return {
    ...(filteredStreams[2160] && {
      '4k': {
        type: 'mp4' as const,
        url: filteredStreams[2160],
      },
    }),
    ...(filteredStreams[1080] && {
      1080: {
        type: 'mp4' as const,
        url: filteredStreams[1080],
      },
    }),
    ...(filteredStreams[720] && {
      720: {
        type: 'mp4' as const,
        url: filteredStreams[720],
      },
    }),
    ...(filteredStreams[480] && {
      480: {
        type: 'mp4' as const,
        url: filteredStreams[480],
      },
    }),
    ...(filteredStreams[360] && {
      360: {
        type: 'mp4' as const,
        url: filteredStreams[360],
      },
    }),
    ...(filteredStreams.unknown && {
      unknown: {
        type: 'mp4' as const,
        url: filteredStreams.unknown,
      },
    }),
  };
}

async function findMediaByTMDBId(
  ctx: MovieScrapeContext | ShowScrapeContext,
  tmdbId: string,
  title: string,
  type: 'movie' | 'tv',
  year?: string,
): Promise<string> {
  const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(title)}&type=${type}${year ? `&year=${year}` : ''}`;
  const searchRes = await ctx.proxiedFetcher(searchUrl);

  if (!searchRes.data || searchRes.data.length === 0) {
    throw new NotFoundError('No results found in search');
  }

  // Find the correct internal ID by matching TMDB ID
  for (const result of searchRes.data) {
    const detailUrl = `${baseUrl}/details/${type}/${result.id}`;
    const detailRes = await ctx.proxiedFetcher(detailUrl);

    if (detailRes.data && detailRes.data.tmdb_id.toString() === tmdbId) {
      return result.id;
    }
  }

  throw new NotFoundError('Could not find matching media item for TMDB ID');
}

async function scrapeMovie(ctx: MovieScrapeContext): Promise<SourcererOutput> {
  const tmdbId = ctx.media.tmdbId;
  const title = ctx.media.title;
  const year = ctx.media.releaseYear?.toString();

  if (!tmdbId || !title) {
    throw new NotFoundError('Missing required media information');
  }

  // Find internal media ID
  const mediaId = await findMediaByTMDBId(ctx, tmdbId, title, 'movie', year);

  // Get stream links
  const streamUrl = `${baseUrl}/movie/${mediaId}`;
  const streamData = await ctx.proxiedFetcher(streamUrl);

  if (!streamData.data || !streamData.data.list) {
    throw new NotFoundError('No streams found for this movie');
  }

  const qualities = buildQualitiesFromStreams(streamData.data);

  return {
    stream: [
      {
        id: 'pirxcy',
        type: 'file',
        qualities,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
    embeds: [],
  };
}

async function scrapeShow(ctx: ShowScrapeContext): Promise<SourcererOutput> {
  const tmdbId = ctx.media.tmdbId;
  const title = ctx.media.title;
  const year = ctx.media.releaseYear?.toString();
  const season = ctx.media.season.number;
  const episode = ctx.media.episode.number;

  if (!tmdbId || !title || !season || !episode) {
    throw new NotFoundError('Missing required media information');
  }

  // Find internal media ID
  const mediaId = await findMediaByTMDBId(ctx, tmdbId, title, 'tv', year);

  // Get stream links
  const streamUrl = `${baseUrl}/tv/${mediaId}/${season}/${episode}`;
  const streamData = await ctx.proxiedFetcher(streamUrl);

  if (!streamData.data || !streamData.data.list) {
    throw new NotFoundError('No streams found for this episode');
  }

  const qualities = buildQualitiesFromStreams(streamData.data);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'file',
        qualities,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const pirxcyScraper = makeSourcerer({
  id: 'pirxcy',
  name: 'Pirxcy',
  rank: 290,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie,
  scrapeShow,
});
