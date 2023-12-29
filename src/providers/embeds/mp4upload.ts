import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

export const mp4uploadScraper = makeEmbed({
  id: 'mp4upload',
  name: 'mp4upload',
  rank: 170,
  async scrape(ctx) {
    const embed = await ctx.proxiedFetcher<string>(ctx.url);

    const playerSrcRegex = /(?<=player\.src\()\s*{\s*type:\s*"[^"]+",\s*src:\s*"([^"]+)"\s*}\s*(?=\);)/s;
    const playerSrc = embed.match(playerSrcRegex) ?? [];

    const streamUrl = playerSrc[1];
    if (!streamUrl) throw new Error('Stream url not found in embed code');

    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
          flags: [flags.CORS_ALLOWED],
          captions: [],
          qualities: {
            '1080': {
              type: 'mp4',
              url: streamUrl,
            },
          },
        },
      ],
    };
  },
});
