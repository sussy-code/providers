import { load } from 'cheerio';
import { unpack } from 'unpacker';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const zoeBase = 'https://zoechip.org';

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function extractFileFromFilemoon(
  ctx: MovieScrapeContext | ShowScrapeContext,
  filemoonUrl: string,
): Promise<string | null> {
  const headers = {
    Referer: zoeBase,
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  };
  // console.log(`Extracting from Filemoon URL: ${filemoonUrl}`);

  // Follow redirects to get the actual iframe URL
  const redirectResponse = await ctx.proxiedFetcher.full(filemoonUrl, {
    method: 'HEAD',
    headers,
  });

  const redirectUrl = redirectResponse.finalUrl;
  // console.log(`Redirect URL: ${redirectUrl}`);

  if (!redirectUrl) {
    // console.log('No redirect URL found');
    return null;
  }

  // Get the redirect page content
  const redirectHtml = await ctx.proxiedFetcher<string>(redirectUrl, {
    headers,
  });

  const redirectCheerio = load(redirectHtml);
  const iframeUrl = redirectCheerio('iframe').attr('src');
  // console.log(`Iframe URL: ${iframeUrl}`);

  if (!iframeUrl) {
    // console.log('No iframe URL found');
    throw new NotFoundError('No iframe URL found');
  }

  // Fetch the iframe content
  const iframeHtml = await ctx.proxiedFetcher<string>(iframeUrl, {
    headers,
  });

  // Extract the packed JavaScript code
  const evalMatch = iframeHtml.match(/eval\(function\(p,a,c,k,e,.*\)\)/i);
  if (!evalMatch) {
    // console.log('No packed JavaScript found');
    throw new NotFoundError('No packed JavaScript found');
  }

  // console.log('Found packed JavaScript, unpacking...');

  // Unpack the JavaScript
  const unpacked = unpack(evalMatch[0]);
  // console.log(`Unpacked JavaScript (first 200 chars): ${unpacked.substring(0, 200)}`);

  // Extract the file URL from the unpacked code
  const fileMatch = unpacked.match(/file\s*:\s*"([^"]+)"/i);
  if (!fileMatch) {
    // console.log('No file URL found in unpacked JavaScript');
    throw new NotFoundError('No file URL found in unpacked JavaScript');
  }

  const fileUrl = fileMatch[1];
  // console.log(`Extracted file URL: ${fileUrl}`);
  return fileUrl;
}

async function comboScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const headers = {
    Referer: zoeBase,
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  };

  // console.log(`Starting scrape for ${ctx.media.type}: ${ctx.media.title}`);

  let url: string;
  let movieId: string | undefined;

  // Construct URLs based on media type
  if (ctx.media.type === 'movie') {
    const slug = createSlug(ctx.media.title);
    url = `${zoeBase}/film/${slug}-${ctx.media.releaseYear}`;
    // console.log(`Movie URL: ${url}`);
  } else {
    const slug = createSlug(ctx.media.title);
    url = `${zoeBase}/episode/${slug}-season-${ctx.media.season.number}-episode-${ctx.media.episode.number}`;
    // console.log(`Show URL: ${url}`);
  }

  ctx.progress(20);

  // Get the page and extract movie ID
  const html = await ctx.proxiedFetcher<string>(url, { headers });
  const $ = load(html);

  movieId = $('div#show_player_ajax').attr('movie-id');
  // console.log(`Movie ID: ${movieId}`);

  if (!movieId) {
    // Try alternative methods to find content
    // console.log('No movie ID found, trying alternative search...');

    // Look for other possible IDs
    const altId =
      $('[data-movie-id]').attr('data-movie-id') ||
      $('[movie-id]').attr('movie-id') ||
      $('.player-wrapper').attr('data-id');

    if (altId) {
      movieId = altId;
      // console.log(`Found alternative ID: ${movieId}`);
    } else {
      throw new NotFoundError(`No content found for ${ctx.media.type === 'movie' ? 'movie' : 'episode'}`);
    }
  }

  ctx.progress(40);

  // Make AJAX request to get sources
  const ajaxUrl = `${zoeBase}/wp-admin/admin-ajax.php`;
  const ajaxHeaders = {
    ...headers,
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Referer: url,
  };

  const body = new URLSearchParams({
    action: 'lazy_player',
    movieID: movieId,
  });

  // console.log('Making AJAX request for sources...');
  const ajaxHtml = await ctx.proxiedFetcher<string>(ajaxUrl, {
    method: 'POST',
    headers: ajaxHeaders,
    body: body.toString(),
  });

  const $ajax = load(ajaxHtml);
  const filemoonUrl = $ajax('ul.nav a:contains(Filemoon)').attr('data-server');
  // console.log(`Filemoon URL: ${filemoonUrl}`);

  if (!filemoonUrl) {
    // Try to find other available servers
    const allServers = $ajax('ul.nav a')
      .map((_, el) => ({
        name: $ajax(el).text().trim(),
        url: $ajax(el).attr('data-server'),
      }))
      .get();

    // console.log('Available servers:', allServers);

    if (allServers.length === 0) {
      throw new NotFoundError('No streaming servers found');
    }

    throw new NotFoundError('Filemoon server not available');
  }

  ctx.progress(60);

  // Extract file URL from Filemoon
  const fileUrl = await extractFileFromFilemoon(ctx, filemoonUrl);
  if (!fileUrl) {
    throw new NotFoundError('Failed to extract file URL from streaming server');
  }

  ctx.progress(90);

  return {
    stream: [
      {
        id: 'primary',
        type: 'hls' as const,
        playlist: fileUrl,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
    embeds: [],
  };
}

export const zoechipScraper = makeSourcerer({
  id: 'zoechip',
  name: 'ZoeChip',
  rank: 170,
  disabled: true,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
