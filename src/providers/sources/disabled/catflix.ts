import { load } from 'cheerio';

import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://catflix.su';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const mediaTitle = ctx.media.title.replace(/ /g, '-').replace(/[():]/g, '').toLowerCase();
  const mediaType = ctx.media.type;
  const movieId = ctx.media.tmdbId;

  const watchPageUrl =
    mediaType === 'movie'
      ? `${baseUrl}/movie/${mediaTitle}-${movieId}`
      : `${baseUrl}/episode/${mediaTitle}-season-${ctx.media.season.number}-episode-${ctx.media.episode.number}/eid-${ctx.media.episode.tmdbId}`;

  ctx.progress(60);

  const watchPage = await ctx.proxiedFetcher(watchPageUrl);
  const $ = load(watchPage);

  const scriptContent = $('script')
    .toArray()
    .find((script) => {
      const child = script.children[0];
      return (
        child && 'type' in child && child.type === 'text' && 'data' in child && child.data.includes('main_origin =')
      );
    });

  if (!scriptContent) throw new NotFoundError('No embed data found');

  const scriptData = scriptContent.children[0] as { data: string };
  const mainOriginMatch = scriptData.data.match(/main_origin = "(.*?)";/);
  if (!mainOriginMatch) throw new NotFoundError('Failed to extract embed URL');

  const decodedUrl = atob(mainOriginMatch[1]);

  ctx.progress(90);

  return {
    embeds: [
      {
        embedId: 'turbovid',
        url: decodedUrl,
      },
    ],
  };
}

export const catflixScraper = makeSourcerer({
  id: 'catflix',
  name: 'Catflix',
  rank: 160,
  disabled: true,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
