import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { getTurnstileToken } from '@/utils/turnstile';

import { Caption, labelToLanguageCode } from '../captions';

const getUserToken = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    const prefData = window.localStorage.getItem('__MW::preferences');
    if (!prefData) return null;
    const parsedAuth = JSON.parse(prefData);
    return parsedAuth?.state?.febboxKey || null;
  } catch (e) {
    console.warn('Unable to access localStorage or parse auth data:', e);
    return null;
  }
};

const getRegion = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    const regionData = window.localStorage.getItem('__MW::region');
    if (!regionData) return null;
    const parsed = JSON.parse(regionData);
    return parsed?.state?.region ?? null;
  } catch (e) {
    console.warn('Unable to access localStorage or parse auth data:', e);
    return null;
  }
};

const BASE_URL = 'https://fed-api-db.pstream.mov';

function selectSubdomainByRegion(input: string | null): string | null {
  const region = (input || '').toLowerCase();

  if (/(^|\b)(usa5|usa6|usa7|uk1|de2|hk1|ca1|au1|sg1|in1)(\b|$)/.test(region)) {
    const match = region.match(/(usa5|usa6|usa7|uk1|de2|hk1|ca1|au1|sg1|in1)/);
    if (match) return match[1];
  }

  if (region.includes('dallas')) return 'usa5';
  if (region.includes('portland')) return 'usa6';
  if (region.includes('new-york')) return 'usa7';
  if (region.includes('paris')) return Math.random() < 0.5 ? 'uk1' : 'de2';
  if (region.includes('hong-kong')) return 'hk1';
  if (region.includes('kansas')) return Math.random() < 0.5 ? 'usa7' : 'usa6';
  if (region.includes('sydney')) return 'au1';
  if (region.includes('singapore')) return 'sg1';
  if (region.includes('mumbai')) return 'in1';

  if (region === 'east') return 'usa7';
  if (region === 'west') return 'usa6';
  if (region === 'south') return 'usa5';
  if (region === 'europe') return Math.random() < 0.5 ? 'uk1' : 'de2';
  if (region === 'asia') return 'sg1';

  return null;
}

function rewriteSheguSubdomain(originalUrl: string, subdomain: string): string {
  try {
    const parsed = new URL(originalUrl);
    if (parsed.hostname.endsWith('.shegu.net')) {
      parsed.hostname = `${subdomain}.shegu.net`;
      return parsed.toString();
    }
    return originalUrl;
  } catch {
    return originalUrl;
  }
}

interface StreamData {
  streams: Record<string, string>;
  subtitles: Record<string, any>;
  error?: string;
  name?: string;
  size?: string;
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const userToken = getUserToken();
  if (!userToken) throw new NotFoundError('Requires a user token!');

  const region = getRegion();

  let turnstileToken: string;
  try {
    turnstileToken = await getTurnstileToken('0x4AAAAAACuH31Fvud7uaIMf');
  } catch (error) {
    // eslint-disable-next-line no-alert
    alert('FED DB Turnstile verification failed. Please refresh the page and try again.');
    throw new NotFoundError(`Turnstile verification failed: ${error}`);
  }

  ctx.progress(50);

  const apiUrl =
    ctx.media.type === 'movie'
      ? `${BASE_URL}/movie/${ctx.media.tmdbId}`
      : `${BASE_URL}/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;

  const data = await ctx.fetcher<StreamData>(apiUrl);

  if (data?.error && data.error.endsWith('not found in database')) {
    throw new NotFoundError('No stream found');
  }
  if (!data) throw new NotFoundError('No response from API');

  ctx.progress(90);

  const streams = Object.entries(data.streams).reduce((acc: Record<string, string>, [quality, url]) => {
    let qualityKey: number;
    if (quality === 'ORG') {
      const urlPath = url.split('?')[0];
      if (urlPath.toLowerCase().includes('.mp4')) {
        acc.unknown = url;
      }
      return acc;
    }
    if (quality === '4K') {
      qualityKey = 2160;
    } else {
      qualityKey = parseInt(quality.replace('P', ''), 10);
    }
    if (Number.isNaN(qualityKey) || acc[qualityKey]) return acc;
    acc[qualityKey] = url;
    return acc;
  }, {});

  const filteredStreams = Object.entries(streams).reduce((acc: Record<string, string>, [quality, url]) => {
    acc[quality] = url;
    return acc;
  }, {});

  const selectedSubdomain = selectSubdomainByRegion(region);
  if (selectedSubdomain) {
    Object.keys(filteredStreams).forEach((q) => {
      filteredStreams[q] = rewriteSheguSubdomain(filteredStreams[q], selectedSubdomain as string);
    });
  }

  const captions: Caption[] = [];
  if (data.subtitles) {
    for (const [langKey, subtitleData] of Object.entries(data.subtitles)) {
      const languageKeyPart = langKey.split('_')[0];
      const languageName = languageKeyPart.charAt(0).toUpperCase() + languageKeyPart.slice(1);
      const languageCode = labelToLanguageCode(languageName)?.toLowerCase() ?? 'unknown';

      if (subtitleData.subtitle_link) {
        const url = subtitleData.subtitle_link;
        const isVtt = url.toLowerCase().endsWith('.vtt');
        captions.push({
          type: isVtt ? 'vtt' : 'srt',
          id: url,
          url,
          language: languageCode,
          hasCorsRestrictions: false,
        });
      }
    }
  }

  ctx.progress(90);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        captions,
        qualities: {
          ...(filteredStreams[2160] && {
            '4k': {
              type: 'mp4',
              url: filteredStreams[2160],
            },
          }),
          ...(filteredStreams[1080] && {
            1080: {
              type: 'mp4',
              url: filteredStreams[1080],
            },
          }),
          ...(filteredStreams[720] && {
            720: {
              type: 'mp4',
              url: filteredStreams[720],
            },
          }),
          ...(filteredStreams[480] && {
            480: {
              type: 'mp4',
              url: filteredStreams[480],
            },
          }),
          ...(filteredStreams[360] && {
            360: {
              type: 'mp4',
              url: filteredStreams[360],
            },
          }),
          ...(filteredStreams.unknown && {
            unknown: {
              type: 'mp4',
              url: filteredStreams.unknown,
            },
          }),
        },
        type: 'file',
        flags: [flags.CORS_ALLOWED],
      },
    ],
  };
}

export const FedAPIDBScraper = makeSourcerer({
  id: 'fedapidb',
  name: 'FED DB 🔥',
  rank: 299,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});