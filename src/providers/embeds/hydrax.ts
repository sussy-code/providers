import { makeEmbed } from '@/providers/base';

export const hydraxScraper = makeEmbed({
  id: 'hydrax',
  name: 'Hydrax',
  rank: 250,
  async scrape(ctx) {
    // ex-url: https://hihihaha1.xyz/?v=Lgd2uuuTS7
    const embed = await ctx.proxiedFetcher<string>(ctx.url);

    const match = embed.match(/PLAYER\(atob\("(.*?)"/);
    if (!match?.[1]) throw new Error('No Data Found');

    ctx.progress(50);

    const qualityMatch = embed.match(/({"pieceLength.+?})/);
    let qualityData: { pieceLength?: string; sd?: string[]; mHd?: string[]; hd?: string[]; fullHd?: string[] } = {};
    if (qualityMatch?.[1]) qualityData = JSON.parse(qualityMatch[1]);

    const data: { id: string; domain: string } = JSON.parse(atob(match[1]));
    if (!data.id || !data.domain) throw new Error('Required values missing');

    const domain = new URL((await ctx.proxiedFetcher.full(`https://${data.domain}`)).finalUrl).hostname;

    ctx.progress(100);

    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
          qualities: {
            ...(qualityData?.fullHd && {
              1080: {
                type: 'mp4',
                url: `https://${domain}/whw${data.id}`,
              },
            }),
            ...(qualityData?.hd && {
              720: {
                type: 'mp4',
                url: `https://${domain}/www${data.id}`,
              },
            }),
            ...(qualityData?.mHd && {
              480: {
                type: 'mp4',
                url: `https://${domain}/${data.id}`,
              },
            }),
            360: {
              type: 'mp4',
              url: `https://${domain}/${data.id}`,
            },
          },
          headers: {
            Referer: ctx.url.replace(new URL(ctx.url).hostname, 'abysscdn.com'),
          },
          captions: [],
          flags: [],
        },
      ],
    };
  },
});
