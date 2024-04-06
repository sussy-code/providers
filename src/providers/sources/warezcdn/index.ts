import { load } from 'cheerio';

import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { mixdropScraper } from '@/providers/embeds/mixdrop';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { warezcdnApiBase, warezcdnBase } from './common';

const embeds = {
  warezcdn: mixdropScraper.id,
  mixdrop: mixdropScraper.id,
};

const universalScraper = async (ctx: MovieScrapeContext | ShowScrapeContext) => {
  if (!ctx.media.imdbId) throw new NotFoundError('This source requires IMDB id.');

  let id = `filme/${ctx.media.imdbId}`;
  if (ctx.media.type === 'show')
    id = `serie/${ctx.media.imdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;

  const serversPage = await ctx.proxiedFetcher(`/${id}`, {
    baseUrl: warezcdnBase,
  });
  const $ = load(serversPage);

  const servers = await Promise.all(
    $('.hostList.active [data-load-embed]')
      .filter((_index, element) => {
        const embed = $(element).attr('data-load-embed-host');
        return !!embed && !!embeds[embed as keyof typeof embeds];
      })
      .map(async (_index, element) => {
        const embedHost = $(element).attr('data-load-embed-host');
        const embedId = embeds[embedHost as keyof typeof embeds];
        let embedUrl = $(element).attr('data-load-embed')!;

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
          embedUrl = realEmbedUrl[1];
        }

        return {
          embedId,
          url: embedUrl,
        } as SourcererEmbed;
      })
      .get(),
  );

  return {
    embeds: servers,
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
