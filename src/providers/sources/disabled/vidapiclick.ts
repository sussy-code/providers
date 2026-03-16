/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://vidapi.click';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const apiUrl =
    ctx.media.type === 'show'
      ? `${baseUrl}/api/video/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`
      : `${baseUrl}/api/video/movie/${ctx.media.tmdbId}`;

  const apiRes = await ctx.proxiedFetcher(apiUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!apiRes) throw new NotFoundError('Failed to fetch video source');
  if (!apiRes.sources[0].file) throw new NotFoundError('No video source found');
  ctx.progress(50);

  ctx.progress(90);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: apiRes.sources[0].file,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const vidapiClickScraper = makeSourcerer({
  id: 'vidapi-click',
  name: 'vidapi.click',
  rank: 89,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
