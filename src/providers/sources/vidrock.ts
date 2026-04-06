import CryptoJS from 'crypto-js';
import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const headers = {
  Origin: 'https://vidrock.net',
  Referer: 'https://vidrock.net/',
};

const passphrase = 'x7k9mPqT2rWvY8zA5bC3nF6hJ2lK4mN9';
const key = CryptoJS.enc.Utf8.parse(passphrase);
const iv = CryptoJS.enc.Utf8.parse(passphrase.substring(0, 16));

const baseUrl = 'https://vidrock.net/api';
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const itemType = ctx.media.type;
  let itemId: string;

  if (itemType === 'movie') {
    itemId = ctx.media.tmdbId;
  } else {
    const s = (ctx as ShowScrapeContext).media.season.number;
    const e = (ctx as ShowScrapeContext).media.episode.number;
    itemId = `${ctx.media.tmdbId}-${s}-${e}`; 
  }

  const encrypted = CryptoJS.AES.encrypt(itemId, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const encryptedBase64 = encrypted.toString()
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const url = `${baseUrl}/${itemType}/${encodeURIComponent(encryptedBase64)}`;

  const res = await ctx.proxiedFetcher<any>(url, {
    headers: {
      ...headers,
      'User-Agent': userAgent,
    },
  });

  let parsedRes = res;
  if (typeof res === 'string') {
    try {
      parsedRes = JSON.parse(res);
    } catch (e) {
      throw new NotFoundError(`Vidrock API returned invalid content for ${itemType}.`);
    }
  }

  if (!parsedRes || typeof parsedRes !== 'object') {
    throw new NotFoundError('No sources found from Vidrock');
  }

  const embeds = [];

  for (const [sourceKey, sourceData] of Object.entries(parsedRes)) {
    const data = sourceData as any;
    if (!data?.url) continue;

    embeds.push({
      embedId: 'mirror',
      url: JSON.stringify({
        type: data.url.includes('m3u8') ? 'hls' : 'file',
        url: data.url,
        headers,
        flags: [flags.CORS_ALLOWED],
      }),
    });
  }

  if (embeds.length === 0) throw new NotFoundError('No valid sources found');

  return { embeds };
}

export const vidrockScraper = makeSourcerer({
  id: 'vidrock',
  name: 'Granite',
  rank: 97,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});