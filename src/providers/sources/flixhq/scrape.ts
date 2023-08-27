import { load } from 'cheerio';

import { flixHqBase } from '@/providers/sources/flixhq/common';
import { ScrapeContext } from '@/utils/context';

export async function getFlixhqSources(ctx: ScrapeContext, id: string) {
  const type = id.split('/')[0];
  const episodeParts = id.split('-');
  const episodeId = episodeParts[episodeParts.length - 1];

  const data = await ctx.proxiedFetcher<string>(`/ajax/${type}/episodes/${episodeId}`, {
    baseUrl: flixHqBase,
  });
  const doc = load(data);
  const sourceLinks = doc('.nav-item > a')
    .toArray()
    .map((el) => {
      const query = doc(el);
      const embedTitle = query.attr('title');
      const linkId = query.attr('data-linkid');
      if (!embedTitle || !linkId) throw new Error('invalid sources');
      return {
        embed: embedTitle,
        episodeId: linkId,
      };
    });

  return sourceLinks;
}

export async function getFlixhqSourceDetails(ctx: ScrapeContext, sourceId: string): Promise<string> {
  const jsonData = await ctx.proxiedFetcher<Record<string, any>>(`/ajax/sources/${sourceId}`, {
    baseUrl: flixHqBase,
  });

  return jsonData.link;
}
