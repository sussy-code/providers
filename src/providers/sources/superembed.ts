import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  if (!ctx.media.tmdbId) {
    throw new NotFoundError('TMDB ID is missing');
  }

  if (ctx.media.type === 'show' && (!ctx.media.season.number || !ctx.media.episode.number)) {
    throw new NotFoundError('Season or episode information is missing for the show');
  }

  let url = 'https://multiembed.mov/?video_id=';

  if (ctx.media.type === 'show') {
    url += `${ctx.media.tmdbId}&tmdb=1&s=${ctx.media.season.number}&e=${ctx.media.episode.number}`;
  } else {
    url += `${ctx.media.tmdbId}&tmdb=1`;
  }

  const embeds: SourcererEmbed[] = [
    {
      embedId: `superembed-${ctx.media.type}-${ctx.media.tmdbId}`,
      url,
    },
  ];

  return {
    embeds,
  };
}

export const superembedScraper = makeSourcerer({
  id: 'superembed',
  name: 'SuperEmbed',
  rank: 10,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
