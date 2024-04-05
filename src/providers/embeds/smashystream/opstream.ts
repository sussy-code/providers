import { makeEmbed } from '@/providers/base';

import { smashyStreamFScraper } from './video1';

export const smashyStreamOScraper = makeEmbed({
  // the scraping logic for all smashystream embeds is the same
  // all the embeds can be added in the same way
  id: 'smashystream-o',
  name: 'SmashyStream (O)',
  rank: 70,
  async scrape(ctx) {
    const result = await smashyStreamFScraper.scrape(ctx);
    return {
      stream: result.stream,
    };
  },
});
