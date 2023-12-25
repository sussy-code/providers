import { flags } from '@/main/targets';
import { makeSourcerer } from '@/providers/base';
import { scrapeMovie } from '@/providers/sources/zoechip/scrape-movie';
import { scrapeShow } from '@/providers/sources/zoechip/scrape-show';

export const zoechipScraper = makeSourcerer({
  id: 'zoechip',
  name: 'ZoeChip',
  rank: 200,
  flags: [flags.NO_CORS],
  scrapeMovie,
  scrapeShow,
});
