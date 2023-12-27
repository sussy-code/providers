import { load } from 'cheerio';

import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

import { decryptSourceUrl } from './common';
import { SourceResult, SourcesResult } from './types';

const vidSrcToBase = 'https://vidsrc.to';

const universalScraper = async (ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> => {
  const imdbId = ctx.media.imdbId;
  const url =
    ctx.media.type === 'movie'
      ? `${vidSrcToBase}/embed/movie/${imdbId}`
      : `${vidSrcToBase}}/embed/tv/${imdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;

  const mainPage = await ctx.fetcher<string>(url);
  const mainPage$ = load(mainPage);
  const dataId = mainPage$('a[data-id]').attr('data-id');
  if (!dataId) throw new Error('No data-id found');
  const sources = await ctx.fetcher<SourcesResult>(`/ajax/embed/episode/${dataId}/sources`, {
    baseUrl: vidSrcToBase,
  });
  if (sources.status !== 200) throw new Error('No sources found');

  const embeds: SourcererEmbed[] = [];
  for (const source of sources.result) {
    const sourceRes = await ctx.fetcher<SourceResult>(`/ajax/embed/source/${source.id}`, {
      baseUrl: vidSrcToBase,
    });
    const decryptedUrl = decryptSourceUrl(sourceRes.result.url);
    if (source.title === 'Filemoon') {
      embeds.push({
        embedId: 'filemoon',
        url: decryptedUrl,
      });
    }
    if (source.title === 'Vidplay') {
      embeds.push({
        embedId: 'vidplay',
        url: decryptedUrl,
      });
    }
  }
  return {
    embeds,
  };
};

export const vidSrcToScraper = makeSourcerer({
  id: 'vidsrcto',
  name: 'VidSrcTo',
  scrapeMovie: universalScraper,
  scrapeShow: universalScraper,
  flags: [],
  rank: 500,
});
