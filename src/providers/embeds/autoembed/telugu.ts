import { makeEmbed } from '@/providers/base';

import { autoembedEnglishScraper } from './english';

export const autoembedTeluguScraper = makeEmbed({
  id: 'autoembed-telugu',
  name: 'Telugu',
  rank: 6,
  async scrape(ctx) {
    const result = await autoembedEnglishScraper.scrape(ctx);
    return {
      stream: result.stream,
    };
  },
});
