export type CommonMedia = {
  title: string;
  releaseYear: number;
  imdbId?: string;
  tmdbId: string;
};

export type MediaTypes = 'show' | 'movie';

export type ShowMedia = CommonMedia & {
  type: 'show';
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

export type ScrapeMedia = ShowMedia | MovieMedia;
