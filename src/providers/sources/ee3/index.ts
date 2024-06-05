import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { Caption } from '@/providers/captions';
import { compareMedia } from '@/utils/compare';
import { MovieScrapeContext } from '@/utils/context';
import { makeCookieHeader } from '@/utils/cookie';
import { NotFoundError } from '@/utils/errors';

import { baseUrl, password, username } from './common';
import { itemDetails, renewResponse } from './types';
import { login, parseSearch } from './utils';

// this source only has movies
async function comboScraper(ctx: MovieScrapeContext): Promise<SourcererOutput> {
  const pass = await login(username, password, ctx);
  if (!pass) throw new Error('Login failed');

  const search = parseSearch(
    await ctx.proxiedFetcher<string>('/get', {
      baseUrl,
      method: 'POST',
      body: new URLSearchParams({ query: ctx.media.title, action: 'search' }),
      headers: {
        cookie: makeCookieHeader({ PHPSESSID: pass }),
      },
    }),
  );

  const id = search.find((v) => v && compareMedia(ctx.media, v.title, v.year))?.id;
  if (!id) throw new NotFoundError('No watchable item found');

  const details: itemDetails = JSON.parse(
    await ctx.proxiedFetcher<string>('/get', {
      baseUrl,
      method: 'POST',
      body: new URLSearchParams({ id, action: 'get_movie_info' }),
      headers: {
        cookie: makeCookieHeader({ PHPSESSID: pass }),
      },
    }),
  );
  if (!details.message.video) throw new Error('Failed to get the stream');

  const keyParams: renewResponse = JSON.parse(
    await ctx.proxiedFetcher<string>('/renew', {
      baseUrl,
      method: 'POST',
      headers: {
        cookie: makeCookieHeader({ PHPSESSID: pass }),
      },
    }),
  );
  if (!keyParams.k) throw new Error('Failed to get the key');

  const server = details.message.server === '1' ? 'https://vid.ee3.me/vid/' : 'https://vault.rips.cc/video/';
  const k = keyParams.k;
  const url = `${server}${details.message.video}?${new URLSearchParams({ k })}`;
  const captions: Caption[] = [];

  // this how they actually deal with subtitles
  if (details.message.subs?.toLowerCase() === 'yes' && details.message.imdbID) {
    captions.push({
      id: `https://rips.cc/subs/${details.message.imdbID}.vtt`,
      url: `https://rips.cc/subs/${details.message.imdbID}.vtt`,
      type: 'vtt',
      hasCorsRestrictions: false,
      language: 'en',
    });
  }

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'file',
        flags: [flags.CORS_ALLOWED],
        captions,
        qualities: {
          // should be unknown, but all the videos are 720p
          720: {
            type: 'mp4',
            url,
          },
        },
      },
    ],
  };
}

export const ee3Scraper = makeSourcerer({
  id: 'ee3',
  name: 'EE3',
  rank: 111,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
});
