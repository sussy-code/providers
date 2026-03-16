/* eslint-disable no-console */
import { load } from 'cheerio';
import CryptoJS from 'crypto-js';

import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { compareMedia } from '@/utils/compare';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { getSetCookieHeader, makeCookieHeader, parseSetCookie } from '@/utils/cookie';
import { NotFoundError } from '@/utils/errors';
import { createM3U8ProxyUrl } from '@/utils/proxy';

let baseUrl = 'https://m4ufree.page';

// AES Decryption Keys
// They rotate these keys occasionally. If it brakes chances are they rotated keys
// To get the keys, go on the site and find the req to something like:
// https://if6.ppzj-youtube.cfd/play/6119b02e9c0163458e94808e/648ff94023c354ba9eb2221d2ec81040.html
// Find the obfuscated script section, deobfuscate with webcrack, you'll find the keys
const KEYS = {
  IDFILE_KEY: 'jcLycoRJT6OWjoWspgLMOZwS3aSS0lEn',
  IDUSER_KEY: 'PZZ3J3LDbLT0GY7qSA5wW5vchqgpO36O',
  REQUEST_KEY: 'vlVbUQhkOhoSfyteyzGeeDzU0BHoeTyZ',
  RESPONSE_KEY: 'oJwmvmVBajMaRCTklxbfjavpQO7SZpsL',
  MD5_SALT: 'KRWN3AdgmxEMcd2vLN1ju9qKe8Feco5h',
} as const;

function decryptHexToUtf8(encryptedHex: string, key: string): string {
  const hexParsed = CryptoJS.enc.Hex.parse(encryptedHex);
  const base64String = hexParsed.toString(CryptoJS.enc.Base64);
  const decrypted = CryptoJS.AES.decrypt(base64String, key);
  const result = decrypted.toString(CryptoJS.enc.Utf8);
  return result;
}

function encryptUtf8ToHex(plainText: string, key: string): string {
  const encrypted = CryptoJS.AES.encrypt(plainText, key).toString();
  const base64Parsed = CryptoJS.enc.Base64.parse(encrypted);
  const result = base64Parsed.toString(CryptoJS.enc.Hex);
  return result;
}

async function fetchIframeUrl(
  ctx: MovieScrapeContext | ShowScrapeContext,
  watchPageHtml: string,
  csrfToken: string,
  cookie: string,
  referer: string,
): Promise<string> {
  const $ = load(watchPageHtml);

  // Movie vs TV handling
  let pageHtml = watchPageHtml;

  if (ctx.media.type === 'show') {
    const seasonPadded = String(ctx.media.season.number).padStart(2, '0');
    const episodePadded = String(ctx.media.episode.number).padStart(2, '0');
    const idepisode = $(`button:contains("S${seasonPadded}-E${episodePadded}")`).attr('idepisode');
    if (!idepisode) throw new NotFoundError('idepisode not found');

    // Load TV episode block
    pageHtml = await ctx.proxiedFetcher<string>('/ajaxtv', {
      baseUrl,
      method: 'POST',
      body: new URLSearchParams({ idepisode, _token: csrfToken }),
      headers: {
        Cookie: cookie,
        Referer: referer,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  }

  const $$ = load(pageHtml);
  const playhqData = $$('#playhq.singlemv.active').attr('data');
  if (!playhqData) throw new NotFoundError('playhq data not found');

  // Request iframe wrapper
  const iframeWrapper = await ctx.proxiedFetcher<string>('/ajax', {
    baseUrl,
    method: 'POST',
    body: new URLSearchParams({ m4u: playhqData, _token: csrfToken }),
    headers: {
      Cookie: cookie,
      Referer: referer,
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  const $$$ = load(iframeWrapper);
  const iframeUrl = $$$('iframe').attr('src');
  if (!iframeUrl) throw new NotFoundError('iframe src not found');

  return iframeUrl.startsWith('http') ? iframeUrl : new URL(iframeUrl, baseUrl).toString();
}

async function extractM3u8FromIframe(ctx: MovieScrapeContext | ShowScrapeContext, iframeUrl: string): Promise<string> {
  const iframeHtml = await ctx.proxiedFetcher<string>(iframeUrl, {
    headers: {
      Referer: baseUrl,
    },
  });

  const idfileEnc = iframeHtml.match(/const\s+idfile_enc\s*=\s*"([^"]+)"/)?.[1];
  const idUserEnc = iframeHtml.match(/const\s+idUser_enc\s*=\s*"([^"]+)"/)?.[1];
  const domainApi = iframeHtml.match(/const\s+DOMAIN_API\s*=\s*'([^']+)'/)?.[1];

  if (!idfileEnc || !idUserEnc || !domainApi) throw new NotFoundError('Required data not found in iframe HTML');

  const idfile = decryptHexToUtf8(idfileEnc, KEYS.IDFILE_KEY);
  const iduser = decryptHexToUtf8(idUserEnc, KEYS.IDUSER_KEY);

  const requestData = {
    idfile,
    iduser,
    domain_play: 'https://my.playhq.net',
    platform: 'Win32',
    hlsSupport: true,
    jwplayer: {},
  } as const;

  const encryptedData = encryptUtf8ToHex(JSON.stringify(requestData), KEYS.REQUEST_KEY);
  const md5Hash = CryptoJS.MD5(encryptedData + KEYS.MD5_SALT).toString();

  const responseBody = await ctx.proxiedFetcher<any>(`${domainApi}/playiframe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: iframeUrl,
      Origin: new URL(domainApi).origin,
    },
    body: `data=${encryptedData}|${md5Hash}`,
  });

  let json: any;
  try {
    json = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
  } catch {
    throw new NotFoundError('Invalid JSON from playiframe');
  }

  if (json?.status === 1 && json?.type === 'url-m3u8-encv1' && typeof json.data === 'string') {
    const decryptedUrl = decryptHexToUtf8(json.data, KEYS.RESPONSE_KEY);
    if (!decryptedUrl) throw new NotFoundError('Failed to decrypt stream URL');
    return decryptedUrl;
  }

  throw new NotFoundError(json?.msg || 'Failed to get stream URL');
}

const comboScraper = async (ctx: MovieScrapeContext | ShowScrapeContext) => {
  // Normalize base by following any redirects
  const home = await ctx.proxiedFetcher.full(baseUrl);
  baseUrl = new URL(home.finalUrl).origin;

  // Build search slug from title
  const searchSlug = ctx.media.title
    .replace(/'/g, '')
    .replace(/!|@|%|\^|\*|\(|\)|\+|=|<|>|\?|\/|,|\.|:|;|'| |"|&|#|\[|\]|~|$|_/g, '-')
    .replace(/-+-/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/Ă¢â‚¬â€œ/g, '');

  const searchPageHtml = await ctx.proxiedFetcher<string>(`/search/${searchSlug}.html`, {
    baseUrl,
    query: {
      type: ctx.media.type === 'movie' ? 'movie' : 'tvs',
    },
  });
  const searchPage$ = load(searchPageHtml);

  const results: { title: string; year: number | undefined; url: string }[] = [];
  searchPage$('.item').each((_, el) => {
    const [, title, year] =
      searchPage$(el)
        .find('.imagecover a')
        .attr('title')
        ?.match(/^(.*?)\s*(?:\(?\s*(\d{4})(?:\s*-\s*\d{0,4})?\s*\)?)?\s*$/) || [];
    const url = searchPage$(el).find('a').attr('href');
    if (!title || !url) return;
    results.push({ title, year: year ? parseInt(year, 10) : undefined, url });
  });

  const watchPath = results.find((x) => x && compareMedia(ctx.media, x.title, x.year))?.url;
  if (!watchPath) throw new NotFoundError('No watchable item found');

  const watchFinal = await ctx.proxiedFetcher.full(watchPath, {
    baseUrl,
    readHeaders: ['Set-Cookie'],
  });
  const watchHtml = watchFinal.body;
  const watchUrl = new URL(watchFinal.finalUrl).toString();

  const csrfToken = load(watchHtml).root().find('meta[name="csrf-token"]').attr('content');
  if (!csrfToken) throw new NotFoundError('Token not found');

  const cookies = parseSetCookie(getSetCookieHeader(watchFinal.headers));
  const laravel = cookies.laravel_session;
  if (!laravel?.value) throw new NotFoundError('Session cookie not found');
  const cookieHeader = makeCookieHeader({ [laravel.name]: laravel.value });

  ctx.progress(50);

  const iframeUrl = await fetchIframeUrl(ctx, watchHtml, csrfToken, cookieHeader, watchUrl);
  const m3u8Url = await extractM3u8FromIframe(ctx, iframeUrl);

  ctx.progress(90);

  // The stream headers aren't required, but they are used to trigger the extension to be used since the stream is only cors locked.
  // BUT we are using the M3U8 proxy to bypass the cors lock, so we shouldn't remove the flag.
  // We don't have handling for only cors locked streams with the extension.
  const streamHeaders = {
    Referer: baseUrl,
    Origin: baseUrl,
  };

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls' as const,
        playlist: createM3U8ProxyUrl(m3u8Url, ctx.features, streamHeaders),
        headers: streamHeaders,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
};

export const m4ufreeScraper = makeSourcerer({
  id: 'm4ufree',
  name: 'M4UFree 🔥',
  rank: 182,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
