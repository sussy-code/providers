import { load } from 'cheerio';

import { MovieMedia, ShowMedia } from '@/entrypoint/utils/media';
import { zoeBase } from '@/providers/sources/zoechip/common';
import { compareMedia } from '@/utils/compare';
import { ScrapeContext } from '@/utils/context';

export async function getZoeChipSearchResults(ctx: ScrapeContext, media: MovieMedia | ShowMedia) {
  const titleCleaned = media.title.toLocaleLowerCase().replace(/ /g, '-');

  const html = await ctx.proxiedFetcher<string>(`/search/${titleCleaned}`, {
    baseUrl: zoeBase,
  });

  const $ = load(html);
  return $('.film_list-wrap .flw-item .film-detail')
    .toArray()
    .map((element) => {
      const movie = $(element);
      const anchor = movie.find('.film-name a');
      const info = movie.find('.fd-infor');

      const title = anchor.attr('title');
      const href = anchor.attr('href');
      const type = info.find('.fdi-type').html();
      let year = info.find('.fdi-item').html();
      const id = href?.split('-').pop();

      if (!title) {
        return null;
      }

      if (!href) {
        return null;
      }

      if (!type) {
        return null;
      }

      // TV shows on ZoeChip do not have a year in their search results
      // Allow TV shows to pass this failure
      if (!year || Number.isNaN(Number(year))) {
        if (type === 'TV') {
          year = '0';
        } else {
          return null;
        }
      }

      if (!id) {
        return null;
      }

      return {
        title,
        year: Number(year),
        id,
        type,
        href,
      };
    });
}

export async function getZoeChipMovieID(ctx: ScrapeContext, media: MovieMedia): Promise<string | null> {
  const searchResults = await getZoeChipSearchResults(ctx, media);

  const matchingItem = searchResults.find((v) => v && v.type === 'Movie' && compareMedia(media, v.title, v.year));

  if (!matchingItem) {
    return null;
  }

  return matchingItem.id;
}

export async function getZoeChipShowID(ctx: ScrapeContext, media: ShowMedia): Promise<string | null> {
  // ZoeChip TV shows don't have a year on their search results
  // This makes it hard to filter between shows with the same name
  // To find the year, we must query each shows details page
  // This is slower, but more reliable

  const releasedRegex = /<\/strong><\/span> (\d.*)-\d.*-\d.*/;
  const searchResults = await getZoeChipSearchResults(ctx, media);

  const filtered = searchResults.filter((v) => v && v.type === 'TV' && compareMedia(media, v.title));

  for (const result of filtered) {
    // This gets filtered above but the linter Gods don't think so
    if (!result) {
      continue;
    }

    const html = await ctx.proxiedFetcher<string>(result.href, {
      baseUrl: zoeBase,
    });

    // The HTML is not structured in a way that makes using Cheerio clean
    // There are no unique IDs or classes to query, resulting in long ugly queries
    // Regex is faster and cleaner in this case
    const regexResult = html.match(releasedRegex);
    if (regexResult) {
      const year = Number(regexResult[1]);
      if (!Number.isNaN(year) && compareMedia(media, result.title, year)) {
        return result.id;
      }
    }
  }

  return null;
}
