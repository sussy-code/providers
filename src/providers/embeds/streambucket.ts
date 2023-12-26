import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

// StreamBucket makes use of https://github.com/nicxlau/hunter-php-javascript-obfuscator

const hunterRegex = /eval\(function\(h,u,n,t,e,r\).*?\("(.*?)",\d*?,"(.*?)",(\d*?),(\d*?),\d*?\)\)/;
const linkRegex = /file:"(.*?)"/;

// This is a much more simple and optimized version of the "h,u,n,t,e,r"
// obfuscation algorithm. It's just basic chunked+mask encoding.
// I have seen this same encoding used on some sites under the name
// "p,l,a,y,e,r" as well
function decodeHunter(encoded: string, mask: string, charCodeOffset: number, delimiterOffset: number) {
  // The encoded string is made up of 'n' number of chunks.
  // Each chunk is separated by a delimiter inside the mask.
  // This offset is also used as the exponentiation base in
  // the charCode calculations
  const delimiter = mask[delimiterOffset];

  // Split the 'encoded' string into chunks using the delimiter,
  // and filter out any empty chunks.
  const chunks = encoded.split(delimiter).filter((chunk) => chunk);

  // Decode each chunk and concatenate the results to form the final 'decoded' string.
  const decoded = chunks
    .map((chunk) => {
      // Chunks are in reverse order. 'reduceRight' removes the
      // need to 'reverse' the array first
      const charCode = chunk.split('').reduceRight((c, value, index) => {
        // Calculate the character code for each character in the chunk.
        // This involves finding the index of 'value' in the 'mask' and
        // multiplying it by (delimiterOffset^position).
        return c + mask.indexOf(value) * delimiterOffset ** (chunk.length - 1 - index);
      }, 0);

      // The actual character code is offset by the given amount
      return String.fromCharCode(charCode - charCodeOffset);
    })
    .join('');

  return decoded;
}

export const streambucketScraper = makeEmbed({
  id: 'streambucket',
  name: 'StreamBucket',
  rank: 196,
  // TODO - Disabled until ctx.fetcher and ctx.proxiedFetcher don't trigger bot detection
  disabled: true,
  async scrape(ctx) {
    // Using the context fetchers make the site return just the string "No bots please!"?
    // TODO - Fix this. Native fetch does not trigger this. No idea why right now
    const response = await fetch(ctx.url);
    const html = await response.text();

    // This is different than the above mentioned bot detection
    if (html.includes('captcha-checkbox')) {
      // TODO - This doesn't use recaptcha, just really basic "image match". Maybe could automate?
      throw new Error('StreamBucket got captchaed');
    }

    let regexResult = html.match(hunterRegex);

    if (!regexResult) {
      throw new Error('Failed to find StreamBucket hunter JavaScript');
    }

    const encoded = regexResult[1];
    const mask = regexResult[2];
    const charCodeOffset = Number(regexResult[3]);
    const delimiterOffset = Number(regexResult[4]);

    if (Number.isNaN(charCodeOffset)) {
      throw new Error('StreamBucket hunter JavaScript charCodeOffset is not a valid number');
    }

    if (Number.isNaN(delimiterOffset)) {
      throw new Error('StreamBucket hunter JavaScript delimiterOffset is not a valid number');
    }

    const decoded = decodeHunter(encoded, mask, charCodeOffset, delimiterOffset);

    regexResult = decoded.match(linkRegex);

    if (!regexResult) {
      throw new Error('Failed to find StreamBucket HLS link');
    }

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: regexResult[1],
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
