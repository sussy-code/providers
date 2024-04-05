import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

const linkRegex = /file: ?"(http.*?)"/;
// the white space charecters may seem useless, but without them it breaks
const tracksRegex = /\{file:\s"([^"]+)",\skind:\s"thumbnails"\}/g;

export const filelionsScraper = makeEmbed({
  id: 'filelions',
  name: 'filelions',
  rank: 115,
  async scrape(ctx) {
    const mainPageRes = await ctx.proxiedFetcher.full<string>(ctx.url, {
      headers: {
        referer: ctx.url,
      },
    });
    const mainPage = mainPageRes.body;
    const mainPageUrl = new URL(mainPageRes.finalUrl);

    const streamUrl = mainPage.match(linkRegex) ?? [];
    const thumbnailTrack = tracksRegex.exec(mainPage);

    const playlist = streamUrl[1];
    if (!playlist) throw new Error('Stream url not found');

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist,
          flags: [flags.IP_LOCKED, flags.CORS_ALLOWED],
          captions: [],
          ...(thumbnailTrack
            ? {
                thumbnailTrack: {
                  type: 'vtt',
                  url: mainPageUrl.origin + thumbnailTrack[1],
                },
              }
            : {}),
        },
      ],
    };
  },
});
