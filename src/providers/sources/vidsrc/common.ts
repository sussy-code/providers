import { MovieMedia, ShowMedia } from '@/main/media';
import { ScrapeContext } from '@/utils/context';

export const vidsrcBase = 'https://vidsrc.me';
export const vidsrcRCPBase = 'https://rcp.vidsrc.me';

export type MovieContext = ScrapeContext & {
  media: MovieMedia;
};

export type ShowContext = ScrapeContext & {
  media: ShowMedia;
};
