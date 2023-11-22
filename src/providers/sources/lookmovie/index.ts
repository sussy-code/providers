import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

import { scrape, searchAndFindMedia } from './util';
import { MovieContext, ShowContext } from '../zoechip/common';

async function universalScraper(ctx: ShowContext | MovieContext): Promise<SourcererOutput> {
  const lookmovieData = await searchAndFindMedia(ctx.media);
  if (!lookmovieData) throw new NotFoundError('Media not found');

  ctx.progress(30);
  const videoUrl = await scrape(ctx.media, lookmovieData);
  if (!videoUrl) throw new NotFoundError('No video found');

  ctx.progress(60);

  return {
    embeds: [],
    stream: {
      playlist: videoUrl,
      type: 'hls',
      flags: [],
    },
  };
}

export const lookmovieScraper = makeSourcerer({
  id: 'lookmovie',
  name: 'LookMovie',
  rank: 1,
  flags: [],
  scrapeShow: universalScraper,
  scrapeMovie: universalScraper,
});
