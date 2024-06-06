import { makeEmbed } from '@/providers/base';

import { autoembedEnglishScraper } from './english';

export const autoembedHindiScraper = makeEmbed({
  id: 'autoembed-hindi',
  name: 'Hindi',
  rank: 9,
  async scrape(ctx) {
    const result = await autoembedEnglishScraper.scrape(ctx);
    return {
      stream: result.stream,
    };
  },
});
