import { flags } from '@/main/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

import { scrape, searchAndFindMedia } from './util';
import { MovieContext, ShowContext } from '../zoechip/common';

async function universalScraper(ctx: ShowContext | MovieContext): Promise<SourcererOutput> {
  const lookmovieData = await searchAndFindMedia(ctx, ctx.media);
  if (!lookmovieData) throw new NotFoundError('Media not found');

  ctx.progress(30);
  const videoUrl = await scrape(ctx, ctx.media, lookmovieData);
  if (!videoUrl) throw new NotFoundError('No video found');

  ctx.progress(60);

  return {
    embeds: [],
    stream: {
      playlist: videoUrl,
      type: 'hls',
      flags: [flags.IP_LOCKED],
      captions: [],
    },
  };
}

export const lookmovieScraper = makeSourcerer({
  id: 'lookmovie',
  name: 'LookMovie',
  rank: 1,
  flags: [flags.IP_LOCKED],
  scrapeShow: universalScraper,
  scrapeMovie: universalScraper,
});
