import { flags } from '@/main/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { febboxHlsScraper } from '@/providers/embeds/febbox/hls';
import { febboxMp4Scraper } from '@/providers/embeds/febbox/mp4';
import { showboxBase } from '@/providers/sources/showbox/common';
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
  ctx.progress(33);

  const showboxEntry = searchRes.find(
    (res: any) => compareTitle(res.title, ctx.media.title) && res.year === Number(ctx.media.releaseYear),
  );

  if (!showboxEntry) throw new NotFoundError('No entry found');
  const id = showboxEntry.id;

  const sharelinkResult = await ctx.proxiedFetcher<{
    data?: { link?: string };
  }>('/index/share_link', {
    baseUrl: showboxBase,
    query: {
      id,
      type: ctx.media.type === 'movie' ? '1' : '2',
    },
  });
  if (!sharelinkResult?.data?.link) throw new NotFoundError('No embed url found');
  ctx.progress(80);

  const season = ctx.media.type === 'show' ? ctx.media.season.number : '';
  const episode = ctx.media.type === 'show' ? ctx.media.episode.number : '';

  const embeds = [
    {
      embedId: febboxMp4Scraper.id,
      url: `/${ctx.media.type}/${id}/${season}/${episode}`,
    },
  ];

  if (sharelinkResult?.data?.link) {
    embeds.push({
      embedId: febboxHlsScraper.id,
      url: sharelinkResult.data.link,
    });
  }

  return {
    embeds,
  };
}

export const showboxScraper = makeSourcerer({
  id: 'showbox',
  name: 'Showbox',
  rank: 300,
  flags: [flags.NO_CORS],
  scrapeShow: comboScraper,
  scrapeMovie: comboScraper,
});
