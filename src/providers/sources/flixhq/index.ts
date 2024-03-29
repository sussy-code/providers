import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, makeSourcerer } from '@/providers/base';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { vidCloudScraper } from '@/providers/embeds/vidcloud';
import { getFlixhqMovieSources, getFlixhqShowSources, getFlixhqSourceDetails } from '@/providers/sources/flixhq/scrape';
import { getFlixhqId } from '@/providers/sources/flixhq/search';
import { NotFoundError } from '@/utils/errors';

export const flixhqScraper = makeSourcerer({
  id: 'flixhq',
  name: 'FlixHQ',
  rank: 61,
  flags: [flags.CORS_ALLOWED],
  disabled: true,
  async scrapeMovie(ctx) {
    const id = await getFlixhqId(ctx, ctx.media);
    if (!id) throw new NotFoundError('no search results match');

    const sources = await getFlixhqMovieSources(ctx, ctx.media, id);

    const embeds: SourcererEmbed[] = [];

    for (const source of sources) {
      if (source.embed.toLowerCase() === 'upcloud') {
        embeds.push({
          embedId: upcloudScraper.id,
          url: await getFlixhqSourceDetails(ctx, source.episodeId),
        });
      } else if (source.embed.toLowerCase() === 'vidcloud') {
        embeds.push({
          embedId: vidCloudScraper.id,
          url: await getFlixhqSourceDetails(ctx, source.episodeId),
        });
      }
    }

    return {
      embeds,
    };
  },
  async scrapeShow(ctx) {
    const id = await getFlixhqId(ctx, ctx.media);
    if (!id) throw new NotFoundError('no search results match');

    const sources = await getFlixhqShowSources(ctx, ctx.media, id);

    const embeds: SourcererEmbed[] = [];
    for (const source of sources) {
      if (source.embed.toLowerCase() === 'server upcloud') {
        embeds.push({
          embedId: upcloudScraper.id,
          url: await getFlixhqSourceDetails(ctx, source.episodeId),
        });
      } else if (source.embed.toLowerCase() === 'server vidcloud') {
        embeds.push({
          embedId: vidCloudScraper.id,
          url: await getFlixhqSourceDetails(ctx, source.episodeId),
        });
      }
    }

    return {
      embeds,
    };
  },
});
