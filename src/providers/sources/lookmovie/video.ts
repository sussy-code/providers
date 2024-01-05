import { MovieMedia, ShowMedia } from '@/entrypoint/utils/media';
import { Caption, labelToLanguageCode, removeDuplicatedLanguages } from '@/providers/captions';
import { ScrapeContext } from '@/utils/context';

import { StreamsDataResult } from './type';
import { baseUrl } from './util';

export async function getVideoSources(
  ctx: ScrapeContext,
  id: string,
  media: MovieMedia | ShowMedia,
): Promise<StreamsDataResult> {
  // Fetch video sources

  let path = '';
  if (media.type === 'show') {
    path = `/v1/episodes/view`;
  } else if (media.type === 'movie') {
    path = `/v1/movies/view`;
  }
  const data = await ctx.fetcher<StreamsDataResult>(path, {
    baseUrl,
    query: { expand: 'streams,subtitles', id },
  });
  return data;
}

export async function getVideo(
  ctx: ScrapeContext,
  id: string,
  media: MovieMedia | ShowMedia,
): Promise<{ playlist: string | null; captions: Caption[] }> {
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

  let captions: Caption[] = [];

  for (const sub of data.subtitles) {
    const language = labelToLanguageCode(sub.language);
    if (!language) continue;
    captions.push({
      id: sub.url,
      type: 'vtt',
      url: `${baseUrl}${sub.url}`,
      hasCorsRestrictions: false,
      language,
    });
  }

  captions = removeDuplicatedLanguages(captions);

  return {
    playlist: videoUrl,
    captions,
  };
}
