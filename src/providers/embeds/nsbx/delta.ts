import { EmbedOutput, makeEmbed } from '@/providers/base';
import { headers } from '@/providers/sources/nsbx';

export const deltaScraper = makeEmbed({
  id: 'delta',
  name: 'Delta',
  rank: 200,
  disabled: false,
  async scrape(ctx) {
    const url = `https://api.nsbx.ru/provider?resourceId=${encodeURIComponent(ctx.url)}&provider=delta`;
    const result = await ctx.fetcher(url, {
      headers,
    });

    return result as EmbedOutput;
  },
});
