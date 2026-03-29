import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { apiBaseUrl, password, username } from './common';

async function fetchMovie(ctx: MovieScrapeContext, ee3Auth: string): Promise<string | null> {
  // Authenticate and get token
  const authResp = await ctx.proxiedFetcher.full<{ token?: string }>(
    `${apiBaseUrl}/api/collections/users/auth-with-password?expand=lists_liked`,
    {
      method: 'POST',
      headers: {
        Origin: 'https://ee3.me',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identity: username,
        password: ee3Auth,
      }),
    },
  );
  if (authResp.statusCode !== 200) {
    throw new Error(`Auth failed with status: ${authResp.statusCode}: ${JSON.stringify(authResp.body)}`);
  }

  const jsonResponse = authResp.body;
  if (!jsonResponse?.token) {
    throw new Error(`No token in auth response: ${JSON.stringify(jsonResponse)}`);
  }

  const token = jsonResponse.token;
  ctx.progress(20);

  // Find movie by TMDB ID
  const movieUrl = `${apiBaseUrl}/api/collections/movies/records?page=1&perPage=48&filter=tmdb_data.id%20~%20${ctx.media.tmdbId}`;
  const movieResp = await ctx.proxiedFetcher.full<{ items?: Array<{ video?: string }> }>(movieUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: 'https://ee3.me',
    },
  });

  if (movieResp.statusCode !== 200) {
    throw new Error(`Movie lookup failed with status: ${movieResp.statusCode}: ${JSON.stringify(movieResp.body)}`);
  }

  const movieJsonResponse = movieResp.body;
  if (!movieJsonResponse?.items || movieJsonResponse.items.length === 0) {
    throw new NotFoundError(`No items found for TMDB ID ${ctx.media.tmdbId}: ${JSON.stringify(movieJsonResponse)}`);
  }

  if (!movieJsonResponse.items[0].video) {
    throw new NotFoundError(`No video field in first item: ${JSON.stringify(movieJsonResponse.items[0])}`);
  }

  const movieId = movieJsonResponse.items[0].video;
  ctx.progress(40);

  // Get video key
  const keyResp = await ctx.proxiedFetcher.full<{ key?: string }>(`${apiBaseUrl}/video/${movieId}/key`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: 'https://ee3.me',
    },
  });

  if (keyResp.statusCode !== 200) {
    throw new Error(`Key fetch failed with status: ${keyResp.statusCode}: ${JSON.stringify(keyResp.body)}`);
  }

  const keyJsonResponse = keyResp.body;
  if (!keyJsonResponse?.key) {
    throw new Error(`No key in response: ${JSON.stringify(keyJsonResponse)}`);
  }

  ctx.progress(60);
  return `${movieId}?k=${keyJsonResponse.key}`;
}

async function comboScraper(ctx: MovieScrapeContext): Promise<SourcererOutput> {
  const movData = await fetchMovie(ctx, password);
  if (!movData) {
    throw new NotFoundError('No watchable item found');
  }

  ctx.progress(80);

  const videoUrl = `${apiBaseUrl}/video/${movData}`;

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'file',
        qualities: {
          unknown: {
            type: 'mp4',
            url: videoUrl,
          },
        },
        headers: {
          Origin: 'https://ee3.me',
        },
        flags: [],
        captions: [],
      },
    ],
  };
}

export const ee3Scraper = makeSourcerer({
  id: 'ee3',
  name: 'EE3',
  rank: 97,
  disabled: false,
  flags: [],
  scrapeMovie: comboScraper,
});