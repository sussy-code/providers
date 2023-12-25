import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { scrape, searchAndFindMedia } from './util';

async function universalScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const lookmovieData = await searchAndFindMedia(ctx, ctx.media);
  if (!lookmovieData) throw new NotFoundError('Media not found');

  ctx.progress(30);
  const videoUrl = await scrape(ctx, ctx.media, lookmovieData);
  if (!videoUrl) throw new NotFoundError('No video found');

  ctx.progress(60);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        playlist: videoUrl,
        type: 'hls',
        flags: [flags.IP_LOCKED],
        captions: [],
      },
    ],
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
