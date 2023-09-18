import { mp4uploadScraper } from '@/providers/embeds/mp4upload';
import { streamsbScraper } from '@/providers/embeds/streamsb';

export const kissasianBase = 'https://kissasian.shp';

export const embedProviders = [
  {
    type: mp4uploadScraper.id,
    id: 'mp',
  },
  {
    type: streamsbScraper.id,
    id: 'sb',
  },
];
