import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://watchanimeworld.in';
const zephyrBaseUrl = 'https://play.zephyrflick.top';

const tmdbReadToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNzYxODE3YWE2MDM1NzRhYjRiMGQ4ODBlNjEyZmQ4MCIsIm5iZiI6MTc2NTkxNzAxMy4wMjMsInN1YiI6IjY5NDFjMTU1OGRiMmJhMWRhNTU1ODQ4YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.R0OTezhLZaHHd7VxkBuhYl7vE1QDI0mQiDj3NuYKfl8';

interface TMDBShowResponse {
  name: string;
  original_name: string;
}

interface TMDBMovieResponse {
  title: string;
  original_title: string;
}

interface ZephyrStreamResponse {
  hls: boolean;
  videoSource: string;
  securedLink: string;
}

async function fetchTMDBData(
  ctx: ShowScrapeContext | MovieScrapeContext, 
  tmdbId: string | number, 
  mediaType: 'movie' | 'tv'
): Promise<string> {
  const endpoint = mediaType === 'movie' ? 'movie' : 'tv';
  
  const data = await ctx.proxiedFetcher<any>(`https://api.themoviedb.org/3/${endpoint}/${tmdbId}`, {
    headers: {
      Authorization: `Bearer ${tmdbReadToken}`,
      accept: 'application/json',
    },
  });

  if (!data) {
    throw new NotFoundError('Failed to fetch TMDB data');
  }

  if (mediaType === 'movie') {
    const movieData = data as TMDBMovieResponse;
    return movieData.title || movieData.original_title;
  }
  const showData = data as TMDBShowResponse;
  return showData.name || showData.original_name;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const isTVShow = ctx.media.type === 'show';
  const endpoint = isTVShow ? 'tv' : 'movie';

  const title = await fetchTMDBData(ctx, ctx.media.tmdbId, endpoint);
  const normalizedTitle = normalizeTitle(title);

  let watchUrl: string;
  if (ctx.media.type === 'movie') {
    watchUrl = `${baseUrl}/movies/${normalizedTitle}/`;
  } else {
    const season = (ctx as ShowScrapeContext).media.season.number;
    const episode = (ctx as ShowScrapeContext).media.episode.number;
    watchUrl = `${baseUrl}/episode/${normalizedTitle}-${season}x${episode}/`;
  }

  ctx.progress(30);

  const watchPage = await ctx.proxiedFetcher(watchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });

  const $ = load(watchPage);
  const iframeSrc = $('iframe[data-src]').attr('data-src') || $('iframe[src]').attr('src');

  if (!iframeSrc) {
    throw new NotFoundError('No iframe found on watch page');
  }

  const hashMatch = iframeSrc.match(/\/video\/([a-f0-9]+)/);
  if (!hashMatch) {
    throw new NotFoundError('Could not extract video hash from iframe');
  }

  const videoHash = hashMatch[1];
  ctx.progress(60);

  const apiUrl = `${zephyrBaseUrl}/player/index.php?data=${videoHash}&do=getVideo`;

  const streamResponse = await ctx.proxiedFetcher(apiUrl, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Referer: `${zephyrBaseUrl}/`,
      Origin: zephyrBaseUrl,
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: `data=${videoHash}&do=getVideo`,
  });

  const streamData: ZephyrStreamResponse = typeof streamResponse === 'string' 
    ? JSON.parse(streamResponse) 
    : streamResponse;

  if (!streamData.hls || !streamData.videoSource) {
    throw new NotFoundError('No HLS stream found');
  }

  ctx.progress(90);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: streamData.videoSource,
        headers: {
          Referer: `${zephyrBaseUrl}/`,
          Origin: zephyrBaseUrl,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const watchanimeworldScraper = makeSourcerer({
  id: 'watchanimeworld',
  name: 'WatchAnimeWorld',
  rank: 22,
  disabled: false,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});