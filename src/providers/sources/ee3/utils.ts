import { load } from 'cheerio';

import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { parseSetCookie } from '@/utils/cookie';

import { baseUrl } from './common';

export async function login(
  user: string,
  pass: string,
  ctx: ShowScrapeContext | MovieScrapeContext,
): Promise<string | null> {
  const req = await ctx.proxiedFetcher.full<string>('/login', {
    baseUrl,
    method: 'POST',
    body: new URLSearchParams({ user, pass, action: 'login' }),
    readHeaders: ['Set-Cookie'],
  });

  const cookies = parseSetCookie(req.headers.get('Set-Cookie') || '');

  return cookies.PHPSESSID.value;
}

export function parseSearch(body: string): { title: string; year: number; id: string }[] {
  const result: { title: string; year: number; id: string }[] = [];

  const $ = load(body);
  $('div').each((_, element) => {
    const title = $(element).find('.title').text().trim();
    const year = parseInt($(element).find('.details span').first().text().trim(), 10);
    const id = $(element).find('.control-buttons').attr('data-id');

    if (title && year && id) {
      result.push({ title, year, id });
    }
  });

  return result;
}
