import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { SearchResults } from './types';
import { compareTitle } from '@/utils/compare';

const nepuBase = 'https://nepu.to';
const nepuReferer = `${nepuBase}/`;

const universalScraper = async (ctx: MovieScrapeContext | ShowScrapeContext) => {
  const searchResultRequest = await ctx.proxiedFetcher('/ajax/posts', {
    baseUrl: nepuBase,
    query: {
      q: ctx.media.title,
    },
  });

  // json isn't parsed by proxiedFetcher due to content-type being text/html.
  const searchResult = JSON.parse(searchResultRequest) as SearchResults;

  const show = searchResult.data.find((item) => {
    if (!item) return false;
    if (ctx.media.type === 'movie' && item.type !== "Movie") return false;
    if (ctx.media.type === "show" && item.type !== "Serie") return false

    return compareTitle(ctx.media.title, item.name);
  });

  if (!show) throw new NotFoundError('No watchable item found');

  let videoUrl = show.url;

  if (ctx.media.type === 'show') {
    videoUrl = `${show.url}/season/${ctx.media.season.number}/episode/${ctx.media.episode.number}`;
  }

  const videoPage = await ctx.proxiedFetcher(videoUrl, {
    baseUrl: nepuBase,
  });
  const videoPage$ = load(videoPage);
  const embedId = videoPage$('a.btn-service').attr('data-embed');

  if (!embedId) throw new NotFoundError('No embed found.');

  const playerPage = await ctx.proxiedFetcher('/ajax/embed', {
    method: 'POST',
    baseUrl: nepuBase,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `id=${embedId}`,
  });

  const streamUrl = playerPage.match(/"file":"(http[^"]+)"/);

  if (!streamUrl) throw new NotFoundError('No stream found.');

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        captions: [],
        playlist: streamUrl[1],
        type: 'hls',
        flags: [flags.CORS_ALLOWED],
        preferredHeaders: {
          Origin: nepuBase,
          Referer: nepuReferer,
        },
      },
    ],
  } as SourcererOutput;
};

export const nepuScraper = makeSourcerer({
  id: 'nepu',
  name: 'Nepu',
  rank: 111,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: universalScraper,
  scrapeShow: universalScraper,
});
