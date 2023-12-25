import { flags } from '@/main/targets';
import { makeSourcerer } from '@/providers/base';
import { scrapeMovie } from '@/providers/sources/vidsrc/scrape-movie';
import { scrapeShow } from '@/providers/sources/vidsrc/scrape-show';

export const vidsrcScraper = makeSourcerer({
  id: 'vidsrc',
  name: 'VidSrc',
  rank: 120,
  flags: [flags.NO_CORS],
  scrapeMovie,
  scrapeShow,
});
