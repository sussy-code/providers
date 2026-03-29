import { load } from 'cheerio';

import { SourcererEmbed, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { IframeSourceResult, SearchResult } from './types';

const ridoMoviesBase = `https://ridomovies.tv`;
const ridoMoviesApiBase = `${ridoMoviesBase}/core/api`;

const normalizeTitle = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
};

const universalScraper = async (ctx: MovieScrapeContext | ShowScrapeContext) => {
  const searchResult = await ctx.proxiedFetcher<SearchResult>('/search', {
    baseUrl: ridoMoviesApiBase,
    query: {
      q: ctx.media.title,
    },
  });

  if (!searchResult.data?.items || searchResult.data.items.length === 0) {
    throw new NotFoundError('No search results found');
  }

  const mediaData = searchResult.data.items.map((movieEl) => {
    const name = movieEl.title;
    const year = movieEl.contentable.releaseYear;
    const fullSlug = movieEl.fullSlug;
    return { name, year, fullSlug };
  });

  const normalizedSearchTitle = normalizeTitle(ctx.media.title);
  const searchYear = ctx.media.releaseYear.toString();

  let targetMedia = mediaData.find((m) => normalizeTitle(m.name) === normalizedSearchTitle && m.year === searchYear);

  if (!targetMedia) {
    targetMedia = mediaData.find((m) => {
      const normalizedName = normalizeTitle(m.name);
      return (
        m.year === searchYear &&
        (normalizedName.includes(normalizedSearchTitle) || normalizedSearchTitle.includes(normalizedName))
      );
    });
  }

  if (!targetMedia?.fullSlug) {
    throw new NotFoundError('No matching media found');
  }

  ctx.progress(40);

  let iframeSourceUrl = `/${targetMedia.fullSlug}/videos`;

  if (ctx.media.type === 'show') {
    const showPageResult = await ctx.proxiedFetcher<string>(`/${targetMedia.fullSlug}`, {
      baseUrl: ridoMoviesBase,
    });

    const fullEpisodeSlug = `season-${ctx.media.season.number}/episode-${ctx.media.episode.number}`;
    const regexPattern = new RegExp(
      `\\\\"id\\\\":\\\\"(\\d+)\\\\"(?=.*?\\\\"fullSlug\\\\":\\\\"[^"]*${fullEpisodeSlug}[^"]*\\\\")`,
      'g',
    );

    const matches = [...showPageResult.matchAll(regexPattern)];
    const episodeIds = matches.map((match) => match[1]);

    if (episodeIds.length === 0) {
      throw new NotFoundError('Episode not found');
    }

    const episodeId = episodeIds[episodeIds.length - 1];
    iframeSourceUrl = `/episodes/${episodeId}/videos`;
  }

  const iframeSource = await ctx.proxiedFetcher<IframeSourceResult>(iframeSourceUrl, {
    baseUrl: ridoMoviesApiBase,
  });
  if (!iframeSource.data || iframeSource.data.length === 0) {
    throw new NotFoundError('No video sources found');
  }

  const iframeSource$ = load(iframeSource.data[0].url);
  const iframeUrl = iframeSource$('iframe').attr('data-src');

  if (!iframeUrl) {
    throw new NotFoundError('No iframe URL found');
  }

  ctx.progress(60);

  const embeds: SourcererEmbed[] = [];

  let embedId = 'closeload';

  if (iframeUrl.includes('ridoo')) {
    embedId = 'ridoo';
  }

  embeds.push({
    embedId,
    url: iframeUrl,
  });

  ctx.progress(80);

  if (embeds.length === 0) {
    throw new NotFoundError('No supported embeds found');
  }

  ctx.progress(90);

  return {
    embeds,
  };
};

export const ridooMoviesScraper = makeSourcerer({
  id: 'ridomovies',
  name: 'RidoMovies',
  rank: 96,
  flags: [],
  disabled: false,
  scrapeMovie: universalScraper,
  scrapeShow: universalScraper,
});
