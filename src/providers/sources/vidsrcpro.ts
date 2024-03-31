import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

type hashResult = {
  name: 'jett' | 'viper';
  hash: string;
};

const vidSrcProBase = 'https://vidsrc.pro';
const referer = `${vidSrcProBase}/`;

const universalScraper = async (ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> => {
  const hashRegex = /"hash":\s*"([^"]+)"/;
  const tmdbId = ctx.media.tmdbId;

  const url =
    ctx.media.type === 'movie'
      ? `/embed/movie/${tmdbId}`
      : `/embed/tv/${tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;

  const mainPage = await ctx.fetcher<string>(url, {
    baseUrl: vidSrcProBase,
    headers: {
      referer,
    },
  });
  const mainPage$ = load(mainPage);
  const hash = mainPage$('script').text().match(hashRegex);
  if (!hash) throw new Error('No hash found');
  const decodedHash: hashResult[] = JSON.parse(atob(hash[1].split('').reverse().join('')));

  const embeds: SourcererEmbed[] = [];
  for (const source of decodedHash) {
    embeds.push({
      embedId: source.name,
      url: `${vidSrcProBase}/api/e/${source.hash}`,
    });
  }

  return {
    embeds,
  };
};

export const vidSrcProScraper = makeSourcerer({
  id: 'vidsrcpro',
  name: 'VidSrcPro',
  scrapeMovie: universalScraper,
  scrapeShow: universalScraper,
  flags: [flags.CORS_ALLOWED, flags.IP_LOCKED],
  rank: 115,
});
