import { load } from 'cheerio';

import { ScrapeContext } from '@/utils/context';

import { EmbedsResult } from './type';

export async function getEmbeds(ctx: ScrapeContext, id: string): Promise<EmbedsResult> {
  const data = await ctx.fetcher.full(`/${id}`, {
    baseUrl: 'https://ww1.goojara.to',
    headers: {
      accept: '*/*',
      'content-type': 'application/x-www-form-urlencoded',
      Referer: 'https://www.goojara.to/',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    readHeaders: ['Set-Cookie'],
    method: 'GET',
  });

  const aGoozCookie = data.headers.get('Set-Cookie')?.split(';')[0].split('aGooz=')[1];
  const $ = load(data.body);
  const RandomCookieName = data.body.split(`_3chk('`)[1].split(`'`)[0];
  const RandomCookieValue = data.body.split(`_3chk('`)[1].split(`'`)[2];

  const embedRedirectURLs = $('a')
    .map((index, element) => $(element).attr('href'))
    .get()
    .filter((href) => href && href.includes('https://ww1.goojara.to/go.php'));

  const embeds = await Promise.all(
    embedRedirectURLs.map((url) =>
      ctx.fetcher
        .full(url, {
          headers: {
            cookie: `aGooz=${aGoozCookie}; ${RandomCookieName}=${RandomCookieValue};`,
            Referer: 'https://ww1.goojara.to/eJwD5z',
          },
          method: 'GET',
        })
        .then((result) => {
          if (result) {
            const embedId = ['wootly', 'upstream', 'mixdrop', 'dood'].find((a) => result.finalUrl.includes(a));
            return embedId ? { embedId, url: result.finalUrl } : null;
          }
          return null;
        })
        .catch(() => null),
    ),
  ).then((results) => results.filter((result) => result !== null) as EmbedsResult);

  return embeds;
}
