import { ScrapeContext } from '@/utils/context';

export const warezcdnBase = 'https://embed.warezcdn.com';
export const warezcdnApiBase = 'https://warezcdn.com/embed';
export const warezcdnPlayerBase = 'https://warezcdn.com/player';
export const warezcdnWorkerProxy = 'https://workerproxy.warezcdn.workers.dev';

export async function getExternalPlayerUrl(ctx: ScrapeContext, embedId: string, embedUrl: string) {
  const params = {
    id: embedUrl,
    sv: embedId,
  };
  const realUrl = await ctx.proxiedFetcher<string>(`/getPlay.php`, {
    baseUrl: warezcdnApiBase,
    headers: {
      Referer: `${warezcdnApiBase}/getEmbed.php?${new URLSearchParams(params)}`,
    },
    query: params,
  });

  const realEmbedUrl = realUrl.match(/window\.location\.href="([^"]*)";/);
  if (!realEmbedUrl) throw new Error('Could not find embed url');
  return realEmbedUrl[1];
}
