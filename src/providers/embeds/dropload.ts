import { unpack } from 'unpacker';

import { flags } from '@/entrypoint/utils/targets';

import { makeEmbed } from '../base';

const evalCodeRegex = /eval\((.*)\)/g;
const fileRegex = /file:"(.*?)"/g;
const tracksRegex = /\{file:"([^"]+)",kind:"thumbnails"\}/g;

export const droploadScraper = makeEmbed({
  id: 'dropload',
  name: 'Dropload',
  rank: 120,
  scrape: async (ctx) => {
    const mainPageRes = await ctx.proxiedFetcher.full<string>(ctx.url, {
      headers: {
        referer: ctx.url,
      },
    });
    const mainPageUrl = new URL(mainPageRes.finalUrl);
    const mainPage = mainPageRes.body;

    const evalCode = mainPage.match(evalCodeRegex);
    if (!evalCode) throw new Error('Failed to find eval code');
    const unpacked = unpack(evalCode[1]);

    const file = fileRegex.exec(unpacked);
    const thumbnailTrack = tracksRegex.exec(unpacked);
    if (!file?.[1]) throw new Error('Failed to find file');

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: file[1],
          flags: [flags.IP_LOCKED, flags.CORS_ALLOWED],
          captions: [],
          ...(thumbnailTrack
            ? {
                thumbnailTrack: {
                  type: 'vtt',
                  url: mainPageUrl.origin + thumbnailTrack[1],
                },
              }
            : {}),
        },
      ],
    };
  },
});
