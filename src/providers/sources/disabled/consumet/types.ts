export interface SearchResult {
  id: string;
  title: string;
  image: string;
  releaseDate: string | null;
  subOrDub: 'sub' | 'dub';
}

export interface SearchResponse {
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  results: SearchResult[];
}

export interface Episode {
  id: string;
  number: number;
  url: string;
}

export interface InfoResponse {
  id: string;
  title: string;
  url: string;
  image: string;
  releaseDate: string | null;
  description: string | null;
  genres: string[];
  subOrDub: 'sub' | 'dub';
  type: string | null;
  status: string;
  otherName: string | null;
  totalEpisodes: number;
  episodes: Episode[];
}
