import { MovieContext } from '@/providers/sources/vidsrc/common';
import { getVidSrcMovieSources } from '@/providers/sources/vidsrc/scrape';

export async function scrapeMovie(ctx: MovieContext) {
  return {
    embeds: await getVidSrcMovieSources(ctx),
  };
}
