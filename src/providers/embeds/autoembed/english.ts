import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

export const autoembedEnglishScraper = makeEmbed({
  id: 'autoembed-english',
  name: 'English',
  rank: 10,
  scrape: async (ctx) => {
    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: ctx.url,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
