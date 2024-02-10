import { load } from 'cheerio';

import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

import { decryptSourceUrl } from './common';
import { SourceResult, SourcesResult } from './types';

const vidSrcToBase = 'https://vidsrc.to';
const referer = `${vidSrcToBase}/`;

const universalScraper = async (ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> => {
  const imdbId = ctx.media.imdbId;
  const url =
    ctx.media.type === 'movie'
      ? `/embed/movie/${imdbId}`
      : `/embed/tv/${imdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
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
  const embedUrls = [];
  for (const source of sources.result) {
    const sourceRes = await ctx.proxiedFetcher<SourceResult>(`/ajax/embed/source/${source.id}`, {
      baseUrl: vidSrcToBase,
      headers: {
        referer,
      },
    });
    const decryptedUrl = decryptSourceUrl(sourceRes.result.url);
    embedUrls.push(decryptedUrl);
  }

  // Originally Filemoon does not have subtitles. But we can use the ones from Vidplay.
  const urlWithSubtitles = embedUrls.find((v) => v.includes('sub.info'));
  let subtitleUrl: string | null = null;
  if (urlWithSubtitles) subtitleUrl = new URL(urlWithSubtitles).searchParams.get('sub.info');

  for (const source of sources.result) {
    if (source.title === 'Vidplay') {
      const embedUrl = embedUrls.find((v) => v.includes('vidplay'));
      if (!embedUrl) continue;
      embeds.push({
        embedId: 'vidplay',
        url: embedUrl,
      });
    }

    if (source.title === 'Filemoon') {
      const embedUrl = embedUrls.find((v) => v.includes('filemoon'));
      if (!embedUrl) continue;
      const fullUrl = new URL(embedUrl);
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
  flags: [],
  rank: 300,
});
