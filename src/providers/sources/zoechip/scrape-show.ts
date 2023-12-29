import { createZoeChipStreamData } from '@/providers/sources/zoechip/common';
import { getZoeChipEpisodeID, getZoeChipSeasonID } from '@/providers/sources/zoechip/scrape';
import { getZoeChipShowID } from '@/providers/sources/zoechip/search';
import { ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

export async function scrapeShow(ctx: ShowScrapeContext) {
  const showID = await getZoeChipShowID(ctx, ctx.media);
  if (!showID) {
    throw new NotFoundError('no search results match');
  }

  const seasonID = await getZoeChipSeasonID(ctx, ctx.media, showID);
  if (!seasonID) {
    throw new NotFoundError('no season found');
  }

  const episodeID = await getZoeChipEpisodeID(ctx, ctx.media, seasonID);
  if (!episodeID) {
    throw new NotFoundError('no episode found');
  }

  return createZoeChipStreamData(ctx, episodeID);
}
