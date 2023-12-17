import { UseableFetcher } from '@/fetchers/types';
import { MovieMedia, ShowMedia } from '@/main/media';

export type ScrapeContext = {
  proxiedFetcher: <T>(...params: Parameters<UseableFetcher<T>>) => ReturnType<UseableFetcher<T>>;
  fetcher: <T>(...params: Parameters<UseableFetcher<T>>) => ReturnType<UseableFetcher<T>>;
  progress(val: number): void;
};

export type EmbedInput = {
  url: string;
};

export type EmbedScrapeContext = EmbedInput & ScrapeContext;

export type MovieScrapeContext = ScrapeContext & {
  media: MovieMedia;
};

export type ShowScrapeContext = ScrapeContext & {
  media: ShowMedia;
};
