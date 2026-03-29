import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { flags } from '@/entrypoint/utils/targets';
import { getTurnstileToken } from '@/utils/turnstile';

const baseUrl = 'mznxiwqjdiq00239q.space';
const UA = 'Windows NT 10.0 Very nice person';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  let turnstileToken: string;
  try {
    turnstileToken = await getTurnstileToken('0x4AAAAAACuH31Fvud7uaIMf');
  } catch {
    throw new NotFoundError('Turnstile verification failed');
  }

  const name = encodeURIComponent(ctx.media.title);
  const year = ctx.media.releaseYear;
  const tmdbId = ctx.media.tmdbId;
  const imdbId = ctx.media.imdbId || '';

  const season = (ctx as ShowScrapeContext).media.season?.number || 1;
  const episode = (ctx as ShowScrapeContext).media.episode?.number || 1;

  const endpoints = ['primebox', 'fed', 'vento', 'bomber', 'blackout'];

  const commonHeaders = {
    'User-Agent': UA,
    Referer: 'https://xprime.today/',
    Origin: 'https://xprime.today',
    Accept: 'application/json',
    'cf-turnstile-response': turnstileToken,
  };

  for (const ep of endpoints) {
    try {
      let url =
        `https://${baseUrl}/${ep}?name=${name}&id=${tmdbId}&imdb=${imdbId}` +
        `&season=${season}&episode=${episode}&year=${year}`;

      if (ep === 'primebox') {
        url = `https://${baseUrl}/${ep}?name=${name}` + `&fallback_year=${year}&season=${season}&episode=${episode}`;
      }

      const res = await ctx.proxiedFetcher(url, {
        headers: commonHeaders,
      });

      let streamUrl = '';

      if (res?.servers?.length) streamUrl = res.servers[0].url;
      else if (res?.url) streamUrl = res.url;

      if (streamUrl?.includes('.m3u8')) {
        return {
          embeds: [],
          stream: [
            {
              id: 'primary',
              type: 'hls',
              playlist: streamUrl,
              headers: {
                ...commonHeaders,
                Referer: `https://${baseUrl}/`,
              },
              flags: [flags.CORS_ALLOWED],
              captions: [],
            },
          ],
        };
      }
    } catch {}
  }

  throw new NotFoundError('No valid streams found');
}

export const xprimeScraper = makeSourcerer({
  id: 'xprime',
  name: 'Xprime',
  rank: 92,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
