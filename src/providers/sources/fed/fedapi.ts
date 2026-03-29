import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { getTurnstileToken } from '@/utils/turnstile';

import { Caption, labelToLanguageCode } from '../../captions';

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

const BASE_URL = 'https://mznxiwqjdiq00239q.space';

interface StreamEntry {
  type: 'hls' | 'mp4';
  url: string;
}

interface StreamData {
  streams: Record<string, StreamEntry | string>;
  subtitles: Record<string, any>;
  error?: string;
  name?: string;
  size?: string;
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const userToken = getUserToken();
  if (!userToken) throw new NotFoundError('Requires a user token!');

  let turnstileToken: string;
  try {
    turnstileToken = await getTurnstileToken('0x4AAAAAABgPwhrOT6x6sTjI');
  } catch (error) {
    // eslint-disable-next-line no-alert
    alert('FED API Turnstile verification failed. Please refresh the page and try again.');
    throw new NotFoundError(`Turnstile verification failed: ${error}`);
  }

  ctx.progress(50);

  const name = ctx.media.title;
  let apiUrl = `${BASE_URL}/fedapi?name=${encodeURIComponent(name)}&year=${ctx.media.releaseYear}&ui=${encodeURIComponent(userToken)}`;
  if (ctx.media.type === 'show') {
    apiUrl += `&season=${ctx.media.season.number}&episode=${ctx.media.episode.number}`;
  }

  const res = await fetch(apiUrl, { credentials: 'omit' });
  if (!res.ok) throw new NotFoundError('API request failed');
  const data: StreamData = await res.json();

  if (data?.error && data.error.endsWith('not found in database')) {
    throw new NotFoundError('No stream found');
  }
  if (!data) throw new NotFoundError('No response from API');

  ctx.progress(90);

  type StreamInfo = { url: string; type: 'hls' | 'mp4' };
  const streams = Object.entries(data.streams).reduce((acc: Record<string, StreamInfo>, [quality, entry]) => {
    const url = typeof entry === 'string' ? entry : entry.url;
    const type = typeof entry === 'string' ? 'mp4' : entry.type;

    let qualityKey: number;
    if (quality === 'ORG') {
      const urlPath = url.split('?')[0];
      if (urlPath.toLowerCase().includes('.mp4') || type === 'hls') {
        acc.unknown = { url, type };
      }
      return acc;
    }
    if (quality === '4K') {
      qualityKey = 2160;
    } else {
      qualityKey = parseInt(quality.replace('P', ''), 10);
    }
    if (Number.isNaN(qualityKey) || acc[qualityKey]) return acc;
    acc[qualityKey] = { url, type };
    return acc;
  }, {});

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

  const hlsStream = streams[2160] ?? streams[1080] ?? streams[720] ?? streams[480] ?? streams[360] ?? streams.unknown;
  if (hlsStream?.type === 'hls') {
    return {
      embeds: [],
      stream: [
        {
          id: 'primary',
          captions,
          playlist: hlsStream.url,
          type: 'hls',
          flags: [flags.CORS_ALLOWED],
        },
      ],
    };
  }

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        captions,
        qualities: {
          ...(streams[2160] && { '4k': { type: 'mp4', url: streams[2160].url } }),
          ...(streams[1080] && { 1080: { type: 'mp4', url: streams[1080].url } }),
          ...(streams[720] && { 720: { type: 'mp4', url: streams[720].url } }),
          ...(streams[480] && { 480: { type: 'mp4', url: streams[480].url } }),
          ...(streams[360] && { 360: { type: 'mp4', url: streams[360].url } }),
          ...(streams.unknown && { unknown: { type: 'mp4', url: streams.unknown.url } }),
        },
        type: 'file',
        flags: [flags.CORS_ALLOWED],
      },
    ],
  };
}

export const FedAPIScraper = makeSourcerer({
  id: 'fedapi',
  name: 'FED API 🔥',
  rank: 101,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
