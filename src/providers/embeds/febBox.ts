import { flags } from '@/main/targets';
import { makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

const febBoxBase = `https://www.febbox.com`;

export const febBoxScraper = makeEmbed({
  id: 'febBox',
  name: 'FebBox',
  rank: 160,
  async scrape(ctx) {
    const shareKey = ctx.url.split('/')[4];
    const streams = await ctx.fetcher<{
      data?: {
        file_list?: {
          fid?: string;
        }[];
      };
    }>('/file/file_share_list', {
      baseUrl: febBoxBase,
      query: {
        share_key: shareKey,
        pwd: '',
      },
    });

    const fid = streams?.data?.file_list?.[0]?.fid;
    if (!fid) throw new NotFoundError('no result found');

    const formParams = new URLSearchParams();
    formParams.append('fid', fid);
    formParams.append('share_key', shareKey);

    const player = await ctx.fetcher<string>('/file/player', {
      baseUrl: febBoxBase,
      body: formParams,
      method: 'POST',
    });

    const sourcesMatch = player?.match(/var sources = (\[[^\]]+\]);/);
    const qualities = sourcesMatch ? JSON.parse(sourcesMatch[0].replace('var sources = ', '').replace(';', '')) : null;

    if (!qualities) throw new NotFoundError('no result found');

    return {
      stream: {
        type: 'file',
        flags: [flags.NO_CORS],
        qualities: {
          '360': {
            type: 'mp4',
            url: qualities[0].file,
          },
        },
      },
    };
  },
});
