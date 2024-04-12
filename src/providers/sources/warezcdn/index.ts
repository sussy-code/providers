import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, makeSourcerer } from '@/providers/base';
import { mixdropScraper } from '@/providers/embeds/mixdrop';
import { warezcdnembedHlsScraper } from '@/providers/embeds/warezcdn/hls';
import { warezcdnembedMp4Scraper } from '@/providers/embeds/warezcdn/mp4';
import { NotFoundError } from '@/utils/errors';

import { getExternalPlayerUrl, warezcdnBase } from './common';
import { SerieAjaxResponse } from './types';

export const warezcdnScraper = makeSourcerer({
  id: 'warezcdn',
  name: 'WarezCDN',
  rank: 81,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: async (ctx) => {
    if (!ctx.media.imdbId) throw new NotFoundError('This source requires IMDB id.');

    const serversPage = await ctx.proxiedFetcher<string>(`/filme/${ctx.media.imdbId}`, {
      baseUrl: warezcdnBase,
    });
    const $ = load(serversPage);

    const embedsHost = $('.hostList.active [data-load-embed]').get();

    const embeds: SourcererEmbed[] = [];

    embedsHost.forEach(async (element) => {
      const embedHost = $(element).attr('data-load-embed-host')!;
      const embedUrl = $(element).attr('data-load-embed')!;

      if (embedHost === 'mixdrop') {
        const realEmbedUrl = await getExternalPlayerUrl(ctx, 'mixdrop', embedUrl);
        if (!realEmbedUrl) throw new Error('Could not find embed url');
        embeds.push({
          embedId: mixdropScraper.id,
          url: realEmbedUrl,
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
    };
  },
  scrapeShow: async (ctx) => {
    if (!ctx.media.imdbId) throw new NotFoundError('This source requires IMDB id.');

    const url = `${warezcdnBase}/serie/${ctx.media.imdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;

    const serversPage = await ctx.proxiedFetcher<string>(url);

    const episodeId = serversPage.match(/\$\('\[data-load-episode-content="(\d+)"\]'\)/)?.[1];

    if (!episodeId) throw new NotFoundError('Failed to find episode id');

    const streamsData = await ctx.proxiedFetcher<string>(`/serieAjax.php`, {
      method: 'POST',
      baseUrl: warezcdnBase,
      body: new URLSearchParams({
        getAudios: episodeId,
      }),
      headers: {
        Origin: warezcdnBase,
        Referer: url,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const streams: SerieAjaxResponse = JSON.parse(streamsData);
    const list = streams.list['0'];
    const embeds: SourcererEmbed[] = [];

    // 3 means ok
    if (list.mixdropStatus === '3') {
      const realEmbedUrl = await getExternalPlayerUrl(ctx, 'mixdrop', list.id);
      if (!realEmbedUrl) throw new Error('Could not find embed url');
      embeds.push({
        embedId: mixdropScraper.id,
        url: realEmbedUrl,
      });
    }

    if (list.warezcdnStatus === '3') {
      embeds.push(
        {
          embedId: warezcdnembedHlsScraper.id,
          url: list.id,
        },
        {
          embedId: warezcdnembedMp4Scraper.id,
          url: list.id,
        },
      );
    }

    return {
      embeds,
    };
  },
});
