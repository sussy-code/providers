import { load } from 'cheerio';

import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { mixdropScraper } from '@/providers/embeds/mixdrop';
import { warezcdnembedHlsScraper } from '@/providers/embeds/warezcdn/hls';
import { warezcdnembedMp4Scraper } from '@/providers/embeds/warezcdn/mp4';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { warezcdnApiBase, warezcdnBase } from './common';

const universalScraper = async (ctx: MovieScrapeContext | ShowScrapeContext) => {
  if (!ctx.media.imdbId) throw new NotFoundError('This source requires IMDB id.');

  let id = `filme/${ctx.media.imdbId}`;
  if (ctx.media.type === 'show')
    id = `serie/${ctx.media.imdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;

  const serversPage = await ctx.proxiedFetcher(`/${id}`, {
    baseUrl: warezcdnBase,
  });
  const $ = load(serversPage);

  const embedsHost = $('.hostList.active [data-load-embed]').get();

  const embeds: SourcererEmbed[] = [];

  embedsHost.forEach(async (element) => {
    const embedHost = $(element).attr('data-load-embed-host')!;
    const embedUrl = $(element).attr('data-load-embed')!;

    if (embedHost === 'mixdrop') {
      const params = new URLSearchParams({
        id: embedUrl,
        sv: 'mixdrop',
      });
      const realUrl = await ctx.proxiedFetcher(`/getPlay.php?${params}`, {
        baseUrl: warezcdnApiBase,
        headers: {
          Referer: `${warezcdnApiBase}/getEmbed.php?${params}`,
        },
      });

      const realEmbedUrl = realUrl.match(/window\.location\.href="([^"]*)";/);
      embeds.push({
        embedId: mixdropScraper.id,
        url: realEmbedUrl[1],
      });
    } else if (embedHost === 'warezcdn') {
      embeds.push(
        {
          embedId: warezcdnembedHlsScraper.id,
          url: embedUrl,
        },
        {
          embedId: warezcdnembedMp4Scraper.id,
          url: embedUrl,
        },
      );
    }
  });

  return {
    embeds,
  } as SourcererOutput;
};

export const warezcdnScraper = makeSourcerer({
  id: 'warezcdn',
  name: 'WarezCDN',
  rank: 81,
  flags: [],
  scrapeMovie: universalScraper,
  scrapeShow: universalScraper,
});
