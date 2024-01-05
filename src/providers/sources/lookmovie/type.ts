import { MovieMedia } from '@/entrypoint/utils/media';

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

export interface episodeObj {
  season: string;
  episode: string;
  id: string;
}

export interface ShowDataResult {
  episodes: episodeObj[];
}

interface VideoSources {
  [key: string]: string;
}

interface VideoSubtitles {
  id?: number;
  id_movie?: number;
  url: string;
  language: string;
  shard?: string;
}

export interface StreamsDataResult {
  streams: VideoSources;
  subtitles: VideoSubtitles[];
}

export interface ResultItem {
  title: string;
  slug: string;
  year: string;
  id_movie: string;
  id_show: string;
}

export interface Result {
  title(media: MovieMedia, title: any, arg2: number): boolean;
  year(year: any): number | undefined;
  id_movie: any;
  id_show: string;
  items: ResultItem[];
}
