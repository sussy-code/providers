import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { MovieData, VideoLinks } from './types';
import { generateRandomFavs, parseSubtitleLinks, parseVideoLinks } from './utils';

const rezkaBase = 'https://hdrezka.ag/';
const baseHeaders = {
  'X-Hdrezka-Android-App': '1',
  'X-Hdrezka-Android-App-Version': '2.2.0',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
  'CF-IPCountry': 'RU',
};

async function searchAndFindMediaId(ctx: ShowScrapeContext | MovieScrapeContext): Promise<MovieData | null> {
  const searchData = await ctx.proxiedFetcher<string>(`/engine/ajax/search.php`, {
    baseUrl: rezkaBase,
    headers: baseHeaders,
    query: { q: ctx.media.title },
  });
  // console.log('Search response length:', searchData.length);

  const $ = load(searchData);
  // const year = ctx.media.releaseYear.toString();
  // console.log('Looking for:', { year, title: ctx.media.title });

  const items = $('a')
    .map((_, el) => {
      const $el = $(el);
      const url = $el.attr('href');
      const titleText = $el.find('span.enty').text();
      // Try multiple patterns to find the year
      const yearMatch =
        titleText.match(/\((\d{4})\)/) || url?.match(/-(\d{4})(?:-|\.html)/) || titleText.match(/(\d{4})/);
      const itemYear = yearMatch ? yearMatch[1] : null;
      const id = url?.match(/\/(\d+)-[^/]+\.html$/)?.[1];

      // console.log('Found item:', { titleText, itemYear, url, id });

      if (id) {
        return {
          id,
          year: itemYear ? parseInt(itemYear, 10) : ctx.media.releaseYear,
          type: ctx.media.type,
          url: url || '',
        };
      }
      return null;
    })
    .get()
    .filter(Boolean);

  // Sort by year difference to get closest match
  items.sort((a, b) => {
    const diffA = Math.abs(a.year - ctx.media.releaseYear);
    const diffB = Math.abs(b.year - ctx.media.releaseYear);
    return diffA - diffB;
  });

  // console.log('Filtered items:', items);
  return items[0] || null;
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
  searchParams.append('favs', generateRandomFavs());
  searchParams.append('action', ctx.media.type === 'show' ? 'get_stream' : 'get_movie');
  searchParams.append('t', Date.now().toString());

  // console.log('Fetching stream with params:', Object.fromEntries(searchParams));

  const response = await ctx.proxiedFetcher<string>('/ajax/get_cdn_series/', {
    baseUrl: rezkaBase,
    method: 'POST',
    body: searchParams,
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `${rezkaBase}films/action/${id}-novokain-2025-latest.html`,
    },
  });

  // console.log('Stream response:', response);

  try {
    const data = JSON.parse(response);
    // console.log('Parsed stream data:', data);

    if (!data.url && data.success) {
      // If the movie exists but has no stream, it might be premium or not yet available
      throw new NotFoundError('Movie found but no stream available (might be premium or not yet released)');
    }

    if (!data.url) {
      throw new NotFoundError('No stream URL found in response');
    }

    return data;
  } catch (error) {
    console.error('Error parsing stream response:', error);
    throw new NotFoundError('Failed to parse stream response');
  }
}

async function getTranslatorId(
  url: string,
  id: string,
  ctx: ShowScrapeContext | MovieScrapeContext,
): Promise<string | null> {
  // console.log('Getting translator ID for:', { url, id });

  const response = await ctx.proxiedFetcher<string>(url, {
    headers: baseHeaders,
  });

  // Translator ID 238 represents the Original + subtitles player.
  if (response.includes(`data-translator_id="238"`)) {
    // console.log('Found translator ID 238');
    return '238';
  }

  const functionName = ctx.media.type === 'movie' ? 'initCDNMoviesEvents' : 'initCDNSeriesEvents';
  const regexPattern = new RegExp(`sof\\.tv\\.${functionName}\\(${id}, ([^,]+)`, 'i');
  const match = response.match(regexPattern);
  const translatorId = match ? match[1] : null;

  // console.log('Found translator ID:', translatorId);
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
  ctx.progress(90);

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
  rank: 20,
  flags: [flags.CORS_ALLOWED, flags.IP_LOCKED],
  scrapeShow: universalScraper,
  scrapeMovie: universalScraper,
});
