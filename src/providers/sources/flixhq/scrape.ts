import { load } from 'cheerio';

import { MovieMedia, ShowMedia } from '@/entrypoint/utils/media';
import { flixHqBase } from '@/providers/sources/flixhq/common';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

export async function getFlixhqSourceDetails(ctx: ScrapeContext, sourceId: string): Promise<string> {
  const jsonData = await ctx.proxiedFetcher<Record<string, any>>(`/ajax/sources/${sourceId}`, {
    baseUrl: flixHqBase,
  });

  return jsonData.link;
}

export async function getFlixhqMovieSources(ctx: ScrapeContext, media: MovieMedia, id: string) {
  const episodeParts = id.split('-');
  const episodeId = episodeParts[episodeParts.length - 1];

  const data = await ctx.proxiedFetcher<string>(`/ajax/movie/episodes/${episodeId}`, {
    baseUrl: flixHqBase,
  });

  const doc = load(data);
  const sourceLinks = doc('.nav-item > a')
    .toArray()
    .map((el) => {
      const query = doc(el);
      const embedTitle = query.attr('title');
      const linkId = query.attr('data-linkid');
      if (!embedTitle || !linkId) throw new Error('invalid sources');
      return {
        embed: embedTitle,
        episodeId: linkId,
      };
    });

  return sourceLinks;
}

export async function getFlixhqShowSources(ctx: ScrapeContext, media: ShowMedia, id: string) {
  const episodeParts = id.split('-');
  const episodeId = episodeParts[episodeParts.length - 1];

  const seasonsListData = await ctx.proxiedFetcher<string>(`/ajax/season/list/${episodeId}`, {
    baseUrl: flixHqBase,
  });

  const seasonsDoc = load(seasonsListData);
  const season = seasonsDoc('.dropdown-item')
    .toArray()
    .find((el) => seasonsDoc(el).text() === `Season ${media.season.number}`)?.attribs['data-id'];

  if (!season) throw new NotFoundError('season not found');

  const seasonData = await ctx.proxiedFetcher<string>(`/ajax/season/episodes/${season}`, {
    baseUrl: flixHqBase,
  });
  const seasonDoc = load(seasonData);
  const episode = seasonDoc('.nav-item > a')
    .toArray()
    .map((el) => {
      return {
        id: seasonDoc(el).attr('data-id'),
        title: seasonDoc(el).attr('title'),
      };
    })
    .find((e) => e.title?.startsWith(`Eps ${media.episode.number}`))?.id;

  if (!episode) throw new NotFoundError('episode not found');

  const data = await ctx.proxiedFetcher<string>(`/ajax/episode/servers/${episode}`, {
    baseUrl: flixHqBase,
  });

  const doc = load(data);

  const sourceLinks = doc('.nav-item > a')
    .toArray()
    .map((el) => {
      const query = doc(el);
      const embedTitle = query.attr('title');
      const linkId = query.attr('data-id');
      if (!embedTitle || !linkId) throw new Error('invalid sources');
      return {
        embed: embedTitle,
        episodeId: linkId,
      };
    });

  return sourceLinks;
}
