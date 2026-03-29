import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const SMASHY_BASE = 'https://player.smashystream.com';

const REQUEST_HEADERS = {
  'user-agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  referer: 'https://movielair.cc/',
  origin: 'https://movielair.cc',
};

async function fetchPage(ctx: ShowScrapeContext | MovieScrapeContext, url: string) {
  return ctx.proxiedFetcher(url, {
    headers: REQUEST_HEADERS,
  });
}

function extractM3U8(html: string): string | null {
  const patterns = [
    /https?:\/\/[^"'\\]+\.m3u8[^"'\\]*/,
    /file:\s*"(https?:\/\/[^"]+\.m3u8[^"]*)"/,
    /file:\s*'(https?:\/\/[^']+\.m3u8[^']*)'/
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1] || match[0];
  }

  const jsonMatch = html.match(/sources:\s*(\[[^\]]+\])/);
  if (jsonMatch) {
    try {
      const sources = JSON.parse(jsonMatch[1]);
      if (Array.isArray(sources)) {
        for (const s of sources) {
          if (s?.file?.includes('.m3u8')) return s.file;
        }
      }
    } catch {}
  }

  return null;
}

async function resolveEmbed(
  ctx: ShowScrapeContext | MovieScrapeContext,
  url: string,
  depth = 0
): Promise<string | null> {

  if (depth > 5) return null;

  const html = await fetchPage(ctx, url);

  let stream = extractM3U8(html);
  if (stream) return stream;

  const $ = load(html);

  const iframes = $('iframe')
    .map((_, el) => $(el).attr('src'))
    .get()
    .filter(Boolean);

  for (const src of iframes) {
    const nextUrl = src.startsWith('http')
      ? src
      : `${SMASHY_BASE}${src}`;

    const found = await resolveEmbed(ctx, nextUrl, depth + 1);
    if (found) return found;
  }

  return null;
}

async function smashyScrapy(
  ctx: ShowScrapeContext | MovieScrapeContext
): Promise<SourcererOutput> {

  ctx.progress(10);

  const tmdb = ctx.media.tmdbId;

  let url: string;

  if (ctx.media.type === 'show') {
    const show = ctx as ShowScrapeContext;

    if (!show.media.season || !show.media.episode) {
      throw new NotFoundError('Missing season/episode');
    }

    url = `${SMASHY_BASE}/tv/${tmdb}/${show.media.season.number}/${show.media.episode.number}`;
  } else {
    url = `${SMASHY_BASE}/movie/${tmdb}`;
  }

  const stream = await resolveEmbed(ctx, url);

  if (!stream) {
    throw new NotFoundError('Smashy stream not found');
  }

  ctx.progress(90);

  return {
    embeds: [],
    stream: [
      {
        id: 'smashy',
        type: 'hls',
        playlist: stream,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const smashyScraper = makeSourcerer({
  id: 'smashy',
  name: 'SmashyStream',
  rank: 94,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: smashyScrapy,
  scrapeShow: smashyScrapy,
});