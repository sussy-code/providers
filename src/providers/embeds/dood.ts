import { customAlphabet } from 'nanoid';

import { makeEmbed } from '@/providers/base';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 10);
const baseUrl = 'https://d000d.com';

export const doodScraper = makeEmbed({
  id: 'dood',
  name: 'dood',
  rank: 173,
  async scrape(ctx) {
    let url = ctx.url;
    if (ctx.url.includes('primewire')) {
      const request = await ctx.proxiedFetcher.full(ctx.url);
      url = request.finalUrl;
    }

    const id = url.split('/d/')[1] || url.split('/e/')[1];

    const doodData = await ctx.proxiedFetcher<string>(`/e/${id}`, {
      method: 'GET',
      baseUrl,
    });

    const dataForLater = doodData.match(/\?token=([^&]+)&expiry=/)?.[1];
    const path = doodData.match(/\$\.get\('\/pass_md5([^']+)/)?.[1];

    const doodPage = await ctx.proxiedFetcher<string>(`/pass_md5${path}`, {
      headers: {
        Referer: `${baseUrl}/e/${id}`,
      },
      method: 'GET',
      baseUrl,
    });
    const downloadURL = `${doodPage}${nanoid()}?token=${dataForLater}&expiry=${Date.now()}`;

    if (!downloadURL.startsWith('http')) throw new Error('Invalid URL');

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
            },
          },
          headers: {
            Referer: baseUrl,
          },
        },
      ],
    };
  },
});
