import { load } from 'cheerio';

import { MovieMedia, ShowMedia } from '@/main/media';
import { flixHqBase } from '@/providers/sources/flixhq/common';
import { compareMedia } from '@/utils/compare';
import { ScrapeContext } from '@/utils/context';

export async function getFlixhqId(ctx: ScrapeContext, media: MovieMedia | ShowMedia): Promise<string | null> {
  const searchResults = await ctx.proxiedFetcher<string>(`/search/${media.title.replaceAll(/[^a-z0-9A-Z]/g, '-')}`, {
    baseUrl: flixHqBase,
  });

  const doc = load(searchResults);
  const items = doc('.film_list-wrap > div.flw-item')
    .toArray()
    .map((el) => {
      const query = doc(el);
      const id = query.find('div.film-poster > a').attr('href')?.slice(1);
      const title = query.find('div.film-detail > h2 > a').attr('title');
      const year = query.find('div.film-detail > div.fd-infor > span:nth-child(1)').text();

      if (!id || !title || !year) return null;
      return {
        id,
        title,
        year: parseInt(year, 10),
      };
    });

  const matchingItem = items.find((v) => v && compareMedia(media, v.title, v.year));

  if (!matchingItem) return null;
  return matchingItem.id;
}
