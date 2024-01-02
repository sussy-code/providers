import { MovieMedia, ShowMedia } from '@/entrypoint/utils/media';
import { compareMedia } from '@/utils/compare';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { Result, ResultItem, ShowDataResult, episodeObj } from './type';
import { getVideo } from './video';

export const baseUrl = 'https://lmscript.xyz';

export async function searchAndFindMedia(
  ctx: ScrapeContext,
  media: MovieMedia | ShowMedia,
): Promise<ResultItem | undefined> {
  if (media.type === 'show') {
    const searchRes = await ctx.fetcher<Result>(`/v1/shows`, {
      baseUrl,
      query: { 'filters[q]': media.title },
    });

    const results = searchRes.items;

    const result = results.find((res: ResultItem) => compareMedia(media, res.title, Number(res.year)));
    return result;
  }
  if (media.type === 'movie') {
    const searchRes = await ctx.fetcher<Result>(`/v1/movies`, {
      baseUrl,
      query: { 'filters[q]': media.title },
    });

    const results = searchRes.items;
    const result = results.find((res: ResultItem) => compareMedia(media, res.title, Number(res.year)));
    return result;
  }
}

export async function scrape(ctx: ScrapeContext, media: MovieMedia | ShowMedia, result: ResultItem) {
  // Find the relevant id
  let id = null;
  if (media.type === 'movie') {
    id = result.id_movie;
  } else if (media.type === 'show') {
    const data = await ctx.fetcher<ShowDataResult>(`/v1/shows`, {
      baseUrl,
      query: { expand: 'episodes', id: result.id_show },
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
