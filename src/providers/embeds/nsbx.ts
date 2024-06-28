import { EmbedOutput, makeEmbed } from '@/providers/base';
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
      const [query, baseUrl] = ctx.url.split('.');

      const search = await ctx.fetcher.full('/search', {
        query: {
          query: encodeURIComponent(query),
          provider: provider.id,
        },
        credentials: 'include',
        baseUrl,
      });

      if (search.statusCode === 429) throw new Error('Rate limited');
      if (search.statusCode !== 200) throw new NotFoundError('Failed to search');

      ctx.progress(50);

      const result = await ctx.fetcher('/provider', {
        query: {
          resourceId: encodeURIComponent(search.body.url),
          provider: provider.id,
        },
        credentials: 'include',
        baseUrl,
      });

      ctx.progress(100);

      return result as EmbedOutput;
    },
  });
}

export const [deltaScraper, alphaScraper] = providers.map(embed);
