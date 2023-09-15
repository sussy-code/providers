import type { CheerioAPI } from 'cheerio';

export async function getEpisodes(dramaPage: CheerioAPI) {
  const episodesEl = dramaPage('tbody tr:not(:first-child)');

  return episodesEl
    .toArray()
    .map((ep) => {
      const number = dramaPage(ep).find('td.episodeSub a').text().split('Episode')[1]?.trim();
      const url = dramaPage(ep).find('td.episodeSub a').attr('href');
      return { number, url };
    })
    .filter((e) => !!e.url);
}
