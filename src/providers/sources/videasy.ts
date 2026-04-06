import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer, SourcererOutput } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

const backendUrl = 'https://api.videasy.net';

const servers = [
  { id: 'flixer', path: 'myflixerzupcloud' },
  { id: 'hdmovie', path: 'hdmovie' },
  { id: 'moviebox', path: 'moviebox' },
  { id: 'zyon', path: 'cdn' }
];

async function scrape(ctx: MovieScrapeContext | ShowScrapeContext, type: 'movie' | 'tv'): Promise<SourcererOutput> {
  const stream = [];

  for (const server of servers) {
    const params = new URLSearchParams({
      title: ctx.media.title,
      mediaType: type,
      year: String(ctx.media.releaseYear),
      tmdbId: String(ctx.media.tmdbId),
      imdbId: ctx.media.imdbId ?? '',
      episodeId: type === 'tv' ? String((ctx as ShowScrapeContext).media.episode.number) : '1',
      seasonId: type === 'tv' ? String((ctx as ShowScrapeContext).media.season.number) : '1',
    });

    const url = `${backendUrl}/${server.path}/sources-with-title?${params.toString()}`;

    stream.push({
      id: server.id,
      type: 'hls' as const,
      playlist: url,
      flags: [flags.CORS_ALLOWED],
      captions: [],
    });
  }

  return {
    embeds: [],
    stream,
  };
}

export const videasyScraper = makeSourcerer({
  id: 'videasy',
  name: 'VidEasy',
  rank: 99,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: (ctx: MovieScrapeContext) => scrape(ctx, 'movie'),
  scrapeShow: (ctx: ShowScrapeContext) => scrape(ctx, 'tv'),
});