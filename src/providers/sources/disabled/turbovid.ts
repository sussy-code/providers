import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

const baseUrl = 'https://turbovid.eu';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const embedUrl =
    ctx.media.type === 'movie'
      ? `${baseUrl}/api/req/movie/${ctx.media.tmdbId}`
      : `${baseUrl}/api/req/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  return {
    embeds: [
      {
        embedId: 'turbovid',
        url: embedUrl,
      },
    ],
  };
}

export const turbovidSourceScraper = makeSourcerer({
  id: 'turbovidSource',
  name: 'TurboVid',
  rank: 120,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
