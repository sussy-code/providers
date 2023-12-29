import * as unpacker from 'unpacker';

import { makeEmbed } from '@/providers/base';

const packedRegex = /(eval\(function\(p,a,c,k,e,d\){.*{}\)\))/;
const linkRegex = /MDCore\.wurl="(.*?)";/;

export const mixdropScraper = makeEmbed({
  id: 'mixdrop',
  name: 'MixDrop',
  rank: 198,
  async scrape(ctx) {
    // Example url: https://mixdrop.co/e/pkwrgp0pizgod0
    // Example url: https://mixdrop.vc/e/pkwrgp0pizgod0
    const streamRes = await ctx.proxiedFetcher<string>(ctx.url);
    const packed = streamRes.match(packedRegex);

    // MixDrop uses a queue system for embeds
    // If an embed is too new, the queue will
    // not be completed and thus the packed
    // JavaScript not present
    if (!packed) {
      throw new Error('failed to find packed mixdrop JavaScript');
    }

    const unpacked = unpacker.unpack(packed[1]);
    const link = unpacked.match(linkRegex);

    if (!link) {
      throw new Error('failed to find packed mixdrop source link');
    }

    const url = link[1];

    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
          flags: [],
          captions: [],
          qualities: {
            unknown: {
              type: 'mp4',
              url: url.startsWith('http') ? url : `https:${url}`, // URLs don't always start with the protocol
              headers: {
                // MixDrop requires this header on all streams
                Referer: 'https://mixdrop.co/',
              },
            },
          },
        },
      ],
    };
  },
});
