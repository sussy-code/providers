import { MovieMedia, ShowMedia } from '@/entrypoint/utils/media';
import { UseableFetcher } from '@/fetchers/types';

export type ScrapeContext = {
  proxiedFetcher: {
    <T>(...params: Parameters<UseableFetcher<T>>): ReturnType<UseableFetcher<T>>;
    full<T>(...params: Parameters<UseableFetcher<T>['full']>): ReturnType<UseableFetcher<T>['full']>;
  };
  fetcher: {
    <T>(...params: Parameters<UseableFetcher<T>>): ReturnType<UseableFetcher<T>>;
    full<T>(...params: Parameters<UseableFetcher<T>['full']>): ReturnType<UseableFetcher<T>['full']>;
  };
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
