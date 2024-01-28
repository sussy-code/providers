export type EmbedsResult = { embedId: string; url: string }[];

export interface Result {
  title: string;
  slug: string;
  year: string;
  type: string;
  id_movie?: string;
  id_show?: string;
}
