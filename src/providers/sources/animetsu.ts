import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { getAnilistIdFromMedia } from '@/utils/anilist';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const anilistId = await getAnilistIdFromMedia(ctx, ctx.media);

  const query: any = {
    type: ctx.media.type,
    title: ctx.media.title,
    tmdbId: ctx.media.tmdbId,
    imdbId: ctx.media.imdbId,
    anilistId,
    ...(ctx.media.type === 'show' && {
      season: ctx.media.season.number,
      episode: ctx.media.episode.number,
    }),
    ...(ctx.media.type === 'movie' && { episode: 1 }),
    releaseYear: ctx.media.releaseYear,
  };

  return {
    embeds: [
      {
        embedId: 'animetsu-pahe',
        url: JSON.stringify(query),
      },
      {
        embedId: 'animetsu-zoro',
        url: JSON.stringify(query),
      },
      {
        embedId: 'animetsu-zaza',
        url: JSON.stringify(query),
      },
      {
        embedId: 'animetsu-meg',
        url: JSON.stringify(query),
      },
      {
        embedId: 'animetsu-bato',
        url: JSON.stringify(query),
      },
    ],
  };
}

export const animetsuScraper = makeSourcerer({
  id: 'animetsu',
  name: 'Animetsu',
  rank: 9,
  flags: [],
  scrapeShow: comboScraper,
});
