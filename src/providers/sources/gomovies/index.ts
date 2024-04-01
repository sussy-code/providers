import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { doodScraper } from '@/providers/embeds/dood';
import { mixdropScraper } from '@/providers/embeds/mixdrop';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { upstreamScraper } from '@/providers/embeds/upstream';
import { vidCloudScraper } from '@/providers/embeds/vidcloud';
import { voeScraper } from '@/providers/embeds/voe';
import { NotFoundError } from '@/utils/errors';

import { getSource } from './source';

export const gomoviesBase = `https://gomovies.sx`;

export const goMoviesScraper = makeSourcerer({
  id: 'gomovies',
  name: 'GOmovies',
  rank: 60,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  async scrapeShow(ctx) {
    const search = await ctx.proxiedFetcher(`/search/${ctx.media.title.replaceAll(/[^a-z0-9A-Z]/g, '-')}`, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      baseUrl: gomoviesBase,
    });

    const searchPage = load(search);
    const mediaElements = searchPage('div.film-detail');

    const mediaData = mediaElements.toArray().map((movieEl) => {
      const name = searchPage(movieEl).find('h2.film-name a')?.text();
      const year = searchPage(movieEl).find('span.fdi-item:first')?.text();
      const path = searchPage(movieEl).find('h2.film-name a').attr('href');
      return { name, year, path };
    });

    const targetMedia = mediaData.find((m) => m.name === ctx.media.title);
    if (!targetMedia?.path) throw new NotFoundError('Media not found');

    // Example movie path: /movie/watch-{slug}-{id}
    // Example series path: /tv/watch-{slug}-{id}
    let mediaId = targetMedia.path.split('-').pop()?.replace('/', '');

    const seasons = await ctx.proxiedFetcher<string>(`/ajax/v2/tv/seasons/${mediaId}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      baseUrl: gomoviesBase,
    });

    const seasonsEl = load(seasons)('.ss-item');

    const seasonsData = seasonsEl.toArray().map((season) => ({
      number: load(season).text().replace('Season ', ''),
      dataId: season.attribs['data-id'],
    }));

    const seasonNumber = ctx.media.season.number;
    const targetSeason = seasonsData.find((season) => +season.number === seasonNumber);

    if (!targetSeason) throw new NotFoundError('Season not found');

    const episodes = await ctx.proxiedFetcher<string>(`/ajax/v2/season/episodes/${targetSeason.dataId}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      baseUrl: gomoviesBase,
    });

    const episodesPage = load(episodes);
    const episodesEl = episodesPage('.eps-item');

    const episodesData = episodesEl.toArray().map((ep) => ({
      dataId: ep.attribs['data-id'],
      number: episodesPage(ep).find('strong').text().replace('Eps', '').replace(':', '').trim(),
    }));

    const episodeNumber = ctx.media.episode.number;
    const targetEpisode = episodesData.find((ep) => (ep.number ? +ep.number === episodeNumber : false));
    if (!targetEpisode?.dataId) throw new NotFoundError('Episode not found');

    mediaId = targetEpisode.dataId;

    const sources = await ctx.proxiedFetcher<string>(`ajax/v2/episode/servers/${mediaId}`, {
      baseUrl: gomoviesBase,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const upcloudSource = await getSource(ctx, sources, 'upcloud');
    const vidcloudSource = await getSource(ctx, sources, 'vidcloud');
    const voeSource = await getSource(ctx, sources, 'voe');
    const doodSource = await getSource(ctx, sources, 'doodstream');
    const upstreamSource = await getSource(ctx, sources, 'upstream');
    const mixdropSource = await getSource(ctx, sources, 'mixdrop');

    const embeds = [
      {
        embedId: upcloudScraper.id,
        url: upcloudSource?.link,
      },
      {
        embedId: vidCloudScraper.id,
        url: vidcloudSource?.link,
      },
      {
        embedId: voeScraper.id,
        url: voeSource?.link,
      },
      {
        embedId: doodScraper.id,
        url: doodSource?.link,
      },
      {
        embedId: upstreamScraper.id,
        url: upstreamSource?.link,
      },
      {
        embedId: mixdropScraper.id,
        url: mixdropSource?.link,
      },
    ];

    const filteredEmbeds = embeds
      .filter((embed) => embed.url)
      .map((embed) => ({
        embedId: embed.embedId,
        url: embed.url as string,
      }));

    if (filteredEmbeds.length === 0) throw new Error('No valid embeds found.');

    return {
      embeds: filteredEmbeds,
    };
  },
  async scrapeMovie(ctx) {
    const search = await ctx.proxiedFetcher(`/search/${ctx.media.title.replaceAll(/[^a-z0-9A-Z]/g, '-')}`, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      baseUrl: gomoviesBase,
    });

    const searchPage = load(search);
    const mediaElements = searchPage('div.film-detail');

    const mediaData = mediaElements.toArray().map((movieEl) => {
      const name = searchPage(movieEl).find('h2.film-name a')?.text();
      const year = searchPage(movieEl).find('span.fdi-item:first')?.text();
      const path = searchPage(movieEl).find('h2.film-name a').attr('href');
      return { name, year, path };
    });

    const targetMedia = mediaData.find(
      (m) => m.name === ctx.media.title && m.year === ctx.media.releaseYear.toString(),
    );
    if (!targetMedia?.path) throw new NotFoundError('Media not found');

    // Example movie path: /movie/watch-{slug}-{id}
    // Example series path: /tv/watch-{slug}-{id}
    const mediaId = targetMedia.path.split('-').pop()?.replace('/', '');

    const sources = await ctx.proxiedFetcher<string>(`ajax/movie/episodes/${mediaId}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      baseUrl: gomoviesBase,
    });

    const upcloudSource = await getSource(ctx, sources, 'upcloud');
    const vidcloudSource = await getSource(ctx, sources, 'vidcloud');
    const voeSource = await getSource(ctx, sources, 'voe');
    const doodSource = await getSource(ctx, sources, 'doodstream');
    const upstreamSource = await getSource(ctx, sources, 'upstream');
    const mixdropSource = await getSource(ctx, sources, 'mixdrop');

    const embeds = [
      {
        embedId: upcloudScraper.id,
        url: upcloudSource?.link,
      },
      {
        embedId: vidCloudScraper.id,
        url: vidcloudSource?.link,
      },
      {
        embedId: voeScraper.id,
        url: voeSource?.link,
      },
      {
        embedId: doodScraper.id,
        url: doodSource?.link,
      },
      {
        embedId: upstreamScraper.id,
        url: upstreamSource?.link,
      },
      {
        embedId: mixdropScraper.id,
        url: mixdropSource?.link,
      },
    ];

    const filteredEmbeds = embeds
      .filter((embed) => embed.url)
      .map((embed) => ({
        embedId: embed.embedId,
        url: embed.url as string,
      }));

    if (filteredEmbeds.length === 0) throw new Error('No valid embeds found.');

    return {
      embeds: filteredEmbeds,
    };
  },
});
