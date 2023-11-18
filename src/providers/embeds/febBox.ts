import { flags } from '@/main/targets';
import { makeEmbed } from '@/providers/base';
import { StreamFile } from '@/providers/streams';
import { NotFoundError } from '@/utils/errors';

const febBoxBase = `https://www.febbox.com`;

const allowedQualities = ['360', '480', '720', '1080'];

export const febBoxScraper = makeEmbed({
  id: 'febbox',
  name: 'FebBox',
  rank: 160,
  async scrape(ctx) {
    const shareKey = ctx.url.split('/')[4];
    const streams = await ctx.proxiedFetcher<{
      data?: {
        file_list?: {
          fid?: string;
        }[];
      };
    }>('/file/file_share_list', {
      headers: {
        'accept-language': 'en', // without this header, the request is marked as a webscraper
      },
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

    const player = await ctx.proxiedFetcher<string>('/file/player', {
      baseUrl: febBoxBase,
      body: formParams,
      method: 'POST',
      headers: {
        'accept-language': 'en', // without this header, the request is marked as a webscraper
      },
    });

    const sourcesMatch = player?.match(/var sources = (\[[^\]]+\]);/);
    const qualities = sourcesMatch ? JSON.parse(sourcesMatch[0].replace('var sources = ', '').replace(';', '')) : null;

    const embedQualities: Record<string, StreamFile> = {};

    qualities.forEach((quality: { file: string; label: string }) => {
      const normalizedLabel = quality.label.toLowerCase().replace('p', '');
      if (allowedQualities.includes(normalizedLabel)) {
        if (!quality.file) return;
        embedQualities[normalizedLabel] = {
          type: 'mp4',
          url: quality.file,
        };
      }
    });

    return {
      stream: {
        type: 'file',
        captions: [],
        flags: [flags.NO_CORS],
        qualities: embedQualities,
      },
    };
  },
});
