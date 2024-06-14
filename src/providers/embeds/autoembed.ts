import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

const providers = [
  {
    id: 'autoembed-english',
    rank: 10,
  },
  {
    id: 'autoembed-hindi',
    rank: 9,
  },
  {
    id: 'autoembed-tamil',
    rank: 8,
  },
  {
    id: 'autoembed-telugu',
    rank: 7,
  },
  {
    id: 'autoembed-bengali',
    rank: 6,
  },
];

function embed(provider: { id: string; rank: number }) {
  return makeEmbed({
    id: provider.id,
    name: provider.id.charAt(0).toUpperCase() + provider.id.slice(1),
    rank: provider.rank,
    async scrape(ctx) {
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
}

export const [
  autoembedEnglishScraper,
  autoembedHindiScraper,
  autoembedBengaliScraper,
  autoembedTamilScraper,
  autoembedTeluguScraper,
] = providers.map(embed);
