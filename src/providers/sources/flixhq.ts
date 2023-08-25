import { makeSourcerer } from '@/providers/base';

export const flixHq = makeSourcerer({
  id: 'flixhq',
  name: 'FlixHQ',
  rank: 500,

  async scrapeShow(_input) {
    return {
      embeds: [],
      stream: {
        type: 'file',
        qualities: {
          '360': {
            type: 'mp4',
            url: 'blabal.mp4',
          },
        },
      },
    };
  },

  async scrapeMovie(_input) {
    return {
      embeds: [],
    };
  },
});
