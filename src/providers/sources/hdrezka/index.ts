import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { MovieData, VideoLinks } from './types';
import { extractTitleAndYear, generateRandomFavs, parseSubtitleLinks, parseVideoLinks } from './utils';

const rezkaBase = 'https://hdrzk.org';
const baseHeaders = {
  'X-Hdrezka-Android-App': '1',
  'X-Hdrezka-Android-App-Version': '2.2.0',
};

async function searchAndFindMediaId(ctx: ShowScrapeContext | MovieScrapeContext): Promise<MovieData | null> {
  const itemRegexPattern = /<a href="([^"]+)"><span class="enty">([^<]+)<\/span> \(([^)]+)\)/g;
  const idRegexPattern = /\/(\d+)-[^/]+\.html$/;

  const searchData = await ctx.proxiedFetcher<string>(`/engine/ajax/search.php`, {
    baseUrl: rezkaBase,
    headers: baseHeaders,
    query: { q: ctx.media.title },
  });

  const movieData: MovieData[] = [];

  for (const match of searchData.matchAll(itemRegexPattern)) {
    const url = match[1];
    const titleAndYear = match[3];

    const result = extractTitleAndYear(titleAndYear);
    if (result !== null) {
      const id = url.match(idRegexPattern)?.[1] || null;

      movieData.push({ id: id ?? '', year: result.year ?? 0, type: ctx.media.type, url });
    }
  }

  const filteredItems = movieData.filter((item) => item.type === ctx.media.type && item.year === ctx.media.releaseYear);

  return filteredItems[0] || null;
}

async function getStream(
  id: string,
  translatorId: string,
  ctx: ShowScrapeContext | MovieScrapeContext,
): Promise<VideoLinks> {
  const searchParams = new URLSearchParams();
  searchParams.append('id', id);
  searchParams.append('translator_id', translatorId);
  if (ctx.media.type === 'show') {
    searchParams.append('season', ctx.media.season.number.toString());
    searchParams.append('episode', ctx.media.episode.number.toString());
  }
  if (ctx.media.type === 'movie') {
    searchParams.append('is_camprip', '0');
    searchParams.append('is_ads', '0');
    searchParams.append('is_director', '0');
  }
  searchParams.append('favs', generateRandomFavs());
  searchParams.append('action', ctx.media.type === 'show' ? 'get_stream' : 'get_movie');

  const response = await ctx.proxiedFetcher<string>('/ajax/get_cdn_series/', {
    baseUrl: rezkaBase,
    method: 'POST',
    body: searchParams,
    headers: baseHeaders,
  });

  // Response content-type is text/html, but it's actually JSON
  return JSON.parse(response);
}

async function getTranslatorId(
  url: string,
  id: string,
  ctx: ShowScrapeContext | MovieScrapeContext,
): Promise<string | null> {
  const response = await ctx.proxiedFetcher<string>(url, {
    headers: baseHeaders,
  });

  // Translator ID 238 represents the Original + subtitles player.
  if (response.includes(`data-translator_id="238"`)) return '238';

  const functionName = ctx.media.type === 'movie' ? 'initCDNMoviesEvents' : 'initCDNSeriesEvents';
  const regexPattern = new RegExp(`sof\\.tv\\.${functionName}\\(${id}, ([^,]+)`, 'i');
  const match = response.match(regexPattern);
  const translatorId = match ? match[1] : null;

  return translatorId;
}

const universalScraper = async (ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> => {
  const result = await searchAndFindMediaId(ctx);
  if (!result || !result.id) throw new NotFoundError('No result found');

  const translatorId = await getTranslatorId(result.url, result.id, ctx);
  if (!translatorId) throw new NotFoundError('No translator id found');

  const { url: streamUrl, subtitle: streamSubtitle } = await getStream(result.id, translatorId, ctx);
  const parsedVideos = parseVideoLinks(streamUrl);
  const parsedSubtitles = parseSubtitleLinks(streamSubtitle);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'file',
        flags: [flags.CORS_ALLOWED, flags.IP_LOCKED],
        captions: parsedSubtitles,
        qualities: parsedVideos,
      },
    ],
  };
};

export const hdRezkaScraper = makeSourcerer({
  id: 'hdrezka',
  name: 'HDRezka',
  rank: 120,
  flags: [flags.CORS_ALLOWED, flags.IP_LOCKED],
  scrapeShow: universalScraper,
  scrapeMovie: universalScraper,
});
