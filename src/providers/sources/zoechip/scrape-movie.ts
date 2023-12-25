import { createZoeChipStreamData } from '@/providers/sources/zoechip/common';
import { getZoeChipMovieID } from '@/providers/sources/zoechip/search';
import { MovieScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

export async function scrapeMovie(ctx: MovieScrapeContext) {
  const movieID = await getZoeChipMovieID(ctx, ctx.media);
  if (!movieID) {
    throw new NotFoundError('no search results match');
  }

  return createZoeChipStreamData(ctx, movieID);
}
