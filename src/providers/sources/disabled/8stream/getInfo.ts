import * as cheerio from 'cheerio';

import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

export default async function getStream(ctx: ShowScrapeContext | MovieScrapeContext, id: string): Promise<any> {
  try {
    const baseUrl = 'https://ftmoh345xme.com';
    const headers = {
      Origin: 'https://friness-cherlormur-i-275.site',
      Referer: 'https://google.com/',
      Dnt: '1',
    };
    const url = `${baseUrl}/play/${id}`;
    const result = await ctx.proxiedFetcher(url, {
      headers: {
        ...headers,
      },
      method: 'GET',
    });
    const $ = cheerio.load(result);
    const script = $('script').last().html()!;
    if (!script) {
      throw new NotFoundError('Failed to extract script data');
    }
    const content = script.match(/(\{[^;]+});/)?.[1] || script.match(/\((\{.*\})\)/)?.[1];
    if (!content) {
      throw new NotFoundError('Media not found');
    }
    const data = JSON.parse(content);
    let file = data.file;
    if (!file) {
      throw new NotFoundError('File not found');
    }
    if (file.startsWith('/')) {
      file = baseUrl + file;
    }
    const key = data.key;
    const headers2 = {
      Origin: 'https://friness-cherlormur-i-275.site',
      Referer: 'https://google.com/',
      Dnt: '1',
      'X-Csrf-Token': key,
    };
    const PlayListRes = await ctx.proxiedFetcher(file, {
      headers: {
        ...headers2,
      },
      method: 'GET',
    });
    const playlist = PlayListRes;
    return {
      success: true,
      data: {
        playlist,
        key,
      },
    };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new NotFoundError('Failed to fetch media info');
  }
}
