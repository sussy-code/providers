import { customAlphabet } from 'nanoid';

import { makeEmbed } from '@/providers/base';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 10);

export const doodScraper = makeEmbed({
  id: 'dood',
  name: 'dood',
  rank: 173,
  async scrape(ctx) {
    const baseUrl = 'https://do0od.com';

    const id = ctx.url.split('/d/')[1] || ctx.url.split('/e/')[1];

    const doodData = await ctx.proxiedFetcher<string>(`/e/${id}`, {
      method: 'GET',
      baseUrl,
    });

    const dataForLater = doodData.match(/a\+"\?token=([^"]+)/)?.[1];
    const path = doodData.match(/\$\.get\('\/pass_md5([^']+)/)?.[1];

    const doodPage = await ctx.proxiedFetcher<string>(`/pass_md5/${path}`, {
      headers: {
        referer: `${baseUrl}/e/${id}`,
      },
      method: 'GET',
      baseUrl,
    });

    const downloadURL = `${doodPage}${nanoid()}?token=${dataForLater}${Date.now()}`;

    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
          flags: [],
          captions: [],
          qualities: {
            unknown: {
              type: 'mp4',
              url: downloadURL,
              headers: {
                referer: 'https://do0od.com/',
              },
            },
          },
        },
      ],
    };
  },
});
