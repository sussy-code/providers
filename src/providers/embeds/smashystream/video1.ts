import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { Caption, getCaptionTypeFromUrl, labelToLanguageCode } from '@/providers/captions';
import { NotFoundError } from '@/utils/errors';

type FPlayerResponse = {
  sourceUrls: string[];
  subtitles: string | null;
};

// if you don't understand how this is reversed
// check https://discord.com/channels/871713465100816424/1186646348137775164/1225644477188935770
// feel free to reach out atpn or ciaran_ds on discord if you've any problems
function decode(str: string): string {
  const b = ['U0ZML2RVN0IvRGx4', 'MGNhL0JWb0kvTlM5', 'Ym94LzJTSS9aU0Zj', 'SGJ0L1dGakIvN0dX', 'eE52L1QwOC96N0Yz'];
  let formatedB64 = str.slice(2);
  for (let i = 4; i > -1; i--) {
    formatedB64 = formatedB64.replace(`//${b[i]}`, '');
  }
  return atob(formatedB64);
}

export const smashyStreamFScraper = makeEmbed({
  id: 'smashystream-f',
  name: 'SmashyStream (F)',
  rank: 71,
  async scrape(ctx) {
    const res = await ctx.proxiedFetcher<FPlayerResponse>(ctx.url, {
      headers: {
        Referer: ctx.url,
      },
    });

    if (!res.sourceUrls[0]) throw new NotFoundError('No watchable item found');

    const playlist = decode(res.sourceUrls[0]);
    if (!playlist.includes('.m3u8')) throw new Error('Failed to decode');

    const captions: Caption[] =
      res.subtitles
        ?.match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/g)
        ?.map<Caption | null>((entry: string) => {
          const match = entry.match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/);
          if (match) {
            const [, language, url] = match;
            if (language && url) {
              const languageCode = labelToLanguageCode(language.replace(/ - .*/, ''));
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
          playlist,
          type: 'hls',
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});
