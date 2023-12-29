import { load } from 'cheerio';
import { unpack } from 'unpacker';

import { flags } from '@/entrypoint/utils/targets';
import { NotFoundError } from '@/utils/errors';

import { makeEmbed } from '../base';

const referer = 'https://ridomovies.tv/';

export const ridooScraper = makeEmbed({
  id: 'ridoo',
  name: 'Ridoo',
  rank: 500,
  async scrape(ctx) {
    const res = await ctx.proxiedFetcher<string>(ctx.url, {
      headers: {
        referer,
      },
    });
    const $ = load(res);
    const evalCode = $('script')
      .filter((_, el) => {
        const script = $(el);
        return (script.attr('type') === 'text/javascript' && script.html()?.includes('eval')) ?? false;
      })
      .html();
    if (!evalCode) throw new Error(res);
    const decoded = unpack(evalCode);
    const regexPattern = /file:"([^"]+)"/g;
    const url = regexPattern.exec(decoded)?.[1];
    if (!url) throw new NotFoundError('Unable to find source url');

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: url,
          captions: [],
          flags: [flags.CORS_ALLOWED],
        },
      ],
    };
  },
});
