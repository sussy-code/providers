import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';
import { labelToLanguageCode } from '../../captions';

const BASE_URL = 'https://fedapi.asteral-ss2.workers.dev';

const getUserToken = () => {
  try {
    if (typeof window === 'undefined') return null;

    const prefData = window.localStorage.getItem('__MW::preferences');
    if (!prefData) return null;

    const parsed = JSON.parse(prefData);
    return parsed?.state?.febboxKey || null;
  } catch {
    return null;
  }
};

const getRegion = () => {
  try {
    if (typeof window === 'undefined') return null;

    const regionData = window.localStorage.getItem('__MW::region');
    if (!regionData) return null;

    const parsed = JSON.parse(regionData);
    return parsed?.state?.region || null;
  } catch {
    return null;
  }
};

function selectSubdomainByRegion(input) {
  const region = (input || '').toLowerCase();

  const match = region.match(/(usa5|usa6|usa7|uk1|de2|hk1|ca1|au1|sg1|in1)/);
  if (match) return match[1];

  if (region.includes('dallas')) return 'usa5';
  if (region.includes('portland')) return 'usa6';
  if (region.includes('new-york')) return 'usa7';
  if (region.includes('paris')) return Math.random() < 0.5 ? 'uk1' : 'de2';

  return null;
}

function rewriteSheguSubdomain(url, subdomain) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.endsWith('.shegu.net')) {
      parsed.hostname = `${subdomain}.shegu.net`;
      return parsed.toString();
    }

    return url;
  } catch {
    return url;
  }
}

async function FedScraper(ctx) {
  const token = getUserToken();
  if (!token) throw new NotFoundError('Missing user token');

  const tmdbId = ctx.media.tmdbId;
  if (!tmdbId) throw new NotFoundError('Missing TMDB ID');

  const region = getRegion();
  ctx.progress(30);

  const url =
    ctx.media.type === 'movie'
      ? `${BASE_URL}/movie/${tmdbId}`
      : `${BASE_URL}/tv/${tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;

  const data = await ctx.fetcher(url);

  if (!data || !data.success || !data.stream) {
    throw new NotFoundError('No stream found');
  }

  let finalStreamUrl = data.stream;

  const selectedSubdomain = selectSubdomainByRegion(region);
  if (selectedSubdomain) {
    finalStreamUrl = rewriteSheguSubdomain(finalStreamUrl, selectedSubdomain);
  }

  ctx.progress(80);

  const captions = [];

  if (data.subtitles) {
    Object.entries(data.subtitles).forEach(([langKey, sub]) => {
      const languageName = langKey.split('_')[0];
      const languageCode =
        labelToLanguageCode(languageName)?.toLowerCase() || 'unknown';

      if (sub?.url) {
        captions.push({
          type: sub.url.endsWith('.vtt') ? 'vtt' : 'srt',
          id: sub.url,
          url: sub.url,
          language: languageCode,
          hasCorsRestrictions: false,
        });
      }
    });
  }

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
            url: finalStreamUrl,
          },
        },
        headers: {},
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
