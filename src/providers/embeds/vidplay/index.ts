import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { Caption, getCaptionTypeFromUrl, labelToLanguageCode } from '@/providers/captions';

import { getFileUrl } from './common';
import { SubtitleResult, VidplaySourceResponse } from './types';

export const vidplayScraper = makeEmbed({
  id: 'vidplay',
  name: 'VidPlay',
  rank: 401,
  scrape: async (ctx) => {
    const fileUrl = await getFileUrl(ctx);
    const fileUrlRes = await ctx.proxiedFetcher<VidplaySourceResponse>(fileUrl, {
      headers: {
        referer: ctx.url,
      },
    });
    if (typeof fileUrlRes.result === 'number') throw new Error('File not found');
    const source = fileUrlRes.result.sources[0].file;

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
          playlist: source,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});
