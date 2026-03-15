import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer, SourcererOutput } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

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

async function fetchStreams(
  ctx: MovieScrapeContext | ShowScrapeContext,
  type: 'movie' | 'tv',
): Promise<SourcererOutput> {
  const embeds: { embedId: string; url: string }[] = [];

  for (const backend of BACKENDS) {
    const params = new URLSearchParams({
      title: ctx.media.title,
      mediaType: type,
      year: String(ctx.media.releaseYear),
      tmdbId: String(ctx.media.tmdbId),
      imdbId: ctx.media.imdbId ?? '',
      episodeId:
        type === 'tv' && 'episode' in ctx.media ? String(ctx.media.episode.number) : '1',
      seasonId:
        type === 'tv' && 'season' in ctx.media ? String(ctx.media.season.number) : '1',
    });

    const url = `${API_BASE}/${backend}/sources-with-title?${params.toString()}`;

    embeds.push({
      embedId: `${backend}`,
      url,
    });
  }

  const streams = embeds.map((server) => ({
    id: server.embedId,
    type: 'hls' as const,
    playlist: server.url,
    flags: [flags.CORS_ALLOWED],
    captions: [],
  }));

  return {
    embeds: [],
    stream: streams,
  };
}

export const videasyScraper = makeSourcerer({
  id: 'videasy',
  name: 'Videasy',
  rank: 204,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: (ctx: MovieScrapeContext) => fetchStreams(ctx, 'movie'),
  scrapeShow: (ctx: ShowScrapeContext) => fetchStreams(ctx, 'tv'),
});