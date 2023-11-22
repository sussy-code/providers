import { Config } from './type';
import { MovieMedia, ShowMedia } from '@/main/media';

export async function getVideoSources(id:any,media: MovieMedia | ShowMedia): Promise<any> {
  // Fetch video sources

  let url = '';
  if (media.type === 'show') {
    url = `https://lmscript.xyz/v1/episodes/view?expand=streams&id=${id}`;
  } else if (media.type === 'movie') {
    url = `https://lmscript.xyz/v1/movies/view?expand=streams&id=${id}`;
  }
  const data = await fetch(url).then((d) => d.json());
  return data;
}

export async function getVideoUrl(id:any,media: MovieMedia | ShowMedia): Promise<string | null> {
  // Get sources
  const data = await getVideoSources(id,media);
  const videoSources = data.streams;

  // Find video URL and return it
  const opts = ['1080p', '1080', '720p', '720', '480p', '480','240p','240','360p','360',"144","144p", 'auto'];

  let videoUrl: string | null = null;
  for (const res of opts) {
    if (videoSources[res] && !videoUrl) {
      videoUrl = videoSources[res];
    }
  }

  return videoUrl;
}
