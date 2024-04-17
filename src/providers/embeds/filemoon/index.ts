import { load } from 'cheerio';
import { unpack } from 'unpacker';

import { SubtitleResult } from './types';
import { makeEmbed } from '../../base';
import { Caption, getCaptionTypeFromUrl, labelToLanguageCode } from '../../captions';

const evalCodeRegex = /eval\((.*)\)/g;
const fileRegex = /file:"(.*?)"/g;

export const fileMoonScraper = makeEmbed({
  id: 'filemoon',
  name: 'Filemoon',
  rank: 300,
  scrape: async (ctx) => {
    const embedRes = await ctx.proxiedFetcher<string>(ctx.url, {
      headers: {
        referer: ctx.url,
      },
    });
    const embedHtml = load(embedRes);
    const evalCode = embedHtml('script').text().match(evalCodeRegex);
    if (!evalCode) throw new Error('Failed to find eval code');
    const unpacked = unpack(evalCode[0]);
    const file = fileRegex.exec(unpacked);
    if (!file?.[1]) throw new Error('Failed to find file');

    const url = new URL(ctx.url);
    const subtitlesLink = url.searchParams.get('sub.info');
    const captions: Caption[] = [];
    if (subtitlesLink) {
      const captionsResult = await ctx.proxiedFetcher<SubtitleResult>(subtitlesLink);

      for (const caption of captionsResult) {
        const language = labelToLanguageCode(caption.label);
        const captionType = getCaptionTypeFromUrl(caption.file);
        if (!language || !captionType) continue;
        captions.push({
          id: caption.file,
          url: caption.file,
          type: captionType,
          language,
          hasCorsRestrictions: false,
        });
      }
    }

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: file[1],
          flags: [],
          captions,
        },
      ],
    };
  },
});
