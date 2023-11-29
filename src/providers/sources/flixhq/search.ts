import { load } from 'cheerio';

import { MovieMedia, ShowMedia } from '@/main/media';
import { flixHqBase } from '@/providers/sources/flixhq/common';
import { getSimilarityBetweenStrings } from '@/utils/compare';
import { ScrapeContext } from '@/utils/context';

export async function getFlixhqId(ctx: ScrapeContext, media: MovieMedia | ShowMedia): Promise<string | null> {
  const mediaTitle = media.title.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase();
  const searchResults = await ctx.proxiedFetcher<string>(`/search/${mediaTitle.replace(/[\W_]+/g, '-')}`, {
    baseUrl: flixHqBase,
  });

  const doc = load(searchResults);

  let results = doc('.film_list-wrap > div.flw-item')
    .toArray()
    .map((el) => {
      const query = doc(el);
      const id = query.find('div.film-poster > a').attr('href')?.slice(1);
      const title = query.find('div.film-detail > h2 > a').attr('title');
      const year = query.find('div.film-detail > div.fd-infor > span:nth-child(1)').text();
      const type =
        query.find('div.film-detail > div.fd-infor > span.float-right').text() === 'Movie' ? 'movie' : 'show';

      if (!id || !title || !year || !type) return null;
      return {
        id,
        title,
        year: parseInt(year, 10),
        type,
      };
    });

  if (results.length === 0) return null;

  results.sort((a, b) => {
    const targetTitle = mediaTitle;

    const firstTitle: string = a?.title === 'string' ? a.title : '';
    const secondTitle: string = b?.title === 'string' ? b.title : '';

    const firstRating = getSimilarityBetweenStrings(targetTitle, firstTitle.toLowerCase());
    const secondRating = getSimilarityBetweenStrings(targetTitle, secondTitle.toLowerCase());

    return secondRating - firstRating;
  });

  results = results.filter((result) => {
    if (media.type === 'movie') return result?.type === 'movie';
    if (media.type === 'show') return result?.type === 'show';
    return false;
  });

  return results[0]?.id ?? null;
}
