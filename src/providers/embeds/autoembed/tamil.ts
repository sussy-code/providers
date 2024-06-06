import { makeEmbed } from '@/providers/base';

import { autoembedEnglishScraper } from './english';

export const autoembedTamilScraper = makeEmbed({
  id: 'autoembed-tamil',
  name: 'Tamil',
  rank: 8,
  async scrape(ctx) {
    const result = await autoembedEnglishScraper.scrape(ctx);
    return {
      stream: result.stream,
    };
  },
});
