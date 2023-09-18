import { load } from 'cheerio';

import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { gomoviesBase } from '.';

export async function getSource(ctx: ScrapeContext, sources: any) {
  const upcloud = load(sources)('a[title*="upcloud" i]');

  const upcloudDataId = upcloud?.attr('data-id') ?? upcloud?.attr('data-linkid');

  if (!upcloudDataId) throw new NotFoundError('Upcloud source not available');

  const upcloudSource = await ctx.proxiedFetcher<{
    type: 'iframe' | string;
    link: string;
    sources: [];
    title: string;
    tracks: [];
  }>(`/ajax/sources/${upcloudDataId}`, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
    baseUrl: gomoviesBase,
  });

  if (!upcloudSource.link || upcloudSource.type !== 'iframe') throw new NotFoundError('No upcloud stream found');

  return upcloudSource;
}
