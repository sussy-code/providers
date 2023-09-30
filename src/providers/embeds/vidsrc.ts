import { flags } from '@/main/targets';
import { makeEmbed } from '@/providers/base';

const hlsURLRegex = /var hls_url = "(.*?)";/;
const setPassRegex = /var path = "(.*set_pass\.php.*)";/;

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

    let regexResult = html.match(setPassRegex);
    if (!regexResult) {
      throw new Error('Unable to find VidSrc set_pass.php link');
    }

    let setPassLink = regexResult[1];

    if (setPassLink.startsWith('//')) {
      setPassLink = `https:${setPassLink}`;
    }

    regexResult = html.match(hlsURLRegex);
    if (!regexResult) {
      throw new Error('Unable to find VidSrc HLS stream');
    }

    // Must call set_pass.php BEFORE using the stream
    await fetch(setPassLink, {
      headers: {
        referer: ctx.url,
      },
    });

    return {
      stream: {
        type: 'hls',
        playlist: regexResult[1],
        flags: [flags.NO_CORS],
      },
    };
  },
});
