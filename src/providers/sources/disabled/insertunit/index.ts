import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const BASE_URL = 'https://isut.streamflix.one';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const embedPage = await ctx.fetcher(
    `${BASE_URL}/api/source/${ctx.media.type === 'movie' ? `${ctx.media.tmdbId}` : `${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`}`,
  );

  // Parse the response and extract the file URL from the first source
  const sources = embedPage.sources;
  if (!sources || sources.length === 0) throw new NotFoundError('No sources found');

  const file = sources[0].file;
  if (!file) throw new NotFoundError('No file URL found');

  ctx.progress(90);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        playlist: file,
        type: 'hls',
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const insertunitScraper = makeSourcerer({
  id: 'insertunit',
  name: 'Insertunit',
  rank: 12,
  disabled: true,
  flags: [flags.CORS_ALLOWED, flags.IP_LOCKED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
