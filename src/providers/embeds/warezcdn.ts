import { makeEmbed } from '@/providers/base';
import { warezcdnPlayerBase } from '@/providers/sources/warezcdn/common';
import { EmbedScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { Stream } from '../streams';

const cdnListing = [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64];

function decrypt(input: string) {
  let output = atob(input);

  // Remove leading and trailing whitespaces
  output = output.trim();

  // Reverse the string
  output = output.split('').reverse().join('');

  // Get the last 5 characters and reverse them
  let last = output.slice(-5);
  last = last.split('').reverse().join('');

  // Remove the last 5 characters from the original string
  output = output.slice(0, -5);

  // Return the original string concatenated with the reversed last 5 characters
  return `${output}${last}`;
}

async function checkUrls(ctx: EmbedScrapeContext, fileId: string) {
  for (const id of cdnListing) {
    const url = `https://cloclo${id}.cloud.mail.ru/weblink/view/${fileId}`;
    const response = await ctx.proxiedFetcher.full(url, {
      method: 'GET',
      headers: {
        Range: 'bytes=0-1',
      },
    });
    if (response.statusCode === 206) return url;
  }
  return null;
}

async function getVideoOwlStream(ctx: EmbedScrapeContext, decryptedId: string) {
  const sharePage = await ctx.proxiedFetcher('https://cloud.mail.ru/public/uaRH/2PYWcJRpH');

  const cloudSettings = sharePage.match(/window\.cloudSettings=(\{.*?\})<\/script>/)?.[1];
  if (!cloudSettings) throw new NotFoundError('Failed to get cloudSettings');

  const parsedCloudSettings = JSON.parse(JSON.stringify(cloudSettings));

  console.log(parsedCloudSettings);

  const videoOwlUrl = parsedCloudSettings.dispatcher.videowl_view.url;
  if (!videoOwlUrl) throw new NotFoundError('Failed to get videoOwlUrl');

  return `${videoOwlUrl}/${btoa(decryptedId)}.m3u8?${new URLSearchParams({
    double_encode: '1',
  })}`;
}

async function getStream(ctx: EmbedScrapeContext, decryptedId: string): Promise<Stream> {
  try {
    const streamUrl = await getVideoOwlStream(ctx, decryptedId);
    console.log(streamUrl);
    return {
      id: 'primary',
      type: 'hls',
      flags: [],
      captions: [],
      playlist: streamUrl,
    };
  } catch (err) {
    console.error(err);
    const streamUrl = await checkUrls(ctx, decryptedId);
    return {
      id: 'primary',
      type: 'file',
      flags: [],
      captions: [],
      qualities: {
        unknown: {
          type: 'mp4',
          url: streamUrl!,
        },
      },
    };
  }
}

export const warezcdnembedScraper = makeEmbed({
  id: 'warezcdnembed', // WarezCDN is both a source and an embed host
  name: 'WarezCDN',
  rank: 82,
  async scrape(ctx) {
    const page = await ctx.proxiedFetcher<string>(`/player.php?${new URLSearchParams({ id: ctx.url })}`, {
      baseUrl: warezcdnPlayerBase,
      headers: {
        Referer: `${warezcdnPlayerBase}/getEmbed.php?${new URLSearchParams({
          id: ctx.url,
          sv: 'warezcdn',
        })}`,
      },
    });
    const allowanceKey = page.match(/let allowanceKey = "(.*?)";/)?.[1];
    if (!allowanceKey) throw new NotFoundError('Failed to get allowanceKey');

    const streamData = await ctx.proxiedFetcher('/functions.php', {
      baseUrl: warezcdnPlayerBase,
      method: 'POST',
      body: new URLSearchParams({
        getVideo: ctx.url,
        key: allowanceKey,
      }),
    });
    const stream = JSON.parse(streamData);

    if (!stream.id) throw new NotFoundError("can't get stream id");

    const decryptedId = decrypt(stream.id);

    if (!decryptedId) throw new NotFoundError("can't get file id");

    return {
      stream: [await getStream(ctx, decryptedId)],
    };
  },
});
