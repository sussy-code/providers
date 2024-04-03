import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

const linkRegex = /'hls': ?'(http.*?)',/;
const tracksRegex = /previewThumbnails:\s{.*src:\["([^"]+)"]/;

export const voeScraper = makeEmbed({
  id: 'voe',
  name: 'voe.sx',
  rank: 180,
  async scrape(ctx) {
    const embedRes = await ctx.proxiedFetcher.full<string>(ctx.url);
    const embed = embedRes.body;

    const playerSrc = embed.match(linkRegex) ?? [];
    const thumbnailTrack = embed.match(tracksRegex);

    const streamUrl = playerSrc[1];
    if (!streamUrl) throw new Error('Stream url not found in embed code');

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: streamUrl,
          flags: [flags.CORS_ALLOWED, flags.IP_LOCKED],
          captions: [],
          headers: {
            Referer: 'https://voe.sx',
          },
          ...(thumbnailTrack
            ? {
                thumbnailTrack: {
                  type: 'vtt',
                  url: new URL(embedRes.finalUrl).origin + thumbnailTrack[1],
                },
              }
            : {}),
        },
      ],
    };
  },
});
