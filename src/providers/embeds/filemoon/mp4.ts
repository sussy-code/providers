import { NotFoundError } from '@/utils/errors';

import { makeEmbed } from '../../base';

import { fileMoonScraper } from './index';

export const fileMoonMp4Scraper = makeEmbed({
  id: 'filemoon-mp4',
  name: 'Filemoon MP4',
  rank: 400,
  scrape: async (ctx) => {
    const result = await fileMoonScraper.scrape(ctx);

    if (!result.stream) throw new NotFoundError('Failed to find result');

    if (result.stream[0].type !== 'hls') throw new NotFoundError('Failed to find hls stream');

    const url = result.stream[0].playlist.replace(/\/hls2\//, '/download/').replace(/\.m3u8/, '.mp4');

    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
          qualities: {
            unknown: {
              type: 'mp4',
              url,
            },
          },
          flags: [],
          captions: result.stream[0].captions,
        },
      ],
    };
  },
});
