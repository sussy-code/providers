import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';
import { Caption, labelToLanguageCode } from '../../captions';

const BASE_URL = 'https://fedapi.asteral-ss2.workers.dev';

const getUserToken = () => {
  try {
    if (typeof window === 'undefined') return null;
    const data = window.localStorage.getItem('__MW::preferences');
    if (!data) return null;

    return JSON.parse(data)?.state?.febboxKey || null;
  } catch {
    return null;
  }
};

const getRegion = () => {
  try {
    if (typeof window === 'undefined') return null;
    const data = window.localStorage.getItem('__MW::region');
    if (!data) return null;

    return JSON.parse(data)?.state?.region || null;
  } catch {
    return null;
  }
};

function encodeUrl(url) {
  return btoa(url)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function proxyEncode(url) {
  return `${BASE_URL}/proxy?decodeurl=${encodeUrl(url)}`;
}

function selectSubdomainByRegion(input) {
  const region = (input || '').toLowerCase();

  const match = region.match(/(usa5|usa6|usa7|uk1|de2|hk1|ca1|au1|sg1|in1)/);
  if (match) return match[1];

  if (region.includes('dallas')) return 'usa5';
  if (region.includes('portland')) return 'usa6';
  if (region.includes('new-york')) return 'usa7';

  if (region.includes('paris')) {
    return Math.random() < 0.5 ? 'uk1' : 'de2';
  }

  return null;
}

function rewriteSheguSubdomain(url, sub) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.endsWith('.shegu.net')) {
      parsed.hostname = `${sub}.shegu.net`;
      return parsed.toString();
    }

    return url;
  } catch {
    return url;
  }
}

async function FedScraper(ctx) {
  const tmdbId = ctx.media.tmdbId;
  if (!tmdbId) throw new NotFoundError('Missing TMDB ID');

  const region = getRegion();
  ctx.progress(20);

  const url =
    ctx.media.type === 'movie'
      ? `${BASE_URL}/movie/${tmdbId}`
      : `${BASE_URL}/tv/${tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;

  const data = await ctx.fetcher(url);

  if (!data?.success || !data?.stream) {
    throw new NotFoundError('No stream found');
  }

  ctx.progress(60);

  let streamUrl = data.stream;

  const sub = selectSubdomainByRegion(region);
  if (sub) {
    streamUrl = rewriteSheguSubdomain(streamUrl, sub);
  }

  const finalStream = proxyEncode(streamUrl);

  ctx.progress(80);

  const captions = [];

  if (data.subtitles) {
    Object.entries(data.subtitles).forEach(([langKey, sub]) => {
      const lang = langKey.split('_')[0];
      const code = labelToLanguageCode(lang)?.toLowerCase() || 'unknown';

      if (sub.url) {
        captions.push({
          type: sub.url.endsWith('.vtt') ? 'vtt' : 'srt',
          id: sub.url,
          url: sub.url,
          language: code,
          hasCorsRestrictions: false,
        });
      }
    });
  }

  ctx.progress(100);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'file',
        flags: [],
        captions,
        qualities: {
          unknown: {
            type: 'mp4',
            url: finalStream,
          },
        },
        headers: {
          Referer: BASE_URL,
          'User-Agent': 'Mozilla/5.0',
        },
      },
    ],
  };
}

export const FedApiScraper = makeSourcerer({
  id: 'fedapi',
  name: 'FED API',
  rank: 103,
  disabled: !getUserToken(),
  flags: [],
  scrapeMovie: FedScraper,
  scrapeShow: FedScraper,
});
