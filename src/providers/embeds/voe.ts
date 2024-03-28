import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

const linkRegex = /'hls': ?'(http.*?)',/;

export const voeScraper = makeEmbed({
  id: 'voe',
  name: 'voe.sx',
  rank: 180,
  async scrape(ctx) {
    const embed = await ctx.proxiedFetcher<string>(ctx.url);

    const playerSrc = embed.match(linkRegex) ?? [];

    const streamUrl = playerSrc[1];
    if (!streamUrl) throw new Error('Stream url not found in embed code');

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: streamUrl,
          flags: [flags.CORS_ALLOWED],
          captions: [],
          headers: {
            Referer: 'https://voe.sx',
          },
        },
      ],
    };
  },
});
