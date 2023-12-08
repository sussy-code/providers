import { MovieMedia, ShowMedia } from '@/main/media';
import { ScrapeContext } from '@/utils/context';

export async function getVideoSources(ctx: ScrapeContext, id: any, media: MovieMedia | ShowMedia): Promise<any> {
  // Fetch video sources

  let url = '';
  if (media.type === 'show') {
    url = `https://lmscript.xyz/v1/episodes/view?expand=streams&id=${id}`;
  } else if (media.type === 'movie') {
    url = `https://lmscript.xyz/v1/movies/view?expand=streams&id=${id}`;
  }
  const data = await ctx.fetcher<any>(url).then((d) => d);
  return data;
}

export async function getVideoUrl(ctx: ScrapeContext, id: any, media: MovieMedia | ShowMedia): Promise<string | null> {
  // Get sources
  const data = await getVideoSources(ctx, id, media);
  const videoSources = data.streams;

  // Find video URL and return it
  const opts = ['auto', '1080p', '1080', '720p', '720', '480p', '480', '240p', '240', '360p', '360', '144', '144p'];

  let videoUrl: string | null = null;
  for (const res of opts) {
    if (videoSources[res] && !videoUrl) {
      videoUrl = videoSources[res];
    }
  }

  return videoUrl;
}
