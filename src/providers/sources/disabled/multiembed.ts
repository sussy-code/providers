/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

const baseUrl = 'https://multiembed.mov';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  ctx.progress(50);

  let url: string;

  if (ctx.media.type === 'show') {
    url = `${baseUrl}/?video_id=${ctx.media.imdbId}&s=${ctx.media.season.number}&e=${ctx.media.episode.number}`;
  } else {
    url = `${baseUrl}/?video_id=${ctx.media.imdbId}`;
  }

  return {
    embeds: [
      {
        embedId: 'streambucket',
        url,
      },
    ],
  };
}

export const multiembedScraper = makeSourcerer({
  id: 'multiembed',
  name: 'MultiEmbed 🔥',
  rank: 145,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
