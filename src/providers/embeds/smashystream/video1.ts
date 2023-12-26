import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { Caption, getCaptionTypeFromUrl, labelToLanguageCode } from '@/providers/captions';

type FPlayerResponse = {
  sourceUrls: string[];
  subtitleUrls: string;
};

export const smashyStreamFScraper = makeEmbed({
  id: 'smashystream-f',
  name: 'SmashyStream (F)',
  rank: 70,
  async scrape(ctx) {
    const res = await ctx.proxiedFetcher<FPlayerResponse>(ctx.url, {
      headers: {
        Referer: ctx.url,
      },
    });

    const captions: Caption[] =
      res.subtitleUrls
        .match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/g)
        ?.map<Caption | null>((entry: string) => {
          const match = entry.match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/);
          if (match) {
            const [, language, url] = match;
            if (language && url) {
              const languageCode = labelToLanguageCode(language);
              const captionType = getCaptionTypeFromUrl(url);
              if (!languageCode || !captionType) return null;
              return {
                id: url,
                url: url.replace(',', ''),
                language: languageCode,
                type: captionType,
                hasCorsRestrictions: false,
              };
            }
          }
          return null;
        })
        .filter((x): x is Caption => x !== null) ?? [];

    return {
      stream: [
        {
          id: 'primary',
          playlist: res.sourceUrls[0],
          type: 'hls',
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});
