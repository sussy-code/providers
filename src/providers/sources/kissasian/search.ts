import { load } from 'cheerio';
import FormData from 'form-data';

import { ScrapeContext } from '@/utils/context';

import { kissasianBase } from './common';

export async function search(ctx: ScrapeContext, title: string, seasonNumber?: number) {
  const searchForm = new FormData();
  searchForm.append('keyword', `${title} ${seasonNumber ?? ''}`.trim());
  searchForm.append('type', 'Drama');

  const searchResults = await ctx.proxiedFetcher<string>('/Search/SearchSuggest', {
    baseUrl: kissasianBase,
    method: 'POST',
    body: searchForm,
  });

  const searchPage = load(searchResults);

  return Array.from(searchPage('a')).map((drama) => {
    return {
      name: searchPage(drama).text(),
      url: drama.attribs.href,
    };
  });
}
