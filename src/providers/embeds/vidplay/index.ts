import { makeEmbed } from '@/providers/base';

import { getFileUrl } from './common';
import { VidplaySourceResponse } from './types';

export const vidplayScraper = makeEmbed({
  id: 'vidplay',
  name: 'VidPlay',
  rank: 499,
  scrape: async (ctx) => {
    const fileUrl = await getFileUrl(ctx);
    console.log(fileUrl);
    const fileUrlRes = await ctx.proxiedFetcher<VidplaySourceResponse>(`${fileUrl}&autostart=true`, {
      headers: {
        referer: ctx.url,
      },
    });
    const source = fileUrlRes.result.sources[0].file;

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: source,
          flags: [],
          captions: [],
        },
      ],
    };
  },
});
