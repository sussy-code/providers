import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

export default async function getStream(
  ctx: ShowScrapeContext | MovieScrapeContext,
  file: string,
  key: string,
): Promise<any> {
  const f = file as string;
  const path = `${f.slice(1)}.txt`;
  try {
    const baseUrl = 'https://ftmoh345xme.com';
    const headers = {
      Origin: 'https://friness-cherlormur-i-275.site',
      Referer: 'https://google.com/',
      Dnt: '1',
      'X-Csrf-Token': key,
    };
    const url = `${baseUrl}/playlist/${path}`;
    const result = await ctx.proxiedFetcher(url, {
      headers: {
        ...headers,
      },
      method: 'GET',
    });

    return {
      success: true,
      data: {
        link: result,
      },
    };
  } catch (error) {
    throw new NotFoundError('Failed to fetch stream data');
  }
}
