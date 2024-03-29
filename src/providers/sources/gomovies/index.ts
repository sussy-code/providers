import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { NotFoundError } from '@/utils/errors';

import { getSource } from './source';

export const gomoviesBase = `https://gomovies.sx`;

export const goMoviesScraper = makeSourcerer({
  id: 'gomovies',
  name: 'GOmovies',
  rank: 60,
  flags: [flags.CORS_ALLOWED],
  disabled: true,
  async scrapeShow(ctx) {
    const search = await ctx.proxiedFetcher<string>(`/ajax/search`, {
      method: 'POST',
      body: new URLSearchParams({ keyword: ctx.media.title }),
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      baseUrl: gomoviesBase,
    });

    const searchPage = load(search);
    const mediaElements = searchPage('a.nav-item');

    const mediaData = mediaElements.toArray().map((movieEl) => {
      const name = searchPage(movieEl).find('h3.film-name')?.text();
      const year = searchPage(movieEl).find('div.film-infor span:first-of-type')?.text();
      const path = searchPage(movieEl).attr('href');
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

    const upcloudSource = await getSource(ctx, sources);

    return {
      embeds: [
        {
          embedId: upcloudScraper.id,
          url: upcloudSource.link,
        },
      ],
    };
  },
  async scrapeMovie(ctx) {
    const search = await ctx.proxiedFetcher<string>(`ajax/search`, {
      method: 'POST',
      body: new URLSearchParams({ keyword: ctx.media.title }),
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      baseUrl: gomoviesBase,
    });

    const searchPage = load(search);
    const mediaElements = searchPage('a.nav-item');

    const mediaData = mediaElements.toArray().map((movieEl) => {
      const name = searchPage(movieEl).find('h3.film-name')?.text();
      const year = searchPage(movieEl).find('div.film-infor span:first-of-type')?.text();
      const path = searchPage(movieEl).attr('href');
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

    const upcloudSource = await getSource(ctx, sources);

    return {
      embeds: [
        {
          embedId: upcloudScraper.id,
          url: upcloudSource.link,
        },
      ],
    };
  },
});
