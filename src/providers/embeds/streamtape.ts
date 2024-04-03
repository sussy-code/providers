import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

export const streamtapeScraper = makeEmbed({
  id: 'streamtape',
  name: 'Streamtape',
  rank: 160,
  async scrape(ctx) {
    const embed = await ctx.proxiedFetcher<string>(ctx.url);

    const match = embed.match(/robotlink'\).innerHTML = (.*)'/);
    if (!match) throw new Error('No match found');

    const [fh, sh] = match?.[1]?.split("+ ('") ?? [];
    if (!fh || !sh) throw new Error('No match found');

    const url = `https:${fh?.replace(/'/g, '').trim()}${sh?.substring(3).trim()}`;

    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
          flags: [flags.CORS_ALLOWED, flags.IP_LOCKED],
          captions: [],
          qualities: {
            unknown: {
              type: 'mp4',
              url,
            },
          },
          headers: {
            Referer: 'https://streamtape.com',
          },
        },
      ],
    };
  },
});
