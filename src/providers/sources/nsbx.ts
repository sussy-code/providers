import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

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

  const res: { providers: string[]; endpoint: string } = await ctx.fetcher('https://api.nsbx.ru/status');

  if (res.providers?.length === 0) throw new NotFoundError('No providers available');
  if (!res.endpoint) throw new Error('No endpoint returned');

  const embeds = res.providers.map((provider: string) => {
    return {
      embedId: provider,
      url: `${JSON.stringify(query)}.${res.endpoint}`,
    };
  });

  return {
    embeds,
  };
}

export const nsbxScraper = makeSourcerer({
  id: 'nsbx',
  name: 'NSBX',
  rank: 150,
  flags: [flags.CORS_ALLOWED],
  disabled: false,
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
