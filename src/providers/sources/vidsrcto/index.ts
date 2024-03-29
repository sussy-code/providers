import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

import { decryptSourceUrl } from './common';
import { SourceResult, SourcesResult } from './types';

const vidSrcToBase = 'https://vidsrc.to';
const referer = `${vidSrcToBase}/`;

const universalScraper = async (ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> => {
  const mediaId = ctx.media.imdbId ?? ctx.media.tmdbId;
  const url =
    ctx.media.type === 'movie'
      ? `/embed/movie/${mediaId}`
      : `/embed/tv/${mediaId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  const mainPage = await ctx.proxiedFetcher<string>(url, {
    baseUrl: vidSrcToBase,
    headers: {
      referer,
    },
  });
  const mainPage$ = load(mainPage);
  const dataId = mainPage$('a[data-id]').attr('data-id');
  if (!dataId) throw new Error('No data-id found');
  const sources = await ctx.proxiedFetcher<SourcesResult>(`/ajax/embed/episode/${dataId}/sources`, {
    baseUrl: vidSrcToBase,
    headers: {
      referer,
    },
  });
  if (sources.status !== 200) throw new Error('No sources found');

  const embeds: SourcererEmbed[] = [];
  const embedArr = [];
  for (const source of sources.result) {
    const sourceRes = await ctx.proxiedFetcher<SourceResult>(`/ajax/embed/source/${source.id}`, {
      baseUrl: vidSrcToBase,
      headers: {
        referer,
      },
    });
    const decryptedUrl = decryptSourceUrl(sourceRes.result.url);
    embedArr.push({ source: source.title, url: decryptedUrl });
  }

  for (const embedObj of embedArr) {
    if (embedObj.source === 'Vidplay') {
      const fullUrl = new URL(embedObj.url);
      embeds.push({
        embedId: 'vidplay',
        url: fullUrl.toString(),
      });
    }

    if (embedObj.source === 'Filemoon') {
      const fullUrl = new URL(embedObj.url);
      // Originally Filemoon does not have subtitles. But we can use the ones from Vidplay.
      const urlWithSubtitles = embedArr.find((v) => v.source === 'Vidplay' && v.url.includes('sub.info'))?.url;
      const subtitleUrl = urlWithSubtitles ? new URL(urlWithSubtitles).searchParams.get('sub.info') : null;
      if (subtitleUrl) fullUrl.searchParams.set('sub.info', subtitleUrl);
      embeds.push({
        embedId: 'filemoon',
        url: fullUrl.toString(),
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
  flags: [flags.CORS_ALLOWED],
  rank: 130,
});
