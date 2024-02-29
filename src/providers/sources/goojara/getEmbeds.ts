import { load } from 'cheerio';

import { ScrapeContext } from '@/utils/context';
import { makeCookieHeader, parseSetCookie } from '@/utils/cookie';

import { EmbedsResult, baseUrl, baseUrl2 } from './type';

export async function getEmbeds(ctx: ScrapeContext, id: string): Promise<EmbedsResult> {
  const data = await ctx.fetcher.full(`/${id}`, {
    baseUrl: baseUrl2,
    headers: {
      Referer: baseUrl,
      cookie: '',
    },
    readHeaders: ['Set-Cookie'],
    method: 'GET',
  });

  const cookies = parseSetCookie(data.headers.get('Set-Cookie') || '');
  const RandomCookieName = data.body.split(`_3chk('`)[1].split(`'`)[0];
  const RandomCookieValue = data.body.split(`_3chk('`)[1].split(`'`)[2];

  let aGoozCookie = '';
  let cookie = '';
  if (cookies && cookies.aGooz && RandomCookieName && RandomCookieValue) {
    aGoozCookie = cookies.aGooz.value;
    cookie = makeCookieHeader({
      aGooz: aGoozCookie,
      [RandomCookieName]: RandomCookieValue,
    });
  }

  const $ = load(data.body);

  const embedRedirectURLs = $('a')
    .map((index, element) => $(element).attr('href'))
    .get()
    .filter((href) => href && href.includes(`${baseUrl2}/go.php`));

  const embedPages = await Promise.all(
    embedRedirectURLs.map(
      (url) =>
        ctx.fetcher
          .full(url, {
            headers: {
              cookie,
              Referer: baseUrl2,
            },
            method: 'GET',
          })
          .catch(() => null), // Handle errors gracefully
    ),
  );

  // Initialize an array to hold the results
  const results: EmbedsResult = [];

  // Process each page result
  for (const result of embedPages) {
    if (result) {
      const embedId = ['wootly', 'upstream', 'mixdrop', 'dood'].find((a) => result.finalUrl.includes(a));
      if (embedId) {
        results.push({ embedId, url: result.finalUrl });
      }
    }
  }

  return results;
}
