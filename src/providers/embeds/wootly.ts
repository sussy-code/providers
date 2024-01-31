import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { makeCookieHeader, parseSetCookie } from '@/utils/cookie';

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

    const cookies = parseSetCookie(wootlyData.headers.get('Set-Cookie') || '');
    const wootssesCookie = cookies.wootsses.value;

    let $ = load(wootlyData.body); // load the html data
    const iframeSrc = $('iframe').attr('src') ?? '';

    const woozCookieRequest = await ctx.proxiedFetcher.full<string>(iframeSrc, {
      method: 'GET',
      readHeaders: ['Set-Cookie'],
      headers: {
        cookie: makeCookieHeader({ wootsses: wootssesCookie }),
      },
    });

    const woozCookies = parseSetCookie(woozCookieRequest.headers.get('Set-Cookie') || '');
    const woozCookie = woozCookies.wooz.value;

    const iframeData = await ctx.proxiedFetcher<string>(iframeSrc, {
      method: 'POST',
      body: new URLSearchParams({ qdf: '1' }),
      headers: {
        cookie: makeCookieHeader({ wooz: woozCookie }),
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
        cookie: makeCookieHeader({ wooz: woozCookie, wootsses: wootssesCookie }),
      },
    });

    if (!url) throw new Error('wootly source not found');

    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
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
