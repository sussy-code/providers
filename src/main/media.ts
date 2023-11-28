export type CommonMedia = {
  title: string;
  releaseYear: number;
  imdbId?: string;
  tmdbId: string;
};

export type MediaTypes = 'show' | 'movie';

export type ShowMedia = CommonMedia & {
  type: 'show';
  totalSeasons: number;
  episode: {
    number: number;
    tmdbId: string;
  };
  season: {
    number: number;
    tmdbId: string;
  };
};

export type MovieMedia = CommonMedia & {
  type: 'movie';
};

export interface IMovieResult {
  id: string;
  title: string;
  url?: string;
  image?: string;
  year?: string;
  type?: MediaTypes;
  [x: string]: unknown;
}

export type ScrapeMedia = ShowMedia | MovieMedia;
