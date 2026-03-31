import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { flags } from '@/entrypoint/utils/targets';
import { getTurnstileToken } from '@/utils/turnstile';

const baseUrl = 'mznxiwqjdiq00239q.space';
const SITEKEY = '0x4AAAAAACuH31Fvud7uaIMf';

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";

async function comboScraper(
  ctx: ShowScrapeContext | MovieScrapeContext
): Promise<SourcererOutput> {

  const name = encodeURIComponent(ctx.media.title);
  const year = ctx.media.releaseYear;
  const tmdbId = ctx.media.tmdbId;
  const imdbId = ctx.media.imdbId || '';

  const season = (ctx as ShowScrapeContext).media.season?.number || 1;
  const episode = (ctx as ShowScrapeContext).media.episode?.number || 1;

  const endpoints = [
    "primebox",
    "fed",
    "vento",
    "bomber",
    "blackout"
  ];

  console.log(`[XPRIME] Starting scrape for "${ctx.media.title}" (${year})`);

  for (const ep of endpoints) {
    try {
      console.log(`[XPRIME] Generating Turnstile token for endpoint "${ep}"...`);
      let turnstileToken: string;
      try {
        turnstileToken = await getTurnstileToken(SITEKEY);
        console.log(`[XPRIME] Token generated successfully.`);
      } catch (err) {
        console.warn(`[XPRIME] Turnstile token generation failed for "${ep}", skipping endpoint.`);
        continue;
      }

      await new Promise(r => setTimeout(r, 350));

      let url =
        `https://${baseUrl}/${ep}?name=${name}` +
        `&id=${tmdbId}&imdb=${imdbId}` +
        `&season=${season}&episode=${episode}&year=${year}`;

      if (ep === "primebox") {
        url =
          `https://${baseUrl}/${ep}?name=${name}` +
          `&fallback_year=${year}` +
          `&season=${season}&episode=${episode}`;
      }

      console.log(`[XPRIME] Fetching from endpoint "${ep}" -> ${url}`);
      const res = await ctx.proxiedFetcher(url, {
        headers: {
          'User-Agent': UA,
          'Referer': 'https://xprime.today/',
          'Origin': 'https://xprime.today',
          'Accept': 'application/json',
          'cf-turnstile-response': turnstileToken,
        },
      });

      let streamUrl = '';
      if (res?.servers?.length) {
        streamUrl = res.servers[0].url;
        console.log(`[XPRIME] Found server stream URL: ${streamUrl}`);
      } else if (res?.url) {
        streamUrl = res.url;
        console.log(`[XPRIME] Found direct stream URL: ${streamUrl}`);
      } else {
        console.log(`[XPRIME] No stream URL found at this endpoint, continuing...`);
        continue;
      }

      // HLS stream
      if (streamUrl.includes('.m3u8')) {
        console.log(`[XPRIME] Returning HLS stream.`);
        return {
          embeds: [],
          stream: [
            {
              id: 'primary',
              type: 'hls',
              playlist: streamUrl,
              headers: {
                'User-Agent': UA,
                Referer: `https://${baseUrl}/`,
                Origin: `https://${baseUrl}`,
              },
              flags: [flags.CORS_ALLOWED],
              captions: [],
            },
          ],
        };
      }

      // MP4 fallback
      if (streamUrl.includes('.mp4')) {
        console.log(`[XPRIME] Returning MP4 stream.`);
        return {
          embeds: [],
          stream: [
            {
              id: 'primary',
              type: 'file',
              qualities: {
                1080: {
                  type: 'mp4',
                  url: streamUrl,
                },
              },
              flags: [flags.CORS_ALLOWED],
              captions: [],
            },
          ],
        };
      }

    } catch (err) {
      console.warn(`[XPRIME] Error scraping endpoint "${ep}":`, err);
      continue;
    }
  }

  console.error(`[XPRIME] No valid streams found for "${ctx.media.title}"`);
  throw new NotFoundError('No valid Xprime streams found');
}

export const xprimeScraper = makeSourcerer({
  id: 'xprime',
  name: 'Xprime',
  rank: 92,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});