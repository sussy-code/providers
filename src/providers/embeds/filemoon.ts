import { unpack } from 'unpacker';

import { flags } from '@/entrypoint/utils/targets';

import { makeEmbed } from '../base';

const evalCodeRegex = /eval\((.*)\)/g;
const fileRegex = /file:"(.*?)"/g;

export const fileMoonScraper = makeEmbed({
  id: 'filemoon',
  name: 'FileMoon',
  rank: 501,
  scrape: async (ctx) => {
    const embedRes = await ctx.fetcher<string>(ctx.url);
    const evalCode = evalCodeRegex.exec(embedRes);
    if (!evalCode) throw new Error('Failed to find eval code');
    const unpacked = unpack(evalCode[1]);
    const file = fileRegex.exec(unpacked);
    if (!file?.[1]) throw new Error('Failed to find file');

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: file[1],
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
