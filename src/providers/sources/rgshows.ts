import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { SourcererOutput, makeSourcerer } from '../base';

const baseUrl = 'api.rgshows.ru';

const headers = {
  referer: 'https://rgshows.ru/',
  origin: 'https://rgshows.ru',
  host: baseUrl,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  let url = `https://${baseUrl}/main`;

  if (ctx.media.type === 'movie') {
    url += `/movie/${ctx.media.tmdbId}`;
  } else if (ctx.media.type === 'show') {
    url += `/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  }

  const res = await ctx.proxiedFetcher(url, { headers });
  if (!res?.stream?.url) {
    throw new NotFoundError('No streams found');
  }

  if (res.stream.url === 'https://vidzee.wtf/playlist/69/master.m3u8') {
    throw new NotFoundError('Found only vidzee porn stream');
  }

  const streamUrl = res.stream.url;
  const streamHost = new URL(streamUrl).host;
  const m3u8Headers = {
    ...headers,
    host: streamHost,
    origin: 'https://www.rgshows.ru',
    referer: 'https://www.rgshows.ru/',
  };

  ctx.progress(100);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: streamUrl,
        headers: m3u8Headers,
        flags: [],
        captions: [],
      },
    ],
  };
}

export const rgshowsScraper = makeSourcerer({
  id: 'rgshows',
  name: 'RGShows',
  rank: 2,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
