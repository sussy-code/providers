import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { scrapeMovie } from '@/providers/sources/zoechip/scrape-movie';
import { scrapeShow } from '@/providers/sources/zoechip/scrape-show';

export const zoechipScraper = makeSourcerer({
  id: 'zoechip',
  name: 'ZoeChip',
  rank: 62,
  flags: [flags.CORS_ALLOWED],
  disabled: true,
  scrapeMovie,
  scrapeShow,
});
