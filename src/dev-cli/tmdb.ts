import { getConfig } from '@/dev-cli/config';

import { MovieMedia, ShowMedia } from '..';

export async function makeTMDBRequest(url: string, appendToResponse?: string): Promise<Response> {
  const headers: {
    accept: 'application/json';
    authorization?: string;
  } = {
    accept: 'application/json',
  };

  const requestURL = new URL(url);
  const key = getConfig().tmdbApiKey;

  // * JWT keys always start with ey and are ONLY valid as a header.
  // * All other keys are ONLY valid as a query param.
  // * Thanks TMDB.
  if (key.startsWith('ey')) {
    headers.authorization = `Bearer ${key}`;
  } else {
    requestURL.searchParams.append('api_key', key);
  }

  if (appendToResponse) {
    requestURL.searchParams.append('append_to_response', appendToResponse);
  }

  return fetch(requestURL, {
    method: 'GET',
    headers,
  });
}

export async function getMovieMediaDetails(id: string): Promise<MovieMedia> {
  const response = await makeTMDBRequest(`https://api.themoviedb.org/3/movie/${id}`, 'external_ids');
  const movie = await response.json();

  if (movie.success === false) {
    throw new Error(movie.status_message);
  }

  if (!movie.release_date) {
    throw new Error(`${movie.title} has no release_date. Assuming unreleased`);
  }

  return {
    type: 'movie',
    title: movie.title,
    releaseYear: Number(movie.release_date.split('-')[0]),
    tmdbId: id,
    imdbId: movie.imdb_id,
  };
}

export async function getShowMediaDetails(id: string, seasonNumber: string, episodeNumber: string): Promise<ShowMedia> {
  // * TV shows require the TMDB ID for the series, season, and episode
  // * and the name of the series. Needs multiple requests
  let response = await makeTMDBRequest(`https://api.themoviedb.org/3/tv/${id}`, 'external_ids');
  const series = await response.json();

  if (series.success === false) {
    throw new Error(series.status_message);
  }

  if (!series.first_air_date) {
    throw new Error(`${series.name} has no first_air_date. Assuming unaired`);
  }

  response = await makeTMDBRequest(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}`);
  const season = await response.json();

  if (season.success === false) {
    throw new Error(season.status_message);
  }

  response = await makeTMDBRequest(
    `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}`,
  );
  const episode = await response.json();

  if (episode.success === false) {
    throw new Error(episode.status_message);
  }

  return {
    type: 'show',
    title: series.name,
    releaseYear: Number(series.first_air_date.split('-')[0]),
    tmdbId: id,
    episode: {
      number: episode.episode_number,
      tmdbId: episode.id,
    },
    season: {
      number: season.season_number,
      tmdbId: season.id,
    },
    imdbId: series.external_ids.imdb_id,
  };
}
