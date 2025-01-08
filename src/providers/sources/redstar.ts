import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const universalScraper = async (ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> => {
  try {
    const res = await ctx.fetcher.full('https://red-star.ningai.workers.dev/scrape/showbox', {
      query: {
        type: ctx.media.type,
        title: ctx.media.title,
        releaseYear: ctx.media.releaseYear.toString(),
        tmdbId: ctx.media.tmdbId,
        imdbId: ctx.media.imdbId ?? '',
        ...(ctx.media.type === 'show' && {
          episodeNumber: ctx.media.episode.number.toString(),
          episodeTmdbId: ctx.media.episode.tmdbId,
          seasonNumber: ctx.media.season.number.toString(),
          seasonTmdbId: ctx.media.season.tmdbId,
        }),
      },
    });

    if (res.statusCode === 200 && res.body.stream?.length)
      return { stream: res.body.stream, embeds: [] } as SourcererOutput;
    if (res.statusCode === 404) throw new NotFoundError('No watchable item found');

    throw new Error(res.body.message ?? 'An error has occurred!');
  } catch (e: any) {
    if (e instanceof NotFoundError) throw new NotFoundError(e.message);
    throw new Error(e.message ?? 'An error has occurred!');
  }
};

export const redStarScraper = makeSourcerer({
  id: 'redstar',
  name: 'redStar',
  disabled: true,
  externalSource: true,
  rank: 280,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: universalScraper,
  scrapeShow: universalScraper,
});
