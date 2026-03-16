interface Episode {
  id: string;
  name: string;
  editedName: string | null;
  released: string;
  titlePt: string;
  rating: string;
  runtime: string;
  airdate: string;
}

interface Season {
  id: string;
  name: string;
  episodesCount: number;
  episodes: Record<string, Episode>;
}

export interface cachedSeasonsRes {
  seasonCount: number;
  seasons: Record<string, Season>;
}
