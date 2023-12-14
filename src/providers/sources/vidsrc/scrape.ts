import { load } from 'cheerio';

import { MovieMedia, ShowMedia } from '@/main/media';
import { decryptSourceUrl, vidsrcBase } from '@/providers/sources/vidsrc/common';
import { ScrapeContext } from '@/utils/context';

interface SourcesResponse {
  result: [
    {
      id: string;
      title: string;
    },
  ];
}

interface FetchResponse {
  status: number;
  result: {
    url: string;
  };
}

export async function getVidsrcSourceDetails(ctx: ScrapeContext, sourcedId: string) {
  const data = await ctx.proxiedFetcher<FetchResponse>(`/ajax/embed/source/${sourcedId}`, {
    baseUrl: vidsrcBase,
  });

  const encryptedSourceUrl = data.result.url;
  return decodeURIComponent(decryptSourceUrl(encryptedSourceUrl));
}

export async function getVidsrcMovieSourcesId(ctx: ScrapeContext, media: MovieMedia) {
  const data = await ctx.proxiedFetcher<string>(`/embed/movie/${media.tmdbId}`, {
    baseUrl: vidsrcBase,
  });

  const doc = load(data);
  const sourcesCode = doc('a[data-id]').attr('data-id');

  return sourcesCode;
}

export async function getVidsrcShowSourcesId(ctx: ScrapeContext, media: ShowMedia) {
  const data = await ctx.proxiedFetcher<string>(
    `/embed/tv/${media.tmdbId}/${media.season.number}/${media.episode.number}`,
    {
      baseUrl: vidsrcBase,
    },
  );

  const doc = load(data);
  const sourcesCode = doc('a[data-id]').attr('data-id');

  return sourcesCode;
}

export async function getVidsrcSources(ctx: ScrapeContext, sourcedId: string | undefined) {
  const data = await ctx.proxiedFetcher<SourcesResponse>(`/ajax/embed/episode/${sourcedId}/sources`, {
    baseUrl: vidsrcBase,
  });

  return data;
}
