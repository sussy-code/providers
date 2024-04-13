import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { febboxMp4Scraper } from '@/providers/embeds/febbox/mp4';
import { compareTitle } from '@/utils/compare';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { sendRequest } from './sendRequest';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const searchQuery = {
    module: 'Search4',
    page: '1',
    type: 'all',
    keyword: ctx.media.title,
    pagelimit: '20',
  };

  const searchRes = (await sendRequest(ctx, searchQuery, true)).data.list;
  ctx.progress(50);

  const showboxEntry = searchRes.find(
    (res: any) => compareTitle(res.title, ctx.media.title) && res.year === Number(ctx.media.releaseYear),
  );
  if (!showboxEntry) throw new NotFoundError('No entry found');

  const id = showboxEntry.id;
  const season = ctx.media.type === 'show' ? ctx.media.season.number : '';
  const episode = ctx.media.type === 'show' ? ctx.media.episode.number : '';

  return {
    embeds: [
      {
        embedId: febboxMp4Scraper.id,
        url: `/${ctx.media.type}/${id}/${season}/${episode}`,
      },
    ],
  };
}

export const showboxScraper = makeSourcerer({
  id: 'showbox',
  name: 'Showbox',
  rank: 150,
  disabled: true,
  flags: [flags.CORS_ALLOWED, flags.CF_BLOCKED],
  scrapeShow: comboScraper,
  scrapeMovie: comboScraper,
});
