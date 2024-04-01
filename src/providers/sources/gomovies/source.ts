import { load } from 'cheerio';

import { ScrapeContext } from '@/utils/context';

import { gomoviesBase } from '.';

export async function getSource(ctx: ScrapeContext, sources: any, title: string) {
  const source = load(sources)(`a[title*=${title} i]`);

  const sourceDataId = source?.attr('data-id') ?? source?.attr('data-linkid');

  if (!sourceDataId) return undefined;

  const sourceData = await ctx.proxiedFetcher<{
    type: 'iframe' | string;
    link: string;
    sources: [];
    title: string;
    tracks: [];
  }>(`/ajax/sources/${sourceDataId}`, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
    baseUrl: gomoviesBase,
  });

  if (!sourceData.link || sourceData.type !== 'iframe') return undefined;

  return sourceData;
}
