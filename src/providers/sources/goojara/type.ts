export const baseUrl = 'https://www.goojara.to';

export const baseUrl2 = 'https://ww1.goojara.to';

export type EmbedsResult = { embedId: string; url: string }[];

export interface Result {
  title: string;
  slug: string;
  year: string;
  type: string;
  id_movie?: string;
  id_show?: string;
}
