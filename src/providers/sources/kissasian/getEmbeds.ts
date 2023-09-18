import { load } from 'cheerio';

import type { ScrapeContext } from '@/utils/context';

import { embedProviders, kissasianBase } from './common';

export async function getEmbeds(
  ctx: ScrapeContext,
  targetEpisode: {
    number: string;
    url: string;
  },
) {
  let embeds = await Promise.all(
    embedProviders.map(async (provider) => {
      const watch = await ctx.proxiedFetcher<any>(targetEpisode.url, {
        baseUrl: kissasianBase,
        query: {
          s: provider.id,
        },
      });

      const watchPage = load(watch);

      const embedUrl = watchPage('iframe[id=my_video_1]').attr('src');

      if (!embedUrl) throw new Error('Embed not found');

      return {
        embedId: provider.id,
        url: embedUrl,
      };
    }),
  );

  embeds = embeds.filter((e) => !!e.url);

  return embeds;
}
