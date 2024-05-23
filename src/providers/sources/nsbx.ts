import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

export const baseUrl = 'https://api.nsbx.ru';

export const headers = {
  Origin: 'https://extension.works.again.with.nsbx',
  Referer: 'https://extension.works.again.with.nsbx',
};

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const query = {
    title: ctx.media.title,
    releaseYear: ctx.media.releaseYear,
    tmdbId: ctx.media.tmdbId,
    imdbId: ctx.media.imdbId,
    type: ctx.media.type,
    season: '',
    episode: '',
  };

  if (ctx.media.type === 'show') {
    query.season = ctx.media.season.number.toString();
    query.episode = ctx.media.episode.number.toString();
  }

  const res = await ctx.fetcher(`${baseUrl}/status`, {
    headers,
  });

  if (res.providers?.length === 0) {
    throw new NotFoundError('No providers available');
  }

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

export const nsbxScraper = makeSourcerer({
  id: 'nsbx',
  name: 'NSBX',
  rank: 150,
  flags: [flags.CORS_ALLOWED],
  disabled: false,
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
