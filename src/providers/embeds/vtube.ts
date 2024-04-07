import { load } from 'cheerio';
import { unpack } from 'unpacker';

import { flags } from '@/entrypoint/utils/targets';

import { makeEmbed } from '../base';

const evalCodeRegex = /eval\((.*)\)/g;
const fileRegex = /file:"(.*?)"/g;
const tracksRegex = /\{file:"([^"]+)",kind:"thumbnails"\}/g;

export const vTubeScraper = makeEmbed({
  id: 'vtube',
  name: 'vTube',
  rank: 145,
  scrape: async (ctx) => {
    const mainPageRes = await ctx.proxiedFetcher.full<string>(ctx.url, {
      headers: {
        referer: ctx.url,
      },
    });
    const mainPage = mainPageRes.body;
    const html = load(mainPage);
    const evalCode = html('script').text().match(evalCodeRegex);
    if (!evalCode) throw new Error('Failed to find eval code');
    const unpacked = unpack(evalCode?.toString());
    const file = fileRegex.exec(unpacked);
    const thumbnailTrack = tracksRegex.exec(unpacked);
    if (!file?.[1]) throw new Error('Failed to find file');

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: file[1],
          flags: [flags.CORS_ALLOWED],
          captions: [],
          ...(thumbnailTrack
            ? {
                thumbnailTrack: {
                  type: 'vtt',
                  url: new URL(mainPageRes.finalUrl).origin + thumbnailTrack[1],
                },
              }
            : {}),
        },
      ],
    };
  },
});
