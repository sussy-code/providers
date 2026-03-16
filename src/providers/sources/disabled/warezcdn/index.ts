import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { mixdropScraper } from '@/providers/embeds/mixdrop';
import { warezcdnembedHlsScraper } from '@/providers/embeds/warezcdn/hls';
import { warezcdnembedMp4Scraper } from '@/providers/embeds/warezcdn/mp4';
import { warezPlayerScraper } from '@/providers/embeds/warezcdn/warezplayer';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { warezcdnBase } from './common';
// import { cachedSeasonsRes } from './types';

async function getEmbeds(id: string, servers: string, ctx: ScrapeContext): Promise<SourcererOutput> {
  const embeds: SourcererEmbed[] = [];

  for (const server of servers.split(',')) {
    await ctx.proxiedFetcher<string>(`/getEmbed.php`, {
      baseUrl: warezcdnBase,
      headers: {
        Referer: `${warezcdnBase}/getEmbed.php?${new URLSearchParams({ id, sv: server })}`,
      },
      method: 'HEAD',
      query: { id, sv: server },
    });

    const embedPage = await ctx.proxiedFetcher<string>(`/getPlay.php`, {
      baseUrl: warezcdnBase,
      headers: {
        Referer: `${warezcdnBase}/getEmbed.php?${new URLSearchParams({ id, sv: server })}`,
      },
      query: { id, sv: server },
    });

    const url = embedPage.match(/window.location.href\s*=\s*"([^"]+)"/)?.[1];

    if (url && server === 'warezcdn') {
      embeds.push(
        { embedId: warezcdnembedHlsScraper.id, url },
        { embedId: warezcdnembedMp4Scraper.id, url },
        { embedId: warezPlayerScraper.id, url },
      );
    } else if (url && server === 'mixdrop') embeds.push({ embedId: mixdropScraper.id, url });
  }

  return { embeds };
}

export const warezcdnScraper = makeSourcerer({
  id: 'warezcdn',
  name: 'WarezCDN',
  disabled: true,
  rank: 115,
  flags: [],
  scrapeMovie: async (ctx) => {
    if (!ctx.media.imdbId) throw new NotFoundError('This source requires IMDB id.');
    const serversPage = await ctx.proxiedFetcher<string>(`/filme/${ctx.media.imdbId}`, {
      baseUrl: warezcdnBase,
    });

    const [, id, servers] = serversPage.match(/let\s+data\s*=\s*'\[\s*\{\s*"id":"([^"]+)".*?"servers":"([^"]+)"/)!;
    if (!id || !servers) throw new NotFoundError('Failed to find episode id');
    ctx.progress(40);

    return getEmbeds(id, servers, ctx);
  },
  // scrapeShow: async (ctx) => {
  //   if (!ctx.media.imdbId) throw new NotFoundError('This source requires IMDB id.');
  //   const url = `${warezcdnBase}/serie/${ctx.media.imdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  //   const serversPage = await ctx.proxiedFetcher<string>(url);

  //   const seasonsApi = serversPage.match(/var\s+cachedSeasons\s*=\s*"([^"]+)"/)?.[1];
  //   if (!seasonsApi) throw new NotFoundError('Failed to find data');
  //   ctx.progress(40);

  //   const streamsData = await ctx.proxiedFetcher<cachedSeasonsRes>(seasonsApi, {
  //     baseUrl: warezcdnBase,
  //     headers: {
  //       Referer: url,
  //       'X-Requested-With': 'XMLHttpRequest',
  //     },
  //   });

  //   const season = Object.values(streamsData.seasons).find((s) => s.name === ctx.media.season.number.toString());
  //   if (!season) throw new NotFoundError('Failed to find season id');
  //   const episode = Object.values(season.episodes).find((e) => e.name === ctx.media.season.number.toString())?.id;
  //   if (!episode) throw new NotFoundError('Failed to find episode id');

  //   const episodeData = await ctx.proxiedFetcher<string>('/core/ajax.php', {
  //     baseUrl: warezcdnBase,
  //     headers: {
  //       Referer: url,
  //       'X-Requested-With': 'XMLHttpRequest',
  //     },
  //     query: { audios: episode },
  //   });

  //   const [, id, servers] = episodeData.replace(/\\"/g, '"').match(/"\[\s*\{\s*"id":"([^"]+)".*?"servers":"([^"]+)"/)!;
  //   if (!id || !servers) throw new NotFoundError('Failed to find episode id');

  //   return getEmbeds(id, servers, ctx);
  // },
});
