import { AES, enc, mode, pad } from 'crypto-js';
import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer, SourcererOutput } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const API_BASE = 'https://api.videasy.net';
// This salt must match the one currently in users.videasy.net/api/script.js
const XOR_SALT = '8c465aa8af6cbfd4c1f91bf0c8d678ba'; 

/**
 * Reverses the XOR shift. 
 * Using WordArray.create allows crypto-js to handle the raw bytes more reliably.
 */
function decodeVideasyHex(hex: string): any {
  const words: number[] = [];
  for (let i = 0; i < hex.length; i += 8) {
    let word = 0;
    for (let j = 0; j < 8; j += 2) {
      const index = (i + j) / 2;
      let byte = parseInt(hex.substring(i + j, i + j + 2), 16);
      byte ^= XOR_SALT.charCodeAt(index % XOR_SALT.length);
      word = (word << 8) | byte;
    }
    words.push(word);
  }
  return enc.Hex.parse(words.map(w => (w >>> 0).toString(16).padStart(8, '0')).join(''));
}

async function fetchVideasyStream(
  ctx: MovieScrapeContext | ShowScrapeContext,
  type: 'movie' | 'tv',
): Promise<SourcererOutput> {
  const tmdbId = String(ctx.media.tmdbId);
  
  // Grey's Anatomy -> Grey%27s+Anatomy (matching your browser log)
  const encodedTitle = encodeURIComponent(ctx.media.title).replace(/%20/g, '+');

  const params = [
    `title=${encodedTitle}`,
    `mediaType=${type}`,
    `year=${ctx.media.releaseYear}`,
    `episodeId=${type === 'tv' ? (ctx as ShowScrapeContext).media.episode.number : ''}`,
    `seasonId=${type === 'tv' ? (ctx as ShowScrapeContext).media.season.number : ''}`,
    `tmdbId=${tmdbId}`,
    `imdbId=${ctx.media.imdbId ?? ''}`
  ].join('&');

  const url = `${API_BASE}/moviebox/sources-with-title?${params}`;
  console.log(`[MovieBox] Sending Request: ${url}`);

  const response: any = await ctx.proxiedFetcher(url, {
    headers: {
      'Origin': 'https://player.videasy.net',
      'Referer': 'https://player.videasy.net/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0',
      'Accept': '*/*',
      'Cache-Control': 'no-cache',
    }
  });

  const encryptedData = typeof response === 'string' ? response : response?.sources;
  if (!encryptedData || encryptedData.length < 100) throw new NotFoundError('No sources');

  try {
    // Videasy uses the raw string bytes of the salt as key
    const key = enc.Utf8.parse(XOR_SALT);
    // IV is the first 16 bytes (128 bits) of the salt
    const iv = enc.Utf8.parse(XOR_SALT.substring(0, 16));

    const ciphertext = decodeVideasyHex(encryptedData);
    
    const decrypted = AES.decrypt(
      { ciphertext } as any,
      key,
      { iv, mode: mode.CBC, padding: pad.Pkcs7 }
    );

    const decryptedText = decrypted.toString(enc.Utf8);
    
    // If this is empty, the XOR_SALT provided doesn't match the server's current salt
    if (!decryptedText) {
       console.log(`[MovieBox] Decryption failed. Raw Start: ${encryptedData.substring(0, 20)}`);
       throw new Error("Invalid Decryption Result");
    }

    const sources = JSON.parse(decryptedText);
    console.log(`[MovieBox] Found ${sources.length} sources.`);

    return {
      embeds: [],
      stream: sources.map((s: any) => ({
        id: 'videasy',
        type: s.file.includes('m3u8') ? 'hls' : 'file',
        playlist: s.file,
        quality: s.label || 'Unknown',
        flags: [flags.CORS_ALLOWED],
        captions: [],
        ...(s.file.includes('m3u8') ? {} : { qualities: { "unknown": { type: "mp4", url: s.file } } })
      }))
    };
  } catch (err: any) {
    console.error(`[MovieBox] Critical Decryption Failure: ${err.message}`);
    throw new NotFoundError('Failed to process stream data');
  }
}

export const movieboxScraper = makeSourcerer({
  id: 'moviebox',
  name: 'MovieBox',
  rank: 110,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: (ctx) => fetchVideasyStream(ctx, 'movie'),
  scrapeShow: (ctx) => fetchVideasyStream(ctx, 'tv'),
});