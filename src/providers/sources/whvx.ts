import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

export const baseUrl = 'https://api.whvx.net';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const query = {
    title: ctx.media.title,
    releaseYear: ctx.media.releaseYear,
    tmdbId: ctx.media.tmdbId,
    imdbId: ctx.media.imdbId,
    type: ctx.media.type,
    ...(ctx.media.type === 'show' && {
      season: ctx.media.season.number.toString(),
      episode: ctx.media.episode.number.toString(),
    }),
  };

  const res: { providers: string[] } = await ctx.fetcher('/status', { baseUrl });

  if (res.providers?.length === 0) throw new NotFoundError('No providers available');

  const embeds = res.providers.map((provider: string) => {
    return {
      embedId: provider,
      url: JSON.stringify(query),
    };
  });

  return {
    embeds,
  };
}

export const whvxScraper = makeSourcerer({
  id: 'whvx',
  name: 'VidBinge',
  rank: 128,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
