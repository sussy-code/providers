import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { FetcherResponse } from '@/fetchers/types';
import { SourcererEmbed, SourcererOutput, makeEmbed, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ScrapeContext, ShowScrapeContext } from '@/utils/context';
import { fetchTMDBName } from '@/utils/tmdb';

import { scrapeDoodstreamEmbed } from './doodstream';
import { EMBED_URL, ORIGIN_HOST, getMoviePageURL, throwOnResponse } from './utils';

export const LOG_PREFIX = '[FSOnline]';

async function getMovieID(ctx: ScrapeContext, url: string): Promise<string | undefined> {
  // console.log(LOG_PREFIX, 'Scraping movie ID from', url);

  let $: CheerioAPI;
  try {
    const response: FetcherResponse = await ctx.proxiedFetcher.full(url, {
      headers: {
        Origin: ORIGIN_HOST,
        Referer: ORIGIN_HOST,
      },
    });
    throwOnResponse(response);
    $ = cheerio.load(await response.body);
  } catch (error) {
    console.error(LOG_PREFIX, 'Failed to fetch movie page', url, error);
    return undefined;
  }

  const movieID: string | undefined = $('#show_player_lazy').attr('movie-id');
  if (!movieID) {
    console.error(LOG_PREFIX, 'Could not find movie ID', url);
    return undefined;
  }
  // console.log(LOG_PREFIX, 'Movie ID', movieID);

  return movieID;
}

async function getMovieSources(ctx: ScrapeContext, id: string, refererHeader: string): Promise<Map<string, string>> {
  // console.log(LOG_PREFIX, 'Scraping movie sources for', id);
  const sources: Map<string, string> = new Map<string, string>();

  let $: CheerioAPI;
  try {
    const response: FetcherResponse = await ctx.proxiedFetcher.full(EMBED_URL, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Referer: refererHeader,
        Origin: ORIGIN_HOST,
      },
      body: `action=lazy_player&movieID=${id}`,
    });
    throwOnResponse(response);
    $ = cheerio.load(await response.body);
  } catch (error) {
    console.error(LOG_PREFIX, 'Could not fetch source index', error);
    return sources;
  }

  $('li.dooplay_player_option').each((_, element) => {
    const name: string = $(element).find('span').text().trim();
    const url: string | undefined = $(element).attr('data-vs');
    if (!url) {
      console.warn(LOG_PREFIX, 'Skipping invalid source', name);
      return;
    }
    // console.log(LOG_PREFIX, 'Found movie source for', id, name, url);
    sources.set(name, url);
  });

  return sources;
}

function addEmbedFromSources(name: string, sources: Map<string, string>, embeds: SourcererEmbed[]) {
  const url = sources.get(name);
  if (!url) {
    return;
  }
  embeds.push({
    embedId: `fsonline-${name.toLowerCase()}`,
    url,
  });
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const movieName = await fetchTMDBName(ctx);
  const moviePageURL = getMoviePageURL(
    ctx.media.type === 'movie' ? `${movieName} ${ctx.media.releaseYear}` : movieName,
    ctx.media.type === 'show' ? ctx.media.season.number : undefined,
    ctx.media.type === 'show' ? ctx.media.episode.number : undefined,
  );
  // console.log(LOG_PREFIX, 'Movie page URL', moviePageURL);

  const movieID = await getMovieID(ctx, moviePageURL);
  if (!movieID) {
    return {
      embeds: [],
      stream: [],
    };
  }

  const embeds: SourcererEmbed[] = [];
  const sources: Map<string, string> = await getMovieSources(ctx, movieID, moviePageURL);
  addEmbedFromSources('Filemoon', sources, embeds);
  addEmbedFromSources('Doodstream', sources, embeds);

  if (embeds.length < 1) {
    throw new Error('No valid sources were found');
  }

  return {
    embeds,
  };
}

export const fsOnlineScraper = makeSourcerer({
  id: 'fsonline',
  name: 'FSOnline',
  rank: 22,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});

export const fsOnlineEmbeds = [
  makeEmbed({
    id: 'fsonline-doodstream',
    name: 'Doodstream',
    rank: 22,
    scrape: scrapeDoodstreamEmbed,
    flags: [flags.CORS_ALLOWED],
  }),
  // makeEmbed({
  //   id: 'fsonline-filemoon',
  //   name: 'Filemoon',
  //   rank: 140,
  //   scrape: scrapeFilemoonEmbed,
  //   flags: [flags.CORS_ALLOWED],
  // }),
];
