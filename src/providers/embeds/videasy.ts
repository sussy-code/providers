import { flags } from '@/entrypoint/utils/targets';

import { makeEmbed } from '../base';

export const videasyScraper = makeEmbed({
  id: 'videasy',
  name: 'Vidlink',
  rank: 126,
  flags: [flags.CORS_ALLOWED],

  async scrape(ctx) {
    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
          qualities: {
            unknown: {
              type: 'mp4',
              url: ctx.url,
            },
          },
          captions: [],
          flags: [flags.CORS_ALLOWED],
        },
      ],
    };
  },
});
