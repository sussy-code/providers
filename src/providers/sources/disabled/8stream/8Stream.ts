import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import getInfo from './getInfo';
import getStream from './getStream';

export async function getMovie(ctx: ShowScrapeContext | MovieScrapeContext, id: string, lang: string = 'English') {
  try {
    const mediaInfo = await getInfo(ctx, id);
    if (mediaInfo?.success) {
      const playlist = mediaInfo?.data?.playlist;
      if (!playlist || !Array.isArray(playlist)) {
        throw new NotFoundError('Playlist not found or invalid');
      }
      let file = playlist.find((item: any) => item?.title === lang);
      if (!file) {
        file = playlist?.[0];
      }
      if (!file) {
        throw new NotFoundError('No file found');
      }
      const availableLang = playlist.map((item: any) => item?.title);
      const key = mediaInfo?.data?.key;
      ctx.progress(70);
      const streamUrl = await getStream(ctx, file?.file, key);
      if (streamUrl?.success) {
        return { success: true, data: streamUrl?.data, availableLang };
      }
      throw new NotFoundError('No stream url found');
    }
    throw new NotFoundError('No media info found');
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new NotFoundError('Failed to fetch movie data');
  }
}

export async function getTV(
  ctx: ShowScrapeContext | MovieScrapeContext,
  id: string,
  season: number,
  episode: number,
  lang: string,
) {
  try {
    const mediaInfo = await getInfo(ctx, id);
    if (!mediaInfo?.success) {
      throw new NotFoundError('No media info found');
    }
    const playlist = mediaInfo?.data?.playlist;
    const getSeason = playlist.find((item: any) => item?.id === season.toString());
    if (!getSeason) {
      throw new NotFoundError('No season found');
    }
    const getEpisode = getSeason?.folder.find((item: any) => item?.episode === episode.toString());
    if (!getEpisode) {
      throw new NotFoundError('No episode found');
    }
    let file = getEpisode?.folder.find((item: any) => item?.title === lang);
    if (!file) {
      file = getEpisode?.folder?.[0];
    }
    if (!file) {
      throw new NotFoundError('No file found');
    }
    const availableLang = getEpisode?.folder.map((item: any) => {
      return item?.title;
    });
    const filterLang = availableLang.filter((item: any) => item?.length > 0);
    const key = mediaInfo?.data?.key;
    ctx.progress(70);
    const streamUrl = await getStream(ctx, file?.file, key);
    if (streamUrl?.success) {
      return {
        success: true,
        data: streamUrl?.data,
        availableLang: filterLang,
      };
    }
    throw new NotFoundError('No stream url found');
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new NotFoundError('Failed to fetch TV data');
  }
}
