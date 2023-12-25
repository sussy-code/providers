import { makeEmbed } from '@/providers/base';

const hlsURLRegex = /file:"(.*?)"/;

export const vidsrcembedScraper = makeEmbed({
  id: 'vidsrcembed', // VidSrc is both a source and an embed host
  name: 'VidSrc',
  rank: 197,
  async scrape(ctx) {
    if (!ctx.headers || (!ctx.headers.referer && !ctx.headers.Referer)) {
      throw new Error('VidSrc embeds require the referer header to be set');
    }
    const html = await ctx.proxiedFetcher<string>(ctx.url, {
      headers: ctx.headers,
    });

    const match = html
      .match(hlsURLRegex)?.[1]
      ?.replace(/(\/\/\S+?=)/g, '')
      .replace('#2', '');
    if (!match) throw new Error('Unable to find HLS playlist');
    const finalUrl = atob(match);

    if (!finalUrl.includes('.m3u8')) throw new Error('Unable to find HLS playlist');

    return {
      stream: {
        type: 'hls',
        playlist: finalUrl,
        flags: [],
        captions: [],
      },
    };
  },
});
