import { flags } from '@/../lib';
import { makeEmbed } from '@/providers/base';

const hlsURLRegex = /file:"(.*?)"/;

export const vidsrcembedScraper = makeEmbed({
  id: 'vidsrcembed', // VidSrc is both a source and an embed host
  name: 'VidSrc',
  rank: 197,
  async scrape(ctx) {
    const html = await ctx.proxiedFetcher<string>(ctx.url, {
      headers: {
        referer: ctx.url,
      },
    });

    const match = html
      .match(hlsURLRegex)?.[1]
      ?.replace(/(\/\/\S+?=)/g, '')
      .replace('#2', '');
    if (!match) throw new Error('Unable to find HLS playlist');
    const finalUrl = atob(match);

    if (!finalUrl.includes('.m3u8')) throw new Error('Unable to find HLS playlist');

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: finalUrl,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
