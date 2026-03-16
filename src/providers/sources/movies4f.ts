import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://movies4f.com';
const headers = {
  Referer: 'https://movies4f.com/',
  Origin: 'https://movies4f.com',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  // Build search query - try without year first, then with year if no results
  let searchQuery = encodeURIComponent(ctx.media.title);
  let searchUrl = `${baseUrl}/search?q=${searchQuery}`;

  let searchPage = await ctx.proxiedFetcher<string>(searchUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });

  // If no results found, try with year
  if (!searchPage.includes('/film/')) {
    searchQuery = encodeURIComponent(`${ctx.media.title} ${ctx.media.releaseYear}`);
    searchUrl = `${baseUrl}/search?q=${searchQuery}`;
    searchPage = await ctx.proxiedFetcher<string>(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });
  }

  ctx.progress(40);

  // Parse search results using regex since cheerio has issues with this HTML
  let filmUrl: string | null = null;

  // Use regex to find complete film card structures
  const filmCardRegex =
    /<a[^>]*href="([^"]*\/film\/\d+\/[^"]*)"[^>]*class="[^"]*poster[^"]*"[^>]*>[\s\S]*?<img[^>]*alt="([^"]*)"[^>]*>/g;
  let filmMatch;

  for (;;) {
    filmMatch = filmCardRegex.exec(searchPage);
    if (filmMatch === null) break;
    const link = filmMatch[1];
    const title = filmMatch[2];

    // Check if this matches our media
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedSearchTitle = ctx.media.title.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (normalizedTitle.includes(normalizedSearchTitle)) {
      // For TV shows, check if it contains season/episode info
      if (ctx.media.type === 'show') {
        const episode = ctx.media.episode.number;
        const episodeUrl = `${baseUrl}${link}/episode-${episode}`;

        // Check if this is a TV series by looking for season indicators
        if (title.toLowerCase().includes('season') || link.includes('/film/')) {
          filmUrl = episodeUrl;
          break;
        }
      } else {
        // For movies
        filmUrl = `${baseUrl}${link}`;
        break;
      }
    }
  }

  if (!filmUrl) {
    throw new NotFoundError('No matching film found in search results');
  }

  ctx.progress(50);

  // Load the film page
  const filmPage = await ctx.proxiedFetcher<string>(filmUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });

  ctx.progress(60);

  // Extract embed iframe URL
  const $film = load(filmPage);
  const iframeSrc = $film('iframe#iframeStream').attr('src');

  if (!iframeSrc) {
    throw new NotFoundError('No embed iframe found');
  }

  // Extract video ID from embed URL
  const embedUrl = new URL(iframeSrc);
  const videoId = embedUrl.searchParams.get('id');

  if (!videoId) {
    throw new NotFoundError('No video ID found in embed URL');
  }

  ctx.progress(70);

  // Get tokens by posting to geturl endpoint
  const tokenResponse = await ctx.proxiedFetcher<string>('https://moviking.childish2x2.fun/geturl', {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=----geckoformboundaryc5f480bcac13a77346dab33881da6bfb',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: iframeSrc,
    },
    body: `------geckoformboundaryc5f480bcac13a77346dab33881da6bfb
Content-Disposition: form-data; name="renderer"

ANGLE (NVIDIA, NVIDIA GeForce GTX 980 Direct3D11 vs_5_0 ps_5_0), or similar
------geckoformboundaryc5f480bcac13a77346dab33881da6bfb
Content-Disposition: form-data; name="id"

6164426f797cf4b2fe93e4b20c0a4338
------geckoformboundaryc5f480bcac13a77346dab33881da6bfb
Content-Disposition: form-data; name="videoId"

${videoId}
------geckoformboundaryc5f480bcac13a77346dab33881da6bfb
Content-Disposition: form-data; name="domain"

${baseUrl}/
------geckoformboundaryc5f480bcac13a77346dab33881da6bfb--`,
  });

  ctx.progress(80);

  // Parse tokens from response
  const tokenMatch = tokenResponse.match(/token1=(\w+)&token2=(\w+)&token3=(\w+)/);
  if (!tokenMatch) {
    throw new NotFoundError('Failed to extract tokens');
  }

  const [, token1, token2, token3] = tokenMatch;

  // Get streaming page with tokens
  const streamingUrl = `https://cdn4.zenty.store/streaming?id=${videoId}&web=movies4f.com&token1=${token1}&token2=${token2}&token3=${token3}&cdn=https%3A%2F%2Fcdn4.zenty.store&lang=en`;

  const streamingPage = await ctx.proxiedFetcher<string>(streamingUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: 'https://moviking.childish2x2.fun/',
    },
  });

  ctx.progress(90);

  // Extract M3U8 URL from streaming page using regex
  // The URL is constructed as: url = 'https://cdn.neuronix.sbs/segment/' + videoId + '/?token1=' + token1 + '&token3=' + token3
  const urlRegex = /url = '([^']+)'/;
  const urlMatch = streamingPage.match(urlRegex);

  if (!urlMatch) {
    throw new NotFoundError('Failed to extract stream URL from streaming page');
  }

  const streamBaseUrl = urlMatch[1];

  // Extract videoId from the streaming URL parameters
  const videoIdMatch = streamingUrl.match(/id=([^&]+)/);
  if (!videoIdMatch) {
    throw new NotFoundError('Failed to extract videoId from streaming URL');
  }

  const streamVideoId = videoIdMatch[1];

  // Construct the full stream URL
  const streamUrl = `${streamBaseUrl}${streamVideoId}/?token1=${token1}&token3=${token3}`;

  ctx.progress(95);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: streamUrl,
        headers,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const movies4fScraper = makeSourcerer({
  id: 'movies4f',
  name: 'M4F',
  rank: 5,
  disabled: false,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
