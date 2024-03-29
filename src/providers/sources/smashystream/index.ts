import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { smashyStreamDScraper } from '@/providers/embeds/smashystream/dued';
import { smashyStreamFScraper } from '@/providers/embeds/smashystream/video1';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

const smashyStreamBase = 'https://embed.smashystream.com';
const referer = 'https://smashystream.com/';

const universalScraper = async (ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> => {
  const mainPage = await ctx.proxiedFetcher<string>('/playere.php', {
    query: {
      tmdb: ctx.media.tmdbId,
      ...(ctx.media.type === 'show' && {
        season: ctx.media.season.number.toString(),
        episode: ctx.media.episode.number.toString(),
      }),
    },
    headers: {
      Referer: referer,
    },
    baseUrl: smashyStreamBase,
  });

  ctx.progress(30);

  const mainPage$ = load(mainPage);
  const sourceUrls = mainPage$('.dropdown-menu a[data-url]')
    .map((_, el) => mainPage$(el).attr('data-url'))
    .get();

  const embeds: SourcererEmbed[] = [];
  for (const sourceUrl of sourceUrls) {
    if (sourceUrl.includes('video1d.php')) {
      embeds.push({
        embedId: smashyStreamFScraper.id,
        url: sourceUrl,
      });
    }
    if (sourceUrl.includes('dued.php')) {
      embeds.push({
        embedId: smashyStreamDScraper.id,
        url: sourceUrl,
      });
    }
  }

  ctx.progress(60);

  return {
    embeds,
  };
};

export const smashyStreamScraper = makeSourcerer({
  id: 'smashystream',
  name: 'SmashyStream',
  rank: 30,
  flags: [flags.CORS_ALLOWED],
  disabled: true,
  scrapeMovie: universalScraper,
  scrapeShow: universalScraper,
});
