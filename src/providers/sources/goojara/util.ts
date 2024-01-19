import { load } from 'cheerio';

import { MovieMedia, ShowMedia } from '@/entrypoint/utils/media';
import { compareMedia } from '@/utils/compare';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { getEmbeds } from './getEmbeds';
import { Result, EmbedsResult } from './type';

const headersData = {
  accept: '*/*',
  'accept-language': 'en-US,en;q=0.9',
  'content-type': 'application/x-www-form-urlencoded',
  'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  cookie: `aGooz=t9pmkdtef1b3lg3pmo1u2re816; bd9aa48e=0d7b89e8c79844e9df07a2; _b414=2151C6B12E2A88379AFF2C0DD65AC8298DEC2BF4; 9d287aaa=8f32ad589e1c4288fe152f`,
  Referer: 'https://www.goojara.to/',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export async function searchAndFindMedia(
  ctx: ScrapeContext,
  media: MovieMedia | ShowMedia,
): Promise<Result | undefined> {
  const data = await ctx.fetcher<string>(`/xhrr.php`, {
    baseUrl: 'https://www.goojara.to',
    headers: headersData,
    method: 'POST',
    body: `q=${media.title}`,
  })

  const $ = load(data);

  const results: Result[] = [];

  $('.mfeed > li').each((index, element) => {
    const title = $(element).find('strong').text();
    const yearMatch = $(element)
      .text()
      .match(/\((\d{4})\)/);
    const typeDiv = $(element).find('div').attr('class');
    const type = typeDiv === 'it' ? 'show' : typeDiv === 'im' ? 'movie' : '';
    const year = yearMatch ? yearMatch[1] : '';
    const slug = $(element).find('a').attr('href')?.split('/')[3];

    if (media.type === type) {
      results.push({ title, year, slug, type });
    }
  });

  const result = results.find((res: Result) => compareMedia(media, res.title, Number(res.year)));

  return result;
}

export async function scrapeIds(ctx: ScrapeContext, media: MovieMedia | ShowMedia, result: Result): Promise<EmbedsResult> {
  // Find the relevant id
  let id = null;
  if (media.type === 'movie') {
    id = result.slug;
  } else if (media.type === 'show') {
    const data = await ctx.fetcher<string>(`/${result.slug}`, {
      baseUrl: 'https://www.goojara.to',
      headers: headersData,
      method: 'GET',
    });

    const $1 = load(data);

    const dataId = $1('#seon').data('id');

    const data2 = await ctx.fetcher<string>(`/xhrc.php`, {
      baseUrl: 'https://ww1.goojara.to',
      headers: headersData,
      method: 'POST',
      body: `s=${media.season.number}&t=${dataId}`,
    });

    let episodeId = '';

    const $2 = load(data2);

    $2('.seho').each((index, element) => {
      // Extracting the episode number as a string
      const episodeNumber = $2(element).find('.seep .sea').text().trim();

      // Comparing with the desired episode number as a string
      if (parseInt(episodeNumber, 10) === media.episode.number) {
        const href = $2(element).find('.snfo h1 a').attr('href');
        const idMatch = href?.match(/\/([a-zA-Z0-9]+)$/);
        if (idMatch && idMatch[1]) {
          episodeId = idMatch[1];
          return false; // Break out of the loop once the episode is found
        }
      }
    });

    id = episodeId;
  }

  // Check ID
  if (id === null) throw new NotFoundError('Not found');

  const embeds = await getEmbeds(ctx, id);
  return embeds;
}
