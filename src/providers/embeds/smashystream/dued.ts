import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

type DPlayerSourcesResponse = {
  title: string;
  id: string;
  file: string;
}[];

export const smashyStreamDScraper = makeEmbed({
  id: 'smashystream-d',
  name: 'SmashyStream (D)',
  rank: 71,
  async scrape(ctx) {
    const mainPageRes = await ctx.proxiedFetcher<string>(ctx.url, {
      headers: {
        Referer: ctx.url,
      },
    });
    const mainPageRes$ = load(mainPageRes);
    const iframeUrl = mainPageRes$('iframe').attr('src');
    if (!iframeUrl) throw new Error(`[${this.name}] failed to find iframe url`);
    const mainUrl = new URL(iframeUrl);
    const iframeRes = await ctx.proxiedFetcher<string>(iframeUrl, {
      headers: {
        Referer: ctx.url,
      },
    });
    const textFilePath = iframeRes.match(/"file":"([^"]+)"/)?.[1];
    const csrfToken = iframeRes.match(/"key":"([^"]+)"/)?.[1];
    if (!textFilePath || !csrfToken) throw new Error(`[${this.name}] failed to find text file url or token`);
    const textFileUrl = `${mainUrl.origin}${textFilePath}`;
    const textFileRes = await ctx.proxiedFetcher<DPlayerSourcesResponse>(textFileUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-TOKEN': csrfToken,
        Referer: iframeUrl,
      },
    });
    // Playlists in Hindi, English, Tamil and Telugu are available. We only get the english one.
    const textFilePlaylist = textFileRes.find((x) => x.title === 'English')?.file;
    if (!textFilePlaylist) throw new Error(`[${this.name}] failed to find an english playlist`);

    const playlistRes = await ctx.proxiedFetcher<string>(
      `${mainUrl.origin}/playlist/${textFilePlaylist.slice(1)}.txt`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRF-TOKEN': csrfToken,
          Referer: iframeUrl,
        },
      },
    );

    return {
      stream: [
        {
          id: 'primary',
          playlist: playlistRes,
          type: 'hls',
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
