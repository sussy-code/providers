import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer, SourcererOutput } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const API_BASE = 'https://api.videasy.net';

async function fetchzyonStream(
  ctx: MovieScrapeContext | ShowScrapeContext,
  type: 'movie' | 'tv',
): Promise<SourcererOutput> {
  try {
    const params = new URLSearchParams({
      title: ctx.media.title,
      mediaType: type,
      year: String(ctx.media.releaseYear),
      tmdbId: String(ctx.media.tmdbId),
      imdbId: ctx.media.imdbId ?? '',
      episodeId:
        type === 'tv' && 'episode' in ctx.media
          ? String(ctx.media.episode.number)
          : '1',
      seasonId:
        type === 'tv' && 'season' in ctx.media
          ? String(ctx.media.season.number)
          : '1',
    });

    const url = `${API_BASE}/cdn/sources-with-title?${params.toString()}`;

    const stream = {
      id: 'zyon',
      type: 'hls' as const,
      playlist: url,
      flags: [flags.CORS_ALLOWED],
      captions: [],
    };

    return {
      embeds: [],
      stream: [stream],
    };
  } catch {
    throw new NotFoundError('Zyon stream not found');
  }
}

export const zyonScraper = makeSourcerer({
  id: 'zyon',
  name: 'Zyon (Movies Only)',
  rank: 13,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: (ctx: MovieScrapeContext) => fetchzyonStream(ctx, 'movie'),
});