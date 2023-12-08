import { MovieMedia, ShowMedia } from '@/main/media';
import { compareMedia } from '@/utils/compare';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { Result } from './type';
import { getVideoUrl } from './video';

export async function searchAndFindMedia(
  ctx: ScrapeContext,
  media: MovieMedia | ShowMedia,
): Promise<Result | undefined> {
  if (media.type === 'show') {
    const searchRes = await ctx.fetcher<any>(`/v1/shows?filters[q]=${media.title}`, {
      baseUrl: 'https://lmscript.xyz',
    });

    const results = searchRes.items;

    const result = results.find((res: Result) => compareMedia(media, res.title, Number(res.year)));
    return result;
  }
  if (media.type === 'movie') {
    const searchRes = await ctx.fetcher<any>(`/v1/movies?filters[q]=${media.title}`, {
      baseUrl: 'https://lmscript.xyz',
    });

    const results = searchRes.items;
    const result = results.find((res: Result) => compareMedia(media, res.title, Number(res.year)));
    return result;
  }
}

export async function scrape(ctx: ScrapeContext, media: MovieMedia | ShowMedia, result: Result) {
  // Find the relevant id
  let id = null;
  if (media.type === 'movie') {
    id = result.id_movie;
  } else if (media.type === 'show') {
    const data: any = await ctx
      .fetcher<any>(`https://lmscript.xyz/v1/shows?expand=episodes&id=${result.id_show}`)
      .then((d) => d);

    const episodeObj = data.episodes?.find((v: any) => {
      return Number(v.season) === Number(media.season.number) && Number(v.episode) === Number(media.episode.number);
    });

    if (episodeObj) id = episodeObj.id;
  }

  // Check ID
  if (id === null) throw new NotFoundError('Not found');

  const videoUrl = await getVideoUrl(ctx, id, media);
  return videoUrl;
}
