import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { scrape, searchAndFindMedia } from './util';

async function universalScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const lookmovieData = await searchAndFindMedia(ctx, ctx.media);
  if (!lookmovieData) throw new NotFoundError('Media not found');

  ctx.progress(30);
  const video = await scrape(ctx, ctx.media, lookmovieData);
  if (!video.playlist) throw new NotFoundError('No video found');

  ctx.progress(60);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        playlist: video.playlist,
        type: 'hls',
        flags: [flags.IP_LOCKED],
        captions: video.captions,
      },
    ],
  };
}

export const lookmovieScraper = makeSourcerer({
  id: 'lookmovie',
  name: 'LookMovie',
  disabled: true,
  rank: 50,
  flags: [flags.IP_LOCKED],
  scrapeShow: universalScraper,
  scrapeMovie: universalScraper,
});
