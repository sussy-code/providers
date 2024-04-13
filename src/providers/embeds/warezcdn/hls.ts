import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { EmbedScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { getDecryptedId } from './common';

// Method found by atpn
async function getVideowlUrlStream(ctx: EmbedScrapeContext, decryptedId: string) {
  const sharePage = await ctx.proxiedFetcher<string>('https://cloud.mail.ru/public/uaRH/2PYWcJRpH');
  const regex = /"videowl_view":\{"count":"(\d+)","url":"([^"]+)"\}/g;
  const videowlUrl = regex.exec(sharePage)?.[2];

  if (!videowlUrl) throw new NotFoundError('Failed to get videoOwlUrl');

  return `${videowlUrl}/0p/${btoa(decryptedId)}.m3u8?${new URLSearchParams({
    double_encode: '1',
  })}`;
}

export const warezcdnembedHlsScraper = makeEmbed({
  id: 'warezcdnembedhls', // WarezCDN is both a source and an embed host
  name: 'WarezCDN HLS',
  rank: 83,
  async scrape(ctx) {
    const decryptedId = await getDecryptedId(ctx);

    if (!decryptedId) throw new NotFoundError("can't get file id");

    const streamUrl = await getVideowlUrlStream(ctx, decryptedId);

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          flags: [flags.IP_LOCKED],
          captions: [],
          playlist: streamUrl,
        },
      ],
    };
  },
});
