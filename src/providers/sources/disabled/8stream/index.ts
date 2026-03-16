import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { getMovie, getTV } from './8Stream';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const query = {
    title: ctx.media.title,
    releaseYear: ctx.media.releaseYear,
    tmdbId: ctx.media.tmdbId,
    imdbId: ctx.media.imdbId,
    type: ctx.media.type,
    season: '',
    episode: '',
  };

  if (ctx.media.type === 'show') {
    query.season = ctx.media.season.number.toString();
    query.episode = ctx.media.episode.number.toString();
  }

  if (ctx.media.type === 'movie') {
    ctx.progress(40);
    const res = await getMovie(ctx, ctx.media.imdbId as string);
    if (res?.success) {
      ctx.progress(90);
      return {
        embeds: [],
        stream: [
          {
            id: 'primary',
            captions: [],
            playlist: res.data.link,
            type: 'hls',
            flags: [flags.CORS_ALLOWED],
          },
        ],
      };
    }
    throw new NotFoundError('No providers available');
  }

  if (ctx.media.type === 'show') {
    ctx.progress(40);
    const lang = 'English';
    const res = await getTV(ctx, ctx.media.imdbId as string, ctx.media.season.number, ctx.media.episode.number, lang);
    if (res?.success) {
      ctx.progress(90);
      return {
        embeds: [],
        stream: [
          {
            id: 'primary',
            captions: [],
            playlist: res.data.link,
            type: 'hls',
            flags: [flags.CORS_ALLOWED],
          },
        ],
      };
    }
    throw new NotFoundError('No providers available');
  }
  throw new NotFoundError('No providers available');
}

export const EightStreamScraper = makeSourcerer({
  id: '8stream',
  name: '8stream',
  rank: 21,
  flags: [],
  disabled: true,
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
