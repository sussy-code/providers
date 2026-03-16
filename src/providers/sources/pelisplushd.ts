import { load } from 'cheerio';
import type { Element as CheerioElement } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://ww3.pelisplus.to';

function normalizeTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function decodeBase64(str: string): string {
  try {
    return atob(str);
  } catch {
    return '';
  }
}

function fetchUrls(text?: string): string[] {
  if (!text) return [];
  const linkRegex = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/g;
  return Array.from(text.matchAll(linkRegex)).map((m) => m[0].replace(/^"+|"+$/g, ''));
}

async function resolvePlayerUrl(ctx: MovieScrapeContext | ShowScrapeContext, url: string): Promise<string> {
  try {
    const html = await ctx.proxiedFetcher(url);
    const $ = load(html);
    const script = $('script:contains("window.onload")').html() || '';
    return fetchUrls(script)[0] || '';
  } catch {
    return '';
  }
}

async function extractVidhideEmbed(ctx: MovieScrapeContext | ShowScrapeContext, $: ReturnType<typeof load>) {
  const regIsUrl = /^https?:\/\/([\w.-]+\.[a-z]{2,})(\/.*)?$/i;
  const playerLinks: { idx: number; langBtn: string; url: string }[] = [];

  $('.bg-tabs ul li').each((idx: number, el: CheerioElement) => {
    const li = $(el);
    const langBtn = li.parent()?.parent()?.find('button').first().text().trim().toLowerCase();
    const dataServer = li.attr('data-server') || '';
    const decoded = decodeBase64(dataServer);
    const url = regIsUrl.test(decoded) ? decoded : `${baseUrl}/player/${btoa(dataServer)}`;
    playerLinks.push({ idx, langBtn, url });
  });

  const results: { embedId: string; url: string }[] = [];
  for (const link of playerLinks) {
    let realUrl = link.url;
    if (realUrl.includes('/player/')) {
      realUrl = await resolvePlayerUrl(ctx, realUrl);
    }
    if (/vidhide/i.test(realUrl)) {
      let embedId = 'vidhide';
      if (link.langBtn.includes('latino')) embedId = 'vidhide-latino';
      else if (link.langBtn.includes('castellano') || link.langBtn.includes('español')) embedId = 'vidhide-spanish';
      else if (link.langBtn.includes('ingles') || link.langBtn.includes('english')) embedId = 'vidhide-english';

      results.push({ embedId, url: realUrl });
    }
  }
  return results;
}

async function fetchTmdbTitleInSpanish(tmdbId: number, apiKey: string, mediaType: 'movie' | 'show'): Promise<string> {
  const endpoint =
    mediaType === 'movie'
      ? `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=es-ES`
      : `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=es-ES`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Error fetching TMDB data: ${response.statusText}`);
  }
  const tmdbData = await response.json();
  return mediaType === 'movie' ? tmdbData.title : tmdbData.name;
}

async function fallbackSearchByGithub(
  ctx: MovieScrapeContext | ShowScrapeContext,
): Promise<{ embedId: string; url: string }[]> {
  const tmdbId = ctx.media.tmdbId;
  const mediaType = ctx.media.type;
  if (!tmdbId) return [];

  const jsonFile = mediaType === 'movie' ? 'pelisplushd_movies.json' : 'pelisplushd_series.json';

  let fallbacks: Record<string, string> = {};
  try {
    const url = `https://raw.githubusercontent.com/moonpic/fixed-titles/main/${jsonFile}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error();
    fallbacks = await response.json();
  } catch {
    return [];
  }
  const fallbackTitle = fallbacks[tmdbId.toString()];
  if (!fallbackTitle) return [];
  const normalizedTitle = normalizeTitle(fallbackTitle);
  const pageUrl =
    mediaType === 'movie'
      ? `${baseUrl}/pelicula/${normalizedTitle}`
      : `${baseUrl}/serie/${normalizedTitle}/season/${ctx.media.season?.number}/episode/${ctx.media.episode?.number}`;
  let html = '';
  try {
    html = await ctx.proxiedFetcher(pageUrl);
  } catch {
    return [];
  }
  const $ = load(html);
  return extractVidhideEmbed(ctx, $);
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const mediaType = ctx.media.type;
  const tmdbId = ctx.media.tmdbId;
  const apiKey = '7604525319adb2db8e7e841cb98e9217'; // API key for TMDB

  if (!tmdbId) throw new NotFoundError('TMDB ID is required to fetch the title in Spanish');

  let translatedTitle = '';
  try {
    translatedTitle = await fetchTmdbTitleInSpanish(Number(tmdbId), apiKey, mediaType);
  } catch {
    throw new NotFoundError('Could not get the title from TMDB');
  }
  const normalizedTitle = normalizeTitle(translatedTitle);

  const pageUrl =
    mediaType === 'movie'
      ? `${baseUrl}/pelicula/${normalizedTitle}`
      : `${baseUrl}/serie/${normalizedTitle}/season/${ctx.media.season?.number}/episode/${ctx.media.episode?.number}`;

  ctx.progress(60);

  let html = '';
  try {
    html = await ctx.proxiedFetcher(pageUrl);
  } catch {
    html = '';
  }

  let embeds: { embedId: string; url: string }[] = [];
  if (html) {
    const $ = load(html);
    try {
      embeds = await extractVidhideEmbed(ctx, $);
    } catch {
      embeds = [];
    }
  }

  if (!embeds.length) {
    embeds = await fallbackSearchByGithub(ctx);
  }

  if (!embeds.length) {
    throw new NotFoundError('No vidhide embed found in PelisPlusHD');
  }

  return { embeds };
}

export const pelisplushdScraper = makeSourcerer({
  id: 'pelisplushd',
  name: 'PelisPlusHD',
  rank: 4,
  flags: [flags.IP_LOCKED], // Vidhide embeds are IP locked
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});

// made by @moonpic
