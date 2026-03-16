import { load } from 'cheerio';

import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://cinehdplus.gratis';

async function comboScraper(ctx: ShowScrapeContext): Promise<SourcererOutput> {
  const searchUrl = `${baseUrl}/series/?story=${ctx.media.tmdbId}&do=search&subaction=search`;

  // Fetch the search results page
  const searchPage = await ctx.proxiedFetcher<string>(searchUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Referer: baseUrl,
    },
  });

  const $search = load(searchPage);

  // Find the series page URL from search results
  const seriesUrl = $search('.card__title a[href]:first').attr('href');
  if (!seriesUrl) {
    throw new NotFoundError('Series not found in search results');
  }

  ctx.progress(30);

  // Fetch the series page
  const seriesPageUrl = new URL(seriesUrl, baseUrl);
  const seriesPage = await ctx.proxiedFetcher<string>(seriesPageUrl.href, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Referer: baseUrl,
    },
  });

  const $ = load(seriesPage);

  // Build episode selector using season and episode numbers
  const episodeSelector = `[data-num="${ctx.media.season.number}x${ctx.media.episode.number}"]`;

  // Find mirror links for the specific episode
  const mirrorUrls = $(episodeSelector)
    .siblings('.mirrors')
    .children('[data-link]')
    .map((_, el) => $(el).attr('data-link'))
    .get()
    .filter(Boolean)
    .filter((link) => !link.match(/cinehdplus/)) // Filter out internal cinehdplus links
    .map((link) => {
      // Ensure URLs are properly formatted with https
      const url = link.startsWith('http') ? link : `https://${link}`;
      try {
        return new URL(url);
      } catch {
        return null;
      }
    })
    .filter((url): url is URL => url !== null && url.hostname !== 'cinehdplus.gratis');

  if (!mirrorUrls.length) {
    throw new NotFoundError('No streaming links found for this episode');
  }

  ctx.progress(70);

  // Map URLs to appropriate embed scrapers
  const embeds = mirrorUrls
    .map((url) => {
      let embedId: string;

      // Map hostname to embed scraper ID
      if (url.hostname.includes('supervideo')) {
        embedId = 'supervideo';
      } else if (url.hostname.includes('dropload')) {
        embedId = 'dropload';
      } else {
        // Fallback for unknown hosts - skip this embed
        return null;
      }

      return {
        embedId,
        url: url.href,
      };
    })
    .filter((embed): embed is NonNullable<typeof embed> => embed !== null);

  ctx.progress(90);

  return {
    embeds,
  };
}

export const cinehdplusScraper = makeSourcerer({
  id: 'cinehdplus',
  name: 'CineHDPlus (Latino)',
  rank: 8,
  disabled: false,
  flags: [],
  scrapeShow: comboScraper,
});
