import { flags } from '@/main/targets';
import { makeEmbed } from '@/providers/base';
import { Caption } from '@/providers/captions';

type FPlayerResponse = {
  sourceUrls: string[];
  subtitleUrls: string;
};

export const smashyStreamFScraper = makeEmbed({
  id: 'smashystream-f',
  name: 'SmashyStream (F)',
  rank: 400,
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
              return {
                url: url.replace(',', ''),
                language,
                kind: 'subtitles',
                type: url.includes('.vtt') ? 'vtt' : 'srt',
                hasCorsRestrictions: false,
              };
            }
          }
          return null;
        })
        .filter((x): x is Caption => x !== null) ?? [];

    return {
      stream: {
        playlist: res.sourceUrls[0],
        type: 'hls',
        flags: [flags.NO_CORS],
        captions,
      },
    };
  },
});
