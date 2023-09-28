import * as unpacker from 'unpacker';

import { flags } from '@/main/targets';
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

    if (packed) {
      const unpacked = unpacker.unpack(packed[1]);
      const link = unpacked.match(linkRegex);

      if (link) {
        const url = link[1];
        return {
          stream: {
            type: 'file',
            flags: [flags.NO_CORS],
            qualities: {
              // TODO - Allow unknown qualitys?
              // MixDrop does not give quality info
              // This is just so it's even visible
              '1080': {
                type: 'mp4',
                url: url.startsWith('http') ? url : `https:${url}`, // URLs don't always start with the protocol
                headers: {
                  // MixDrop requires this header on all streams
                  Referer: 'https://mixdrop.co/',
                },
              },
            },
          },
        };
      }
    }

    throw new Error('mixdrop source not found');
  },
});
