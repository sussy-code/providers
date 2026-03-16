/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { getCometStreams } from './comet';
import { getAddonStreams, parseStreamData } from './helpers';
import { DebridParsedStream, debridProviders } from './types';

const OVERRIDE_TOKEN = '';
const OVERRIDE_SERVICE: debridProviders | '' = ''; // torbox or realdebrid (or real-debrid)

const getDebridToken = (): string | null => {
  try {
    if (OVERRIDE_TOKEN) return OVERRIDE_TOKEN;
  } catch {
    // Ignore
  }
  try {
    if (typeof window === 'undefined') return null;
    const prefData = window.localStorage.getItem('__MW::preferences');
    if (!prefData) return null;
    const parsedAuth = JSON.parse(prefData);
    return parsedAuth?.state?.debridToken || null;
  } catch (e) {
    console.error('Error getting debrid token:', e);
    return null;
  }
};

// torbox or realdebrid (coverted to `real-debrid` which is the type for torrentio)
const getDebridService = (): debridProviders => {
  try {
    if (OVERRIDE_SERVICE) return OVERRIDE_SERVICE as debridProviders;
  } catch {
    // Ignore
  }
  try {
    if (typeof window === 'undefined') return 'real-debrid';
    const prefData = window.localStorage.getItem('__MW::preferences');
    if (!prefData) return 'real-debrid';
    const parsedPrefs = JSON.parse(prefData);
    const saved = parsedPrefs?.state?.debridService;
    if (saved === 'realdebrid' || !saved) return 'real-debrid';
    return saved as debridProviders;
  } catch (e) {
    console.error('Error getting debrid service (defaulting to real-debrid):', e);
    return 'real-debrid';
  }
};

function normalizeQuality(resolution?: string): '4k' | 1080 | 720 | 480 | 360 | 'unknown' {
  if (!resolution) return 'unknown';
  const res = resolution.toLowerCase();
  if (res === '4k' || res === '2160p') return '4k';
  if (res === '1080p') return 1080;
  if (res === '720p') return 720;
  if (res === '480p') return 480;
  if (res === '360p') return 360;
  return 'unknown';
}

// Helper to score streams for compatibility (higher is better)
function scoreStream(stream: DebridParsedStream): number {
  let score = 0;
  // Prefer mp4 container
  if (stream.container === 'mp4') score += 10;
  // Prefer aac audio
  if (stream.audio === 'aac') score += 5;
  // Prefer h265 codec
  if (stream.codec === 'h265') score += 2;
  // Penalize mkv container
  if (stream.container === 'mkv') score -= 2;
  // Prefer complete
  if (stream.complete) score += 1;
  return score;
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const apiKey = getDebridToken();
  if (!apiKey) {
    throw new NotFoundError('Debrid API token is required');
  }

  const debridProvider: debridProviders = getDebridService();

  const [torrentioResult, cometStreams] = await Promise.all([
    getAddonStreams(`https://torrentio.strem.fun/${debridProvider}=${apiKey}`, ctx),
    getCometStreams(apiKey, debridProvider, ctx).catch(() => {
      return [] as DebridParsedStream[];
    }),
  ]);

  ctx.progress(33);

  const torrentioStreams = await parseStreamData(
    torrentioResult.streams.map((s) => ({
      ...s,
      title: s.title ?? '',
    })),
    ctx,
  );

  const allStreams = [...torrentioStreams, ...cometStreams];

  if (allStreams.length === 0) {
    console.log('No streams found from either source!');
    throw new NotFoundError('No streams found or parse failed!');
  }

  console.log(
    `Total streams: ${allStreams.length} (${torrentioStreams.length} from Torrentio, ${cometStreams.length} from Comet)`,
  );

  ctx.progress(66);

  const qualities: Partial<Record<'4k' | 1080 | 720 | 480 | 360 | 'unknown', { type: 'mp4'; url: string }>> = {};

  const byQuality: Record<string, DebridParsedStream[]> = {};
  for (const stream of allStreams) {
    const quality = normalizeQuality(stream.resolution);
    if (!byQuality[quality]) byQuality[quality] = [];
    byQuality[quality].push(stream);
  }

  for (const [quality, streams] of Object.entries(byQuality)) {
    const mp4Aac = streams.find((s) => s.container === 'mp4' && s.audio === 'aac');
    if (mp4Aac) {
      qualities[quality as keyof typeof qualities] = {
        type: 'mp4',
        url: mp4Aac.url,
      };
      continue;
    }
    const mp4 = streams.find((s) => s.container === 'mp4');
    if (mp4) {
      qualities[quality as keyof typeof qualities] = {
        type: 'mp4',
        url: mp4.url,
      };
      continue;
    }

    streams.sort((a, b) => scoreStream(b) - scoreStream(a));
    const best = streams[0];
    if (best) {
      qualities[quality as keyof typeof qualities] = {
        type: 'mp4', // has to be set as mp4 because of types..... But mkvs *can* work in a browser depending on codec, usually it cant be hevc and has to have AAC audio
        url: best.url,
      };
    }
  }

  ctx.progress(100);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'file',
        qualities,
        captions: [],
        flags: [],
      },
    ],
  };
}

export const debridScraper = makeSourcerer({
  id: 'debrid',
  name: 'Debrid',
  rank: 26,
  disabled: !getDebridToken(),
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
