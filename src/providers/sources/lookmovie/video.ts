import { Config } from './type';

export async function getVideoSources(config: Config): Promise<any> {
  // Fetch video sources
  let url = '';
  if (config.type === 'show') {
    url = `https://www.lookmovie2.to/api/v1/security/episode-access?id_episode=${config.episodeId}&hash=${config.hash}&expires=${config.expires}`;
  } else if (config.type === 'movie') {
    url = `https://www.lookmovie2.to/api/v1/security/movie-access?id_movie=${config.id_movie}&hash=${config.hash}&expires=${config.expires}`;
  }
  const data = await fetch(url).then((d) => d.json());
  return data;
}

export async function getVideoUrl(config: Config): Promise<string | null> {
  // Get sources
  const data = await getVideoSources(config);
  const videoSources = data.streams;

  // Find video URL and return it
  const opts = ['1080p', '1080', '720p', '720', '480p', '480', 'auto'];

  let videoUrl: string | null = null;
  for (const res of opts) {
    if (videoSources[res] && !videoUrl) {
      videoUrl = videoSources[res];
    }
  }

  return videoUrl;
}
