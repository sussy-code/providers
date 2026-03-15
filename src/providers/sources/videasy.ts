import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer, SourcererOutput } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const API_BASE = 'https://api.videasy.net';

const BACKENDS = [
  'moviebox',
  'myflixerzupcloud',
  'hdmovie',
  'm4uhd',
  'primewire',
  'primesrcme',
  '1movies',
];

async function fetchFirstStream(
  ctx: MovieScrapeContext | ShowScrapeContext,
  type: 'movie' | 'tv',
): Promise<SourcererOutput> {
  for (const backend of BACKENDS) {
    try {
      const params = new URLSearchParams({
        title: ctx.media.title,
        mediaType: type,
        year: String(ctx.media.releaseYear),
        tmdbId: String(ctx.media.tmdbId),
        imdbId: ctx.media.imdbId ?? '',
        episodeId: type === 'tv' && 'episode' in ctx.media ? String(ctx.media.episode.number) : '1',
        seasonId: type === 'tv' && 'season' in ctx.media ? String(ctx.media.season.number) : '1',
      });

      const url = `${API_BASE}/${backend}/sources-with-title?${params.toString()}`;

      const stream = {
        id: backend,
        type: 'hls' as const,
        playlist: url,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      };

      // (optional)
      // const test = await fetch(url);
      // if (test.ok) return { embeds: [], stream: [stream] };

      return {
        embeds: [],
        stream: [stream],
      };
    } catch (err) {
      continue;
    }
  }

  throw new NotFoundError('No streams found on any backend');
}

export const videasyScraper = makeSourcerer({
  id: 'videasy',
  name: 'Videasy',
  rank: 200,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: (ctx: MovieScrapeContext) => fetchFirstStream(ctx, 'movie'),
  scrapeShow: (ctx: ShowScrapeContext) => fetchFirstStream(ctx, 'tv'),
});