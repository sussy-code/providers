import { load } from 'cheerio';

export const baseUrl = 'https://tugaflix.best/';

export function parseSearch(page: string): { title: string; year?: number; url: string }[] {
  const results: { title: string; year?: number; url: string }[] = [];
  const $ = load(page);

  $('.items .poster').each((_, element) => {
    const $link = $(element).find('a');
    const url = $link.attr('href');
    // ex title: Home Alone (1990)
    const [, title, year] = $link.attr('title')?.match(/^(.*?)\s*(?:\((\d{4})\))?\s*$/) || [];
    if (!title || !url) return;

    // tiles dont always have the year
    results.push({ title, year: year ? parseInt(year, 10) : undefined, url });
  });

  return results;
}
