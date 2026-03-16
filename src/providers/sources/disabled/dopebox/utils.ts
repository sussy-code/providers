export const BASE_URL = 'https://dopebox.to';
export const SEARCH_URL = `${BASE_URL}/search/`;
export const SEASONS_URL = `${BASE_URL}/ajax/season/list/`; // <media-id>
export const EPISODES_URL = `${BASE_URL}/ajax/season/episodes/`; // <season-id>
export const SHOW_SERVERS_URL = `${BASE_URL}/ajax/episode/servers/`; // <episode-id>
export const MOVIE_SERVERS_URL = `${BASE_URL}/ajax/episode/list/`; // <media-id>
export const FETCH_EMBEDS_URL = `${BASE_URL}/ajax/episode/sources/`;
export const FETCH_SOURCES_URL = 'https://streameeeeee.site/embed-1/v3/e-1/getSources';

export const CLIENT_KEY_PATTERN_1 =
  /window\._lk_db\s*?=\s*?{\s*?x:\s*?"(\w+)?",\s*?y:\s*?"(\w+)?",\s*?z:\s*?"(\w+)?"\s*?}/;
export const CLIENT_KEY_PATTERN_2 = /window\._xy_ws\s*?=\s*?"(\w+)?"/;
export const CLIENT_KEY_PATTERN_3 = /\s*?_is_th:\s*?(\w+)\s*?/;

export function getSearchQuery(title: string): string {
  return title.trim().split(' ').join('-').toLowerCase();
}
