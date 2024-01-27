import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

const hlsURLRegex = /file:"(.*?)"/;
const setPassRegex = /var pass_path = "(.*set_pass\.php.*)";/;

function formatHlsB64(data: string): string {
  const encodedB64 = data.replace(/\/@#@\/[^=/]+==/g, '');
  if (encodedB64.match(/\/@#@\/[^=/]+==/)) {
    return formatHlsB64(encodedB64);
  }
  return encodedB64;
}

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

    // When this eventually breaks see the player js @ pjs_main.js
    // If you know what youre doing and are slightly confused about how to reverse this feel free to reach out to ciaran_ds on discord with any queries
    let hlsMatch = html.match(hlsURLRegex)?.[1]?.slice(2);
    if (!hlsMatch) throw new Error('Unable to find HLS playlist');
    hlsMatch = formatHlsB64(hlsMatch);
    const finalUrl = atob(hlsMatch);
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
