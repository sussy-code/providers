import { makeSourcerer } from '@/providers/base';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { getFlixhqSourceDetails, getFlixhqSources } from '@/providers/sources/flixhq/scrape';
import { getFlixhqId } from '@/providers/sources/flixhq/search';
import { NotFoundError } from '@/utils/errors';

// TODO tv shows are available in flixHQ, just no scraper yet
export const flixhqScraper = makeSourcerer({
  id: 'flixhq',
  name: 'FlixHQ',
  rank: 100,
  async scrapeMovie(ctx) {
    const id = await getFlixhqId(ctx, ctx.media);
    if (!id) throw new NotFoundError();

    const sources = await getFlixhqSources(ctx, id);
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
});
