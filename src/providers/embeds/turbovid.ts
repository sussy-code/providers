import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

// Thanks to Paradox_77 for helping with the decryption
function hexToChar(hex: string): string {
  return String.fromCharCode(parseInt(hex, 16));
}

function decrypt(data: string, key: string): string {
  const formatedData = data.match(/../g)?.map(hexToChar).join('') || '';
  return formatedData
    .split('')
    .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
    .join('');
}

export const turbovidScraper = makeEmbed({
  id: 'turbovid',
  name: 'Turbovid',
  rank: 122,
  async scrape(ctx) {
    const baseUrl = new URL(ctx.url).origin;
    const embedPage = await ctx.proxiedFetcher(ctx.url);

    // the whitespace is for future-proofing the regex a bit
    const apkey = embedPage.match(/const\s+apkey\s*=\s*"(.*?)";/)?.[1];
    const xxid = embedPage.match(/const\s+xxid\s*=\s*"(.*?)";/)?.[1];

    if (!apkey || !xxid) throw new Error('Failed to get required values');

    // json isn't parsed by proxiedFetcher due to content-type being text/html
    const juiceKey = JSON.parse(
      await ctx.proxiedFetcher('/api/cucked/juice_key', {
        baseUrl,
        headers: {
          referer: ctx.url,
        },
      }),
    ).juice;

    if (!juiceKey) throw new Error('Failed to fetch the key');

    const data = JSON.parse(
      await ctx.proxiedFetcher('/api/cucked/the_juice/', {
        baseUrl,
        query: {
          [apkey]: xxid,
        },
        headers: {
          referer: ctx.url,
        },
      }),
    ).data;

    if (!data) throw new Error('Failed to fetch required data');

    const playlist = decrypt(data, juiceKey);

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist,
          headers: {
            referer: baseUrl,
          },
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
