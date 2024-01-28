import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

export const wootlyScraper = makeEmbed({
  id: 'wootly',
  name: 'wootly',
  rank: 172,
  async scrape(ctx) {
    const baseUrl = 'https://www.wootly.ch';

    const wootlyData = await ctx.proxiedFetcher.full<string>(ctx.url, {
      method: 'GET',
      readHeaders: ['Set-Cookie'],
    });

    const wootssesCookie = wootlyData.headers.get('Set-Cookie')?.match(/wootsses=([^;]+)/)?.[1];

    let $ = load(wootlyData.body); // load the html data
    const iframeSrc = $('iframe').attr('src') ?? '';

    const woozCookieRequest = await ctx.proxiedFetcher.full<string>(iframeSrc, {
      method: 'GET',
      readHeaders: ['Set-Cookie'],
      headers: {
        cookie: `wootsses=${wootssesCookie};`,
      },
    });

    const woozCookie = woozCookieRequest.headers.get('Set-Cookie')?.match(/wooz=([^;]+)/)?.[1];

    const iframeData = await ctx.proxiedFetcher<string>(iframeSrc, {
      method: 'POST',
      body: new URLSearchParams({ qdf: '1' }),
      headers: {
        cookie: `wooz=${woozCookie}`,
        Referer: iframeSrc,
      },
    });

    $ = load(iframeData);

    const scriptText = $('script').html() ?? '';

    // Regular expressions to match the variables

    const tk = scriptText.match(/tk=([^;]+)/)?.[0].replace(/tk=|["\s]/g, '');
    const vd = scriptText.match(/vd=([^,]+)/)?.[0].replace(/vd=|["\s]/g, '');

    if (!tk || !vd) throw new Error('wootly source not found');

    const url = await ctx.proxiedFetcher<string>(`/grabd`, {
      baseUrl,
      query: { t: tk, id: vd },
      method: 'GET',
      headers: {
        cookie: `wooz=${woozCookie}; wootsses=${wootssesCookie};`,
      },
    });

    if (!url) throw new Error('wootly source not found');

    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
          url,
          flags: [flags.IP_LOCKED],
          captions: [],
          qualities: {
            unknown: {
              type: 'mp4',
              url,
            },
          },
        },
      ],
    };
  },
});
