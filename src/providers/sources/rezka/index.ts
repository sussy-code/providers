import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { clearTrash, extractTitleAndYear, generateUUID, parseSubtitleLinks, parseVideoLinks } from './utils';

interface MovieData {
  url: string;
  title: string;
  id: string | null;
  year: number | null;
  titleAndYear: string;
  type: 'show' | 'movie';
}

const rezkaBase = 'https://rezka.ag';

async function getMovieReleaseDatesAndUrls({
  type,
  title,
  releaseYear,
  ctx,
}: {
  type: 'show' | 'movie';
  title: string;
  releaseYear: number;
  ctx: ScrapeContext;
}): Promise<MovieData | null> {
  const itemRegexPattern = /<a href="([^"]+)"><span class="enty">([^<]+)<\/span> \(([^)]+)\)/g;
  const idRegexPattern = /\/(\d+)-[^/]+\.html$/;

  try {
    const searchData = await ctx.proxiedFetcher<string>(`/engine/ajax/search.php?q=${encodeURIComponent(title)}`, {
      baseUrl: rezkaBase,
    });

    const movieData: MovieData[] = [];

    for (const match of searchData.matchAll(itemRegexPattern)) {
      const url = match[1];
      const titleAndYear = match[3];

      const result = extractTitleAndYear(titleAndYear);
      if (result !== null) {
        const { title: movieTitle, year } = result;
        const id = url.match(idRegexPattern)?.[1] || null;

        movieData.push({ url, title: movieTitle, id, year, titleAndYear, type });
      }
    }

    const filteredItems = movieData.filter((item) => item.type === type && item.year === releaseYear);

    return filteredItems.length > 0 ? filteredItems[0] : null;
  } catch (error) {
    throw new NotFoundError('No result found');
  }
}

async function getStream(requestData: any, ctx: ScrapeContext): Promise<any> {
  try {
    const response = await ctx.proxiedFetcher<any>('/ajax/get_cdn_series/', {
      baseUrl: rezkaBase,
      method: 'POST',
      body: new URLSearchParams(requestData).toString(),
      headers: {
        // Content-type is needed to fetch
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    });

    // Turns response string to JSON
    return JSON.parse(response);
  } catch (error) {
    throw new NotFoundError('Could not fetch the stream data');
  }
}

export const rezkaScraper = makeSourcerer({
  id: 'rezka',
  name: 'Rezka HD',
  rank: 90,
  flags: [flags.CORS_ALLOWED],
  async scrapeShow(ctx) {
    const seasonNumber = ctx.media.season;
    const episodeNumber = ctx.media.episode;
    console.log('ctx', ctx);
    const movieReturn = await getMovieReleaseDatesAndUrls({
      type: 'show',
      title: ctx.media.title,
      releaseYear: ctx.media.releaseYear,
      ctx,
    });

    const requestData = {
      id: movieReturn?.id,
      translator_id: 238,
      season: seasonNumber,
      episode: episodeNumber,
      favs: generateUUID(),
      action: 'get_episodes',
    };

    const { url: streamUrl, subtitle: streamSubtitle } = await getStream(requestData, ctx);
    const parsedVideos = parseVideoLinks(clearTrash(streamUrl));
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
  },
  async scrapeMovie(ctx) {
    const movieReturn = await getMovieReleaseDatesAndUrls({
      type: 'movie',
      title: ctx.media.title,
      releaseYear: ctx.media.releaseYear,
      ctx,
    });

    const requestData = {
      id: movieReturn?.id,
      translator_id: 238,
      season: 1,
      episode: 1,
      favs: generateUUID(),
      action: 'get_movie',
    };
    const { url: streamUrl, subtitle: streamSubtitle } = await getStream(requestData, ctx);
    const parsedVideos = parseVideoLinks(clearTrash(streamUrl));
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
  },
});
