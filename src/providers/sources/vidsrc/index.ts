import { flags } from '@/main/targets';
import { makeSourcerer } from '@/providers/base';
import { vidplayScraper } from '@/providers/embeds/vidplay';
import {
  getVidsrcMovieSourcesId,
  getVidsrcShowSourcesId,
  getVidsrcSourceDetails,
  getVidsrcSources,
} from '@/providers/sources/vidsrc/scrape';
import { NotFoundError } from '@/utils/errors';

export const vidsrcScraper = makeSourcerer({
  id: 'vidsrc',
  name: 'VidSrc',
  rank: 355,
  flags: [flags.NO_CORS],
  async scrapeMovie(ctx) {
    const sourcesId = await getVidsrcMovieSourcesId(ctx, ctx.media);
    const sources = await getVidsrcSources(ctx, sourcesId);

    const vidplay = sources.result.find((v) => v.title.toLowerCase() === 'vidplay');
    if (!vidplay) throw new NotFoundError('vidplay stream not found for vidsrc');

    return {
      embeds: [
        {
          embedId: vidplayScraper.id,
          url: await getVidsrcSourceDetails(ctx, vidplay.id),
        },
      ],
    };
  },
  async scrapeShow(ctx) {
    const sourcesId = await getVidsrcShowSourcesId(ctx, ctx.media);
    const sources = await getVidsrcSources(ctx, sourcesId);

    const vidplay = sources.result.find((v) => v.title.toLowerCase() === 'vidplay');
    if (!vidplay) throw new NotFoundError('vidplay stream not found for vidsrc');

    return {
      embeds: [
        {
          embedId: vidplayScraper.id,
          url: await getVidsrcSourceDetails(ctx, vidplay.id),
        },
      ],
    };
  },
});
