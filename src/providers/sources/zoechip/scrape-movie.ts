import { MovieContext, createZoeChipStreamData } from '@/providers/sources/zoechip/common';
import { getZoeChipMovieID } from '@/providers/sources/zoechip/search';
import { NotFoundError } from '@/utils/errors';

export async function scrapeMovie(ctx: MovieContext) {
  const movieID = await getZoeChipMovieID(ctx, ctx.media);
  if (!movieID) {
    throw new NotFoundError('no search results match');
  }

  return createZoeChipStreamData(ctx, movieID);
}
