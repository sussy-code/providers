export function getConfig() {
  let tmdbApiKey = process.env.MOVIE_WEB_TMDB_API_KEY ?? '';
  tmdbApiKey = tmdbApiKey.trim();

  if (!tmdbApiKey) {
    throw new Error('Missing MOVIE_WEB_TMDB_API_KEY environment variable');
  }

  let proxyUrl: undefined | string = process.env.MOVIE_WEB_PROXY_URL;
  proxyUrl = !proxyUrl ? undefined : proxyUrl;

  return {
    tmdbApiKey,
    proxyUrl,
  };
}
