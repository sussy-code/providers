import { MovieMedia, ShowMedia } from '@/entrypoint/utils/media';
import { compareMedia } from '@/utils/compare';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { Result, ResultItem, ShowDataResult, episodeObj } from './type';
import { getVideo } from './video';

export const baseUrl = 'https://lmscript.xyz';
export const baseUrl2 = 'https://www.lookmovie2.to';

export async function searchAndFindMedia(
  ctx: ScrapeContext,
  media: MovieMedia | ShowMedia,
): Promise<ResultItem | undefined> {
  if (media.type === 'show') {
    const searchRes = await ctx.fetcher<Result>(`/api/v1/shows/do-search/`, {
      baseUrl: baseUrl2,
      query: { q: media.title },
    });

    const results = searchRes.result;

    const result = results.find((res: ResultItem) => compareMedia(media, res.title, Number(res.year)));
    return result;
  }
  if (media.type === 'movie') {
    const searchRes = await ctx.fetcher<Result>(`/api/v1/movies/do-search/`, {
      baseUrl: baseUrl2,
      query: { q: media.title },
    });

    const results = searchRes.result;
    const result = results.find((res: ResultItem) => compareMedia(media, res.title, Number(res.year)));
    return result;
  }
}

export async function scrape(ctx: ScrapeContext, media: MovieMedia | ShowMedia, result: ResultItem) {
  // Find the relevant id
  let id = null;
  if (media.type === 'movie') {
    const movieRes = await ctx.fetcher<string>(`movies/view/${result.slug}`, {
      baseUrl: baseUrl2,
    });
    var movieStorageObject = JSON.parse(movieRes.match(/var movie_storage = (.*?);/s)?.[1] ?? '{}');

    id = movieStorageObject.id_movie;
  } else if (media.type === 'show') {
    const showRes = await ctx.fetcher<string>(`shows/view/${result.slug}`, {
      baseUrl: baseUrl2,
    });

    var idShow = showRes.match(/id_show:\s*(\d+)/)?.[1];

    if (!idShow) throw new NotFoundError('Not found');

    const data = await ctx.fetcher<ShowDataResult>(`/v1/shows`, {
      baseUrl,
      query: { expand: 'episodes', id: idShow },
    });

    const episode = data.episodes?.find((v: episodeObj) => {
      return Number(v.season) === Number(media.season.number) && Number(v.episode) === Number(media.episode.number);
    });

    if (episode) id = episode.id;
  }

  // Check ID
  if (id === null) throw new NotFoundError('Not found');

  const video = await getVideo(ctx, id, media);
  return video;
}
