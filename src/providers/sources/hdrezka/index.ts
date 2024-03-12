import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { VideoLinks } from './types';
import { extractTitleAndYear, generateRandomFavs, parseSubtitleLinks, parseVideoLinks } from './utils';

const rezkaBase = 'https://hdrzk.org';
const baseHeaders = {
  'X-Hdrezka-Android-App': '1',
  'X-Hdrezka-Android-App-Version': '2.2.0',
};

async function searchAndFindMediaId({
  type,
  title,
  releaseYear,
  ctx,
}: {
  type: 'show' | 'movie';
  title: string;
  releaseYear: number;
  ctx: ScrapeContext;
}): Promise<string | null> {
  const itemRegexPattern = /<a href="([^"]+)"><span class="enty">([^<]+)<\/span> \(([^)]+)\)/g;
  const idRegexPattern = /\/(\d+)-[^/]+\.html$/;

  const searchData = await ctx.proxiedFetcher<string>(`/engine/ajax/search.php`, {
    baseUrl: rezkaBase,
    headers: baseHeaders,
    query: { q: title },
  });

  const movieData: {
    id: string | null;
    year: number | null;
    type: 'show' | 'movie';
  }[] = [];

  for (const match of searchData.matchAll(itemRegexPattern)) {
    const url = match[1];
    const titleAndYear = match[3];

    const result = extractTitleAndYear(titleAndYear);
    if (result !== null) {
      const id = url.match(idRegexPattern)?.[1] || null;

      movieData.push({ id, year: result.year, type });
    }
  }

  const filteredItems = movieData.filter((item) => item.type === type && item.year === releaseYear);

  return filteredItems[0]?.id || null;
}

async function getStream(id: string, ctx: ShowScrapeContext | MovieScrapeContext): Promise<VideoLinks> {
  const searchParams = new URLSearchParams();
  searchParams.append('id', id);
  // Translator ID 238 represents the Original + subtitles player.
  searchParams.append('translator_id', '238');
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

const universalScraper = async (ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> => {
  const id = await searchAndFindMediaId({
    type: ctx.media.type === 'show' ? 'show' : 'movie',
    title: ctx.media.title,
    releaseYear: ctx.media.releaseYear,
    ctx,
  });
  if (!id) throw new NotFoundError('No result found');

  const { url: streamUrl, subtitle: streamSubtitle } = await getStream(id, ctx);
  const parsedVideos = parseVideoLinks(streamUrl);
  const parsedSubtitles = parseSubtitleLinks(streamSubtitle);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'file',
        flags: [flags.CORS_ALLOWED],
        captions: parsedSubtitles,
        qualities: parsedVideos,
      },
    ],
  };
};

export const hdRezkaScraper = makeSourcerer({
  id: 'hdrezka',
  name: 'HDRezka',
  rank: 195,
  flags: [flags.CORS_ALLOWED, flags.IP_LOCKED],
  scrapeShow: universalScraper,
  scrapeMovie: universalScraper,
});
