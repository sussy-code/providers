import { load } from 'cheerio';

import type { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { embedProviders, kissasianBase } from './common';

export async function getEmbeds(
  ctx: ScrapeContext,
  targetEpisode: {
    number: string;
    url?: string;
  },
) {
  let embeds = await Promise.all(
    embedProviders.map(async (provider) => {
      if (!targetEpisode.url) throw new NotFoundError('Episode not found');
      const watch = await ctx.proxiedFetcher<string>(`${targetEpisode.url}&s=${provider.id}`, {
        baseUrl: kissasianBase,
        headers: {
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'accept-language': 'en-US,en;q=0.9',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
          'sec-ch-ua': '"Not)A;Brand";v="24", "Chromium";v="116"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'cross-site',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1',
          cookie:
            '__rd=; ASP.NET_SessionId=jwnl2kmlw5h4mfdaxvpk30q0; k_token=OKbJDFNx3rUtaw7iAA6UxMKSJb79lgZ2X2rVC9aupJhycYQKVSLaW1y2B4K%2f%2fo3i6BuzhXgfkJGmKlKH6LpNlKPPpZUk31n9DapfMdJgjlLExgrPS3jpSKwGnNUI%2bOpNpZu9%2fFnkLZRxvVKCa8APMxrck1tYkKXWqfyJJh8%2b7hQTI1wfAOU%2fLEouHhtQGL%2fReTzElw2LQ0XSL1pjs%2fkWW3rM3of2je7Oo13I%2f7olLFuiJUVWyNbn%2fYKSgNrm%2bQ3p',
        },
      });

      const watchPage = load(watch);

      const embedUrl = watchPage('#my_video_1').attr('src');

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
