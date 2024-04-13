import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { warezcdnWorkerProxy } from '@/providers/sources/warezcdn/common';
import { EmbedScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { getDecryptedId } from './common';

const cdnListing = [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64];

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

export const warezcdnembedMp4Scraper = makeEmbed({
  id: 'warezcdnembedmp4', // WarezCDN is both a source and an embed host
  name: 'WarezCDN MP4',
  rank: 82,
  disabled: false,
  async scrape(ctx) {
    const decryptedId = await getDecryptedId(ctx);

    if (!decryptedId) throw new NotFoundError("can't get file id");

    const streamUrl = await checkUrls(ctx, decryptedId);

    if (!streamUrl) throw new NotFoundError("can't get stream id");

    return {
      stream: [
        {
          id: 'primary',
          captions: [],
          qualities: {
            unknown: {
              type: 'mp4',
              url: `${warezcdnWorkerProxy}/?${new URLSearchParams({
                url: streamUrl,
              })}`,
            },
          },
          type: 'file',
          flags: [flags.CORS_ALLOWED],
        },
      ],
    };
  },
});
