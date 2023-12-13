import { flags } from '@/main/targets';
import { makeSourcerer } from '@/providers/base';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { getFlixhqMovieSources, getFlixhqShowSources, getFlixhqSourceDetails } from '@/providers/sources/flixhq/scrape';
import { getFlixhqId } from '@/providers/sources/flixhq/search';
import { NotFoundError } from '@/utils/errors';

export const flixhqScraper = makeSourcerer({
  id: 'flixhq',
  name: 'FlixHQ',
  rank: 100,
  flags: [flags.NO_CORS],
  async scrapeMovie(ctx) {
    const id = await getFlixhqId(ctx, ctx.media);
    if (!id) throw new NotFoundError('no search results match');

    const sources = await getFlixhqMovieSources(ctx, ctx.media, id);
    const upcloudStream = sources.find((v) => v.embed.toLowerCase() === 'upcloud');
    if (!upcloudStream) throw new NotFoundError('upcloud stream not found for flixhq');

    return {
      embeds: [
        {
          embedId: upcloudScraper.id,
          url: await getFlixhqSourceDetails(ctx, upcloudStream.episodeId),
        },
      ],
    };
  },
  async scrapeShow(ctx) {
    const id = await getFlixhqId(ctx, ctx.media);
    if (!id) throw new NotFoundError('no search results match');

    const sources = await getFlixhqShowSources(ctx, ctx.media, id);
    const upcloudStream = sources.find((v) => v.embed.toLowerCase() === 'server upcloud');
    if (!upcloudStream) throw new NotFoundError('upcloud stream not found for flixhq');

    return {
      embeds: [
        {
          embedId: upcloudScraper.id,
          url: await getFlixhqSourceDetails(ctx, upcloudStream.episodeId),
        },
      ],
    };
  },
});
