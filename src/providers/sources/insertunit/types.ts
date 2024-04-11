export interface Subtitle {
  url: string;
  name: string;
}

export interface Episode {
  episode: string;
  id: number;
  videoKey: string;
  hls: string;
  audio: {
    names: string[];
    order: number[];
  };
  cc: Subtitle[];
  duration: number;
  title: string;
  download: string;
  sections: string[];
  poster: string;
  preview: {
    src: string;
  };
}

export interface Season {
  season: number;
  blocked: boolean;
  episodes: Episode[];
}
