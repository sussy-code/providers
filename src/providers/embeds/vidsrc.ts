import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

const hlsURLRegex = /file:"(.*?)"/;
const setPassRegex = /var pass_path = "(.*set_pass\.php.*)";/;

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

    let setPassLink = html.match(setPassRegex)?.[1];
    if (!setPassLink) throw new Error('Unable to find set_pass.php link');

    if (setPassLink.startsWith('//')) {
      setPassLink = `https:${setPassLink}`;
    }

    // VidSrc uses a password endpoint to temporarily whitelist the user's IP. This is called in an interval by the player.
    // It currently has no effect on the player itself, the content plays fine without it.
    // In the future we might have to introduce hooks for the frontend to call this endpoint.
    await ctx.proxiedFetcher(setPassLink, {
      headers: {
        referer: ctx.url,
      },
    });

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
