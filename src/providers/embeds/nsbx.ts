import { EmbedOutput, makeEmbed } from '@/providers/base';
import { baseUrl, headers } from '@/providers/sources/nsbx';
import { NotFoundError } from '@/utils/errors';

const providers = [
  {
    id: 'delta',
    rank: 699,
  },
  {
    id: 'alpha',
    rank: 695,
  },
];

function embed(provider: { id: string; rank: number }) {
  return makeEmbed({
    id: provider.id,
    name: provider.id.charAt(0).toUpperCase() + provider.id.slice(1),
    rank: provider.rank,
    disabled: false,
    async scrape(ctx) {
      const search = await ctx.fetcher.full(
        `${baseUrl}/search?query=${encodeURIComponent(ctx.url)}&provider=${provider.id}`,
        { headers },
      );

      if (search.statusCode === 429) {
        throw new Error('Rate limited');
      } else if (search.statusCode !== 200) {
        throw new NotFoundError('Failed to search');
      }

      ctx.progress(50);

      const result = await ctx.fetcher(
        `${baseUrl}/provider?resourceId=${encodeURIComponent(search.body.url)}&provider=${provider.id}`,
        {
          headers,
        },
      );

      ctx.progress(100);

      return result as EmbedOutput;
    },
  });
}

export const [deltaScraper, alphaScraper] = providers.map(embed);
