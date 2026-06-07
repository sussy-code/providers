import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

export const filmuEmbedScraper = makeEmbed({
  id: 'filmi',
  name: 'Filmi',
  rank: 175,
  flags: [flags.CORS_ALLOWED],

  async scrape(ctx) {
    const html = await ctx.proxiedFetcher<string>(ctx.url, {
      headers: {
        Referer: 'https://tv.filmu.in/',
        'User-Agent': userAgent,
      },
    });

    const m3u8 =
      html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i)?.[1];

    const mp4 =
      html.match(/<video[^>]+src=["']([^"']+)["']/i)?.[1];

    const streamUrl = m3u8 || mp4;
    if (!streamUrl) throw new Error('No Filmu stream found');

    return {
      stream: [
        streamUrl.includes('.mp4')
          ? {
              id: 'primary',
              type: 'file',
              qualities: {
                unknown: {
                  type: 'mp4',
                  url: streamUrl,
                },
              },
              captions: [],
              flags: [flags.CORS_ALLOWED],
            }
          : {
              id: 'primary',
              type: 'hls',
              playlist: streamUrl,
              captions: [],
              flags: [flags.CORS_ALLOWED],
            },
      ],
    };
  },
});