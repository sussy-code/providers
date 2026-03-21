import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { SourcererOutput, makeSourcerer } from '@/providers/base';

const baseUrl = 'mznxiwqjdiq00239q.space';
const UA = "Windows NT 10.0 Very nice person";

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const name = encodeURIComponent(ctx.media.title);
  const year = ctx.media.releaseYear;
  const tmdbId = ctx.media.tmdbId;
  const imdbId = ctx.media.imdbId || '';
  
  const season = (ctx as ShowScrapeContext).media.season?.number || 1;
  const episode = (ctx as ShowScrapeContext).media.episode?.number || 1;

  const turnstileToken = localStorage.getItem('turnstile_token');

  const endpoints = [
    "fed",
    "bomber",
    "primebox",
    "vento",
    "blackout"
  ];

  const commonHeaders = {
    'User-Agent': UA,
    'Referer': 'https://xprime.today/',
    'Origin': 'https://xprime.today',
    'Accept': 'application/json',
    'cf-turnstile-response': turnstileToken || '', 
  };

  for (const ep of endpoints) {
    try {
      let url = `https://${baseUrl}/${ep}?name=${name}&id=${tmdbId}&imdb=${imdbId}&season=${season}&episode=${episode}`;
      
      if (ep === "primebox") {
        url = `https://${baseUrl}/${ep}?name=${name}&fallback_year=${year}&season=${season}&episode=${episode}`;
      } else {
        url += `&year=${year}`;
      }

      const res = await ctx.proxiedFetcher(url, { 
        method: 'GET',
        headers: commonHeaders 
      });

      let streamUrl = '';

      if (res?.servers && Array.isArray(res.servers) && res.servers.length > 0) {
        streamUrl = res.servers[0].url;
      } else if (res?.url) {
        streamUrl = res.url;
      }

      if (streamUrl && streamUrl.includes('.m3u8')) {
        ctx.progress(100);
        
        return {
          embeds: [],
          stream: [
            {
              id: 'primary',
              type: 'hls',
              playlist: streamUrl,
              headers: {
                ...commonHeaders,
                'Referer': `https://${baseUrl}/`,
              },
              flags: [],
              captions: [],
            },
          ],
        };
      }
    } catch (e) {
      continue;
    }
  }

  throw new NotFoundError('No valid Xprime streams found across all endpoints');
}

export const xprimeScraper = makeSourcerer({
  id: 'xprime',
  name: 'Xprime',
  rank: 98,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});