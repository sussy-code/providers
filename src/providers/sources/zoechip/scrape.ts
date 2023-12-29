import { load } from 'cheerio';

import { ShowMedia } from '@/entrypoint/utils/media';
import { ZoeChipSourceDetails, zoeBase } from '@/providers/sources/zoechip/common';
import { MovieScrapeContext, ScrapeContext, ShowScrapeContext } from '@/utils/context';

export async function getZoeChipSources(ctx: MovieScrapeContext | ShowScrapeContext, id: string) {
  // Movies use /ajax/episode/list/ID
  // Shows use /ajax/episode/servers/ID
  const endpoint = ctx.media.type === 'movie' ? 'list' : 'servers';
  const html = await ctx.proxiedFetcher<string>(`/ajax/episode/${endpoint}/${id}`, {
    baseUrl: zoeBase,
  });
  const $ = load(html);

  return $('.nav-item a')
    .toArray()
    .map((el) => {
      // Movies use data-linkid
      // Shows use data-id
      const idAttribute = ctx.media.type === 'movie' ? 'data-linkid' : 'data-id';
      const element = $(el);
      const embedTitle = element.attr('title');
      const linkId = element.attr(idAttribute);

      if (!embedTitle || !linkId) {
        throw new Error('invalid sources');
      }

      return {
        embed: embedTitle,
        episodeId: linkId,
      };
    });
}

export async function getZoeChipSourceURL(ctx: ScrapeContext, sourceID: string): Promise<string | null> {
  const details = await ctx.proxiedFetcher<ZoeChipSourceDetails>(`/ajax/sources/${sourceID}`, {
    baseUrl: zoeBase,
  });

  // TODO - Support non-iframe sources
  if (details.type !== 'iframe') {
    return null;
  }

  // TODO - Extract the other data from the source

  return details.link;
}

export async function getZoeChipSeasonID(ctx: ScrapeContext, media: ShowMedia, showID: string): Promise<string | null> {
  const html = await ctx.proxiedFetcher<string>(`/ajax/season/list/${showID}`, {
    baseUrl: zoeBase,
  });

  const $ = load(html);

  const seasons = $('.dropdown-menu a')
    .toArray()
    .map((el) => {
      const element = $(el);
      const seasonID = element.attr('data-id');
      const seasonNumber = element.html()?.split(' ')[1];

      if (!seasonID || !seasonNumber || Number.isNaN(Number(seasonNumber))) {
        throw new Error('invalid season');
      }

      return {
        id: seasonID,
        season: Number(seasonNumber),
      };
    });

  const foundSeason = seasons.find((season) => season.season === media.season.number);

  if (!foundSeason) {
    return null;
  }

  return foundSeason.id;
}

export async function getZoeChipEpisodeID(
  ctx: ScrapeContext,
  media: ShowMedia,
  seasonID: string,
): Promise<string | null> {
  const episodeNumberRegex = /Eps (\d*):/;
  const html = await ctx.proxiedFetcher<string>(`/ajax/season/episodes/${seasonID}`, {
    baseUrl: zoeBase,
  });

  const $ = load(html);

  const episodes = $('.eps-item')
    .toArray()
    .map((el) => {
      const element = $(el);
      const episodeID = element.attr('data-id');
      const title = element.attr('title');

      if (!episodeID || !title) {
        throw new Error('invalid episode');
      }

      const regexResult = title.match(episodeNumberRegex);
      if (!regexResult || Number.isNaN(Number(regexResult[1]))) {
        throw new Error('invalid episode');
      }

      return {
        id: episodeID,
        episode: Number(regexResult[1]),
      };
    });

  const foundEpisode = episodes.find((episode) => episode.episode === media.episode.number);

  if (!foundEpisode) {
    return null;
  }

  return foundEpisode.id;
}
