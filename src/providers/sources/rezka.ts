import { flags } from '@/main/targets';
import { makeSourcerer } from '@/providers/base';
import { EmbedScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const rezkaBase = 'https://rezka.ag';

const TRASH_LIST = [
  '//_//QEBAQEAhIyMhXl5e',
  '//_//Xl5eIUAjIyEhIyM=',
  '//_//JCQhIUAkJEBeIUAjJCRA',
  '//_//IyMjI14hISMjIUBA',
  '//_//JCQjISFAIyFAIyM=',
];

const clearTrash = (data: string): string => {
  const trashPattern = new RegExp(TRASH_LIST.join('|'), 'g');
  const cleanedData = data.replace(trashPattern, '').replace('#h', '');
  return atob(cleanedData) || '';
};

interface VideoQuality {
  type: string;
  url: string;
}

function parseVideoLinks(inputString: string): Record<number, VideoQuality> {
  const linksArray = inputString.split(',');
  const result: Record<number, VideoQuality> = {};

  linksArray.forEach((link) => {
    const match = link.match(/\[(\d+p)[^\]]*](https?:\/\/[^\s,]+)/);
    if (match) {
      const [, quality, m3u8Url] = match;
      const numericQuality = parseInt(quality, 10);
      result[numericQuality] = { type: 'mp4', url: m3u8Url.replace(/:hls:manifest\.m3u8$/, '') };
    }
  });

  return result;
}

interface MovieData {
  url: string;
  title: string;
  id: string | null;
  year: number | null;
  titleAndYear: string;
  type: 'show' | 'movie';
}

const extractTitleAndYear = (input: string) => {
  const regex = /^(.*?),.*?(\d{4})/;
  const match = input.match(regex);

  if (match) {
    const [, title, year] = match;
    return { title: title.trim(), year: year ? parseInt(year, 10) : null };
  }
  return null;
};

async function getMovieReleaseDatesAndUrls({
  type,
  title,
  releaseYear,
  ctx,
}: {
  type: 'show' | 'movie';
  title: string;
  releaseYear: number;
  ctx: EmbedScrapeContext;
}): Promise<MovieData | null> {
  const searchUrl = `${rezkaBase}/engine/ajax/search.php?q=${encodeURIComponent(title)}`;

  try {
    const searchData = await ctx.proxiedFetcher<string>(searchUrl, { method: 'GET' });
    const itemRegex = /<a href="([^"]+)"><span class="enty">([^<]+)<\/span> \(([^)]+)\)/g;
    let match = itemRegex.exec(searchData);
    const movieData: MovieData[] = [];

    while (match !== null) {
      const [, url, , titleAndYear] = match;

      const result = extractTitleAndYear(titleAndYear);
      if (result !== null) {
        const { title: movieTitle, year } = result;
        const id = url.match(/\/(\d+)-[^/]+\.html$/)?.[1] || null;

        movieData.push({ url, title: movieTitle, id, year, titleAndYear, type });
      }

      match = itemRegex.exec(searchData);
    }

    const filteredItems = movieData.filter((item) => item.type === type && item.year === releaseYear);

    return filteredItems.length > 0 ? filteredItems[0] : null;
  } catch (error) {
    throw new NotFoundError('No result found');
  }
}

async function postToCdnSeries(requestData: any, ctx: EmbedScrapeContext): Promise<{ url: string }> {
  try {
    const response = await ctx.proxiedFetcher<string>(`${rezkaBase}/ajax/get_cdn_series/`, {
      method: 'POST',
      body: new URLSearchParams(requestData).toString(),
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': new URLSearchParams(requestData).toString().length.toString(),
        Connection: 'Keep-Alive',
        'Accept-Encoding': 'gzip',
        'User-Agent': 'okhttp/4.9.2',
      },
    });

    const jsonResponse = JSON.parse(response) as { url: string };
    return jsonResponse;
  } catch (error) {
    throw new NotFoundError('No result found');
  }
}

const generateRandomFavs = (): string => {
  const getRandomHex = (length: number): string =>
    [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

  const sections: string[] = [
    getRandomHex(8),
    getRandomHex(4),
    `4${getRandomHex(3)}`,
    `${(Math.floor(Math.random() * 4) + 8).toString(16)}${getRandomHex(3)}`,
    getRandomHex(12),
  ];

  return sections.join('-');
};

export const rezkaScraper = makeSourcerer({
  id: 'rezka',
  name: 'Rezka Scraper',
  rank: 310,
  flags: [flags.NO_CORS],
  async scrapeShow(ctx: any) {
    const movieReturn = await getMovieReleaseDatesAndUrls({
      type: 'show',
      title: ctx.media.title,
      releaseYear: ctx.media.releaseYear,
      ctx,
    });

    const requestData = {
      id: movieReturn?.id,
      translator_id: 238,
      season: ctx.media.season.number || ctx.media.season,
      episode: ctx.media.episode.number || ctx.media.episode,
      favs: generateRandomFavs(),
      action: 'get_episodes',
    };

    const responseFromCdnSeries = await postToCdnSeries(requestData, ctx);
    const parsedVideos = parseVideoLinks(clearTrash(responseFromCdnSeries.url));
    return {
      embeds: [],
      captions: [],
      stream: {
        type: 'file',
        flags: [flags.NO_CORS],
        captions: [],
        qualities: parsedVideos,
      },
    };
  },
  async scrapeMovie(ctx: any) {
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
      favs: generateRandomFavs(),
      action: 'get_movie',
    };

    const responseFromCdnSeries = await postToCdnSeries(requestData, ctx);
    const parsedVideos = parseVideoLinks(clearTrash(responseFromCdnSeries.url));

    return {
      embeds: [],
      captions: [],
      stream: {
        type: 'file',
        flags: [flags.NO_CORS],
        captions: [],
        qualities: parsedVideos,
      },
    };
  },
});
