import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

const baseUrl = 'https://www.vidking.net';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const url =
    ctx.media.type === 'movie'
      ? `${baseUrl}/embed/movie/${ctx.media.tmdbId}`
      : `${baseUrl}/embed/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;

  return {
    embeds: [
      {
        embedId: 'vidking',
        url,
      },
    ],
  };
}

export const vidkingScraper = makeSourcerer({
  id: 'Vidking',
  name: 'VidKing',
  rank: 95,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
