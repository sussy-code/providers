import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, makeSourcerer } from '@/providers/base';
import { compareMedia } from '@/utils/compare';
import { NotFoundError } from '@/utils/errors';

import { baseUrl, parseSearch } from './common';

export const tugaflixScraper = makeSourcerer({
  id: 'tugaflix',
  name: 'Tugaflix',
  rank: 73,
  flags: [flags.IP_LOCKED],
  scrapeMovie: async (ctx) => {
    const searchResults = parseSearch(
      await ctx.proxiedFetcher<string>('/filmes/', {
        baseUrl,
        query: {
          s: ctx.media.title,
        },
      }),
    );
    if (searchResults.length === 0) throw new NotFoundError('No watchable item found');

    const url = searchResults.find((x) => x && compareMedia(ctx.media, x.title, x.year))?.url;
    if (!url) throw new NotFoundError('No watchable item found');

    const videoPage = await ctx.proxiedFetcher<string>(url, {
      method: 'POST',
      body: new URLSearchParams({ play: '' }),
    });
    const $ = load(videoPage);

    const embeds: SourcererEmbed[] = [];

    for (const element of $('.play a')) {
      const embedUrl = $(element).attr('href');
      if (!embedUrl) continue;

      const embedPage = await ctx.proxiedFetcher.full(
        embedUrl.startsWith('https://') ? embedUrl : `https://${embedUrl}`,
      );

      const finalUrl = load(embedPage.body)('a:contains("Download Filme")').attr('href');
      if (!finalUrl) continue;

      if (finalUrl.includes('streamtape')) {
        embeds.push({
          embedId: 'streamtape',
          url: finalUrl,
        });
        // found doodstream on a few shows, maybe movies use it too?
        // the player 2 is just streamtape in a custom player
      } else if (finalUrl.includes('dood')) {
        embeds.push({
          embedId: 'dood',
          url: finalUrl,
        });
      }
    }

    return {
      embeds,
    };
  },
  scrapeShow: async (ctx) => {
    const searchResults = parseSearch(
      await ctx.proxiedFetcher<string>('/series/', {
        baseUrl,
        query: {
          s: ctx.media.title,
        },
      }),
    );
    if (searchResults.length === 0) throw new NotFoundError('No watchable item found');

    const url = searchResults.find((x) => x && compareMedia(ctx.media, x.title, x.year))?.url;
    if (!url) throw new NotFoundError('No watchable item found');

    const s = ctx.media.season.number < 10 ? `0${ctx.media.season.number}` : ctx.media.season.number.toString();
    const e = ctx.media.episode.number < 10 ? `0${ctx.media.episode.number}` : ctx.media.episode.number.toString();
    const videoPage = await ctx.proxiedFetcher(url, {
      method: 'POST',
      body: new URLSearchParams({ [`S${s}E${e}`]: '' }),
    });

    const embedUrl = load(videoPage)('iframe[name="player"]').attr('src');
    if (!embedUrl) throw new Error('Failed to find iframe');

    const playerPage = await ctx.proxiedFetcher(embedUrl.startsWith('https:') ? embedUrl : `https:${embedUrl}`, {
      method: 'POST',
      body: new URLSearchParams({ submit: '' }),
    });

    const embeds: SourcererEmbed[] = [];

    const finalUrl = load(playerPage)('a:contains("Download Episodio")').attr('href');

    if (finalUrl?.includes('streamtape')) {
      embeds.push({
        embedId: 'streamtape',
        url: finalUrl,
      });
    } else if (finalUrl?.includes('dood')) {
      embeds.push({
        embedId: 'dood',
        url: finalUrl,
      });
    }

    return {
      embeds,
    };
  },
});
