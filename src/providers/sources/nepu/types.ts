export type SearchResults = {
  data: {
    id: number;
    name: string;
    second_name: string;
    url: string;
    type: 'Movie' | 'Serie';
  }[];
};
