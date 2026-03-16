import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { createM3U8ProxyUrl } from '@/utils/proxy';

import { decodeAtom, decodeDeanEdwards, decodeHex, extractPackerParams, rtt, unescapeString } from './decrypt';

const baseUrl = 'https://www.fullhdfilmizlesene.tv';

const headers = {
  Referer: baseUrl,
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

function extractVidmoxy(body: string) {
  const regex = /eval\(function\(p,a,c,k,e,d\){.+}}return p}\((\\?'.+.split\(\\?'\|\\?'\)).+$/m;

  let decoded = body;
  let i = 0;

  while (decoded.includes('eval(')) {
    const decodedMatch = decoded.match(regex);
    if (!decodedMatch) {
      throw new NotFoundError('Decryption unsuccessful');
    }

    const parameters = extractPackerParams(i > 0 ? unescapeString(decodedMatch[1]) : decodedMatch[1]);
    if (!parameters) throw new NotFoundError('Decryption unsuccessful');

    decoded = decodeDeanEdwards(parameters);
    i++;
  }

  const fileMatch = decoded.match(/"file":"(.+?)"/);
  if (!fileMatch) throw new NotFoundError('No playlist found');

  const playlistUrl = unescapeString(decodeHex(fileMatch[1]));
  return playlistUrl;
}

function extractAtom(body: string) {
  const fileMatch = body.match(/"file": av\('(.+)'\),$/m);

  if (!fileMatch) throw new NotFoundError('No playlist found');

  const playlistUrl = decodeAtom(fileMatch[1]);
  return playlistUrl;
}

async function scrapeMovie(ctx: MovieScrapeContext): Promise<SourcererOutput> {
  if (!ctx.media.imdbId) {
    throw new NotFoundError('IMDb id not provided');
  }

  const searchJson = await ctx.proxiedFetcher<{ prefix: string; dizilink: string }[]>(
    `/autocomplete/q.php?q=${ctx.media.imdbId}`,
    {
      baseUrl,
      headers,
    },
  );

  ctx.progress(30);
  if (!searchJson.length) throw new NotFoundError('Media not found');

  const searchResult = searchJson[0];

  const mediaUrl = `/${searchResult.prefix}/${searchResult.dizilink}`;
  const mediaPage = await ctx.proxiedFetcher<string>(mediaUrl, {
    baseUrl,
    headers,
  });

  const playerMatch = mediaPage.match(/var scx = {.+"t":\["(.+)"\]},/);
  if (!playerMatch) throw new NotFoundError('No source found');

  ctx.progress(60);

  const playerUrl = atob(rtt(playerMatch[1]));
  const isVidmoxy = playerUrl.startsWith('https://vidmoxy.com');

  const playerResponse = await ctx.proxiedFetcher<string>(playerUrl + (isVidmoxy ? '?vst=1' : ''), {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Referer: baseUrl,
      'Sec-Fetch-Dest': 'iframe',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-User': '?1',
      'Sec-GPC': '1',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });

  ctx.progress(80);
  if (!playerResponse || playerResponse === '404') throw new NotFoundError('Player 404: Source is inaccessible');

  const playlistUrl = isVidmoxy ? extractVidmoxy(playerResponse) : extractAtom(playerResponse);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: createM3U8ProxyUrl(playlistUrl, ctx.features, headers),
        headers,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const fullhdfilmizleScraper = makeSourcerer({
  id: 'fullhdfilmizle',
  name: 'FullHDFilmizle (Turkish)',
  rank: 21,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie,
});
