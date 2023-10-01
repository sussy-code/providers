// ! Types
interface BaseConfig {
  /** The website's slug. Formatted as `1839578-person-of-interest-2011` */
  slug: string;
  /** Type of request */
  type: 'show' | 'movie';
  /** Hash */
  hash: string;
  /** Hash expiry */
  expires: number;
}
interface TvConfig extends BaseConfig {
  /** Type of request */
  type: 'show';
  /** The episode ID for a TV show. Given in search and URL */
  episodeId: string;
}
interface MovieConfig extends BaseConfig {
  /** Type of request */
  type: 'movie';
  /** Movie's id */
  id_movie: string;
}
export type Config = MovieConfig | TvConfig;

export interface Result {
  title: string;
  slug: string;
  year: string;
  id_movie?: string;
}
