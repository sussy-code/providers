import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

interface VideoQuality {
  type: string;
  url: string;
}

interface MovieData {
  url: string;
  title: string;
  id: string | null;
  year: number | null;
  titleAndYear: string;
  type: 'show' | 'movie';
}

const rezkaBase = 'https://rezka.ag';

// Patterns to remove from the encoded stream data
const TRASH_LIST = [
  '//_//QEBAQEAhIyMhXl5e',
  '//_//Xl5eIUAjIyEhIyM=',
  '//_//JCQhIUAkJEBeIUAjJCRA',
  '//_//IyMjI14hISMjIUBA',
  '//_//JCQjISFAIyFAIyM=',
];

// Removes 'trash' from the getStream() response and decodes it
const clearTrash = (data: string): string => {
  try {
    const trashPattern = new RegExp(TRASH_LIST.join('|'), 'g');
    const cleanedData = data.replace(trashPattern, '').replace('#h', '');
    const decodedData = atob(cleanedData);
    return decodedData || '';
  } catch (error) {
    throw new NotFoundError('Error decoding data:');
  }
};

function mapNumericQualityToQualities(numericQuality: number): string {
  switch (numericQuality) {
    case 360:
      return '360';
    case 480:
      return '480';
    case 720:
      return '720';
    case 1080:
      return '1080';
    case 1440:
      // Does not exist in Qualities - still used
      return '1440';
    case 2160:
      return '4k';
    default:
      return 'unknown';
  }
}

function parseVideoLinks(inputString: string): Record<string, VideoQuality> {
  const linksArray = inputString.split(',');
  const result: Record<string, VideoQuality> = {};

  linksArray.forEach((link) => {
    const match = link.match(/\[(\d+p)](https?:\/\/[^\s,]+\.mp4)/);
    if (match) {
      const quality = match[1];
      const mp4Url = match[2];

      const numericQuality = parseInt(quality, 10);
      const matchedQuality: string = mapNumericQualityToQualities(numericQuality);

      result[matchedQuality] = { type: 'mp4', url: mp4Url };
    }
  });

  return result;
}

// Example 'Titanic, 1997' = { title: 'Titanic', year: 1997 }
const extractTitleAndYear = (input: string) => {
  const regex = /^(.*?),.*?(\d{4})/;
  const match = input.match(regex);

  if (match) {
    const title = match[1];
    const year = match[2];
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

// Generates a unique favs value for each request
function generateUUID(): string {
  const randomHex = () => Math.floor(Math.random() * 16).toString(16);
  const generateSegment = (length: number) => Array.from({ length }, randomHex).join('');

  return `${generateSegment(8)}-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(
    12,
  )}`;
}

export const rezkaScraper = makeSourcerer({
  id: 'rezka',
  name: 'Rezka HD',
  rank: 90,
  flags: [flags.CORS_ALLOWED],
  async scrapeShow(ctx: any) {
    const seasonNumber = ctx.media.season.number;
    const episodeNumber = ctx.media.episode.number;

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

    const { url: streamUrl } = await getStream(requestData, ctx);
    const parsedVideos = parseVideoLinks(clearTrash(streamUrl));

    return {
      embeds: [],
      stream: [
        {
          id: 'primary',
          type: 'file',
          flags: [flags.CORS_ALLOWED],
          captions: [],
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

    const { url: streamUrl } = await getStream(requestData, ctx);
    const parsedVideos = parseVideoLinks(clearTrash(streamUrl));

    return {
      embeds: [],
      stream: [
        {
          id: 'primary',
          type: 'file',
          flags: [flags.CORS_ALLOWED],
          captions: [],
          qualities: parsedVideos,
        },
      ],
    };
  },
});
