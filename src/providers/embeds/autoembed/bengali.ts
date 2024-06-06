import { makeEmbed } from '@/providers/base';

import { autoembedEnglishScraper } from './english';

export const autoembedBenagaliScraper = makeEmbed({
  id: 'autoembed-bengali',
  name: 'Bengali',
  rank: 7,
  async scrape(ctx) {
    const result = await autoembedEnglishScraper.scrape(ctx);
    return {
      stream: result.stream,
    };
  },
});
