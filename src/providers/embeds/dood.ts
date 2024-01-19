import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

export const doodScraper = makeEmbed({
  id: 'dood',
  name: 'dood',
  rank: 173,
  async scrape(ctx) {
    function makeTheFunny() {
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;

      for (let i = 0; i < 10; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }

      return result;
    }

    const baseUrl = 'https://do0od.com';

    const id = ctx.url.split('/d/')[1] || ctx.url.split('/e/')[1];
    console.log(id);

    const doodData = await ctx.proxiedFetcher<string>(`/e/${id}`, {
      method: 'GET',
      baseUrl,
    });

    // console.log(doodData);

    const dataForLater = doodData.split(`a+"?token=`)[1].split(`"`)[0];
    const path = doodData.split(`$.get('/pass_md5`)[1].split(`'`)[0];

    const doodPage = await ctx.proxiedFetcher<string>(`/pass_md5/${path}`, {
      headers: {
        referer: `${baseUrl}/e/${id}`,
      },
      method: 'GET',
      baseUrl,
    });

    console.log(`${baseUrl}/pass_md5/${path}`);

    console.log(doodPage);

    // const doodPage = await ctx.proxiedFetcher<string>(`/download/${path}`, { method: 'GET', baseUrl });
    // console.log(doodPage);
    const downloadURL = `${doodPage}${makeTheFunny()}?token=${dataForLater}${Date.now()}`;

    if (downloadURL) {
      return {
        stream: [
          {
            id: 'primary',
            type: 'file',
            url: downloadURL,
            flags: [flags.CORS_ALLOWED],
            captions: [],
            qualities: {
              unknown: {
                type: 'mp4',
                url: downloadURL,
                preferredHeaders: {
                  referer: 'https://do0od.com/',
                  'content-type': 'video/mp4',
                  range: 'bytes=0-',
                },
              },
            },
          },
        ],
      };
    }

    throw new Error('wootly source not found');
  },
});
