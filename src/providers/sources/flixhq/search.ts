import { load } from 'cheerio';

import { IMovieResult, MovieMedia, ShowMedia } from '@/main/media';
import { flixHqBase } from '@/providers/sources/flixhq/common';
import { compareTwoStrings } from '@/utils/compare';
import { ScrapeContext } from '@/utils/context';

export async function getFlixhqId(ctx: ScrapeContext, media: MovieMedia | ShowMedia): Promise<string | null> {
  const title = media.title.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase();
  const searchResults = await ctx.proxiedFetcher<string>(`/search/${title.replace(/[\W_]+/g, '-')}`, {
    baseUrl: flixHqBase,
  });

  let results: IMovieResult[] = [];

  const doc = load(searchResults);

  doc('.film_list-wrap > div.flw-item').each((i, el) => {
    const query = doc(el);

    const releaseDate = query.find('div.film-detail > div.fd-infor > span:nth-child(1)').text();
    results.push({
      id: query.find('div.film-poster > a').attr('href')?.slice(1) || '',
      title: query.find('div.film-detail > h2 > a').attr('title') || '',
      year: Number.isNaN(parseInt(releaseDate, 10)) ? undefined : releaseDate,
      seasons: releaseDate.includes('SS') ? parseInt(releaseDate.split('SS')[1], 10) : undefined,
      type: query.find('div.film-detail > div.fd-infor > span.float-right').text() === 'Movie' ? 'movie' : 'show',
    });
  });

  if (results.length === 0) return null;

  results.sort((a, b) => {
    const targetTitle = title;

    const firstTitle: string = typeof a.title === 'string' ? a.title : '';
    const secondTitle: string = typeof b.title === 'string' ? b.title : '';

    const firstRating = compareTwoStrings(targetTitle, firstTitle.toLowerCase());
    const secondRating = compareTwoStrings(targetTitle, secondTitle.toLowerCase());

    return secondRating - firstRating;
  });

  // eslint-disable-next-line array-callback-return
  results = results.filter((result) => {
    if (media.type === 'movie') return (result.type as string) === 'movie';
    // eslint-disable-next-line no-else-return
    else if (media.type === 'show') return (result.type as string) === 'show';
    else return result;
  });

  if (media && (media as ShowMedia).season && media.type === 'show') {
    results = results.filter((result) => {
      const totalSeasons = (result.seasons as number) || 0;
      const extraDataSeasons = (media.totalSeasons as number) || 0;
      return (
        totalSeasons === extraDataSeasons ||
        totalSeasons === extraDataSeasons + 1 ||
        totalSeasons === extraDataSeasons - 1
      );
    });
  }

  return results[0]?.id;
}
